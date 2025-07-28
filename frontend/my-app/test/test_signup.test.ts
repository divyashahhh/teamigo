import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignupScreen from '../app/auth/signup';
import { supabase } from '../utils/supabaseClient';
import { Alert } from 'react-native';

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock('../utils/supabaseClient');
jest.spyOn(Alert, 'alert');

const mockedAuth = supabase.auth as jest.Mocked<typeof supabase.auth>;

describe('SignupScreen', async () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows error if fields are empty', () => {
    const { getByText } = render(typeof SignupScreen);
    fireEvent.press(getByText('Sign Up'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Missing Info',
      'Please fill in all fields'
    );
  });

  it('shows error if supabase signup fails', async () => {
    mockedAuth.signUp.mockResolvedValueOnce({
      data: {
        user: null,
        session: null,
      },
      error: { message: 'Email already registered' } as any,
    });

    const { getByText, getByPlaceholderText } = render(typeof SignupScreen);
    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Your password'), '12345678');
    fireEvent.press(getByText('Sign Up'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Signup Failed',
        'Email already registered'
      );
    });
  });

  it('signs up successfully and shows alert', async () => {
    mockedAuth.signUp.mockResolvedValueOnce({
      data: {
        user: {
          id: '123',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: { role: 'member' },
          aud: 'authenticated',
          created_at: '2023-01-01T00:00:00Z',
          email_confirmed_at: null},
        },
        session: null,
        error: null,
        } as any);
    });

    const { getByText, getByPlaceholderText } = render(typeof SignupScreen);
    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Your password'), '12345678');
    fireEvent.press(getByText('Sign Up'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Almost there!',
        'Check your inbox to verify your email before logging in.'
      );
    });
  });
