import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../app/(member)/(tabs)/profile';
import { supabase } from '../utils/supabaseClient';
import { Alert } from 'react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock('../utils/supabaseClient');
jest.spyOn(Alert, 'alert');

const mockedFrom = supabase.from as unknown as jest.Mock;

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates profile fields and calls supabase update', async () => {
    // mock supabase update response
    mockedFrom.mockReturnValueOnce({
      update: () => ({
        eq: () => Promise.resolve({
          data: [{ name: 'New Name', bio: 'New Bio' }],
          error: null,
        }),
      }),
    });

    const { getByTestId, getByPlaceholderText, getByText } = render(typeof ProfileScreen);

    fireEvent.changeText(getByPlaceholderText('Name'), 'New Name');
    fireEvent.changeText(getByPlaceholderText('Description'), 'New Bio');

    fireEvent.press(getByTestId('Save Changes'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Profile updated');
    });
  });

  it('shows error if profile update fails', async () => {
    mockedFrom.mockReturnValueOnce({
      update: () => ({
        eq: () => Promise.resolve({
          data: null,
          error: { message: 'Failed to update' },
        }),
      }),
    });

    const { getByTestId, getByPlaceholderText } = render(typeof ProfileScreen);

    fireEvent.changeText(getByPlaceholderText('Your Name'), 'Error Name');
    fireEvent.press(getByTestId('Save Changes'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update');
    });
  });

  it('uploads image (mocked)', async () => {
    // Mock image upload 
    const mockUploadFn = jest.fn(() =>
      Promise.resolve('https://cloudinary.com/fake-profile.jpg')
    );

    
    const { getByTestId } = render(typeof ProfileScreen);
    fireEvent.press(getByTestId('upload-button')); //simulate

    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Image uploaded');
    });
  });
});