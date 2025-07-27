import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CalendarScreen from '../app/(member)/(tabs)/calendar';
import { supabase } from '../utils/supabaseClient';
import { Alert } from 'react-native';

jest.mock('../utils/supabaseClient', () => {
  const originalModule = jest.requireActual('../utils/supabaseClient');
  return {
    ...originalModule,
    supabase: {
      ...originalModule.supabase,
      from: jest.fn(),
    },
  };
});

jest.spyOn(Alert, 'alert');

const mockedFrom = supabase.from as jest.Mock;

describe('CalendarScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds a new event', async () => {
    mockedFrom.mockReturnValueOnce({
      insert: jest.fn().mockResolvedValue({
        data: [{ id: '1', text: 'Test Event', color: '#FF0000' }],
        error: null,
      }),
    });

    const { getByTestId, getByPlaceholderText } = render(typeof CalendarScreen);
    fireEvent.press(getByTestId('add-button'));
    fireEvent.changeText(getByPlaceholderText('Event Title'), 'Test Event');
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Event saved!');
    });
  });

  it('updates an event', async () => {
    mockedFrom.mockReturnValueOnce({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ id: '1', text: 'Updated Event' }],
          error: null,
        }),
      }),
    });

    const { getByTestId, getByPlaceholderText } = render(typeof CalendarScreen);
    fireEvent.changeText(getByPlaceholderText('Event Title'), 'Updated Event');
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Event updated!');
    });
  });

  it('deletes an event', async () => {
    mockedFrom.mockReturnValueOnce({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ id: '1' }],
          error: null,
        }),
      }),
    });

    const { getByTestId } = render(typeof CalendarScreen);
    fireEvent.press(getByTestId('delete-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Deleted', 'Event removed');
    });
  });
});