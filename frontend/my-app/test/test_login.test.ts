import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../app/auth/login';
import { supabase } from '../utils/supabaseClient';
import { Alert } from 'react-native';
import { AuthError } from '@supabase/supabase-js';

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock('../utils/supabaseClient');
jest.spyOn(Alert, 'alert');

const mockedAuth = supabase.auth as jest.Mocked<typeof supabase.auth>;
const mockedFrom = supabase.from as unknown as jest.Mock;

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows error if email or password is missing', () => {
    const { getByText } = render(typeof LoginScreen);
    fireEvent.press(getByText('Log In'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Missing Info',
      'Please fill in all fields'
    );
  });

  it('shows error if Supabase login fails', async () => {
    mockedAuth.signInWithPassword.mockResolvedValue({
      data: {
        user: null,
        session: null,
      },
      error: new AuthError('Invalid login'),
    });

    const { getByText, getByPlaceholderText } = render(typeof LoginScreen);
    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Your password'), 'wrongpass');
    fireEvent.press(getByText('Log In'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Login Failed', 'Invalid login');
    });
  });

  it('logs in and routes correctly on success', async () => {
    mockedAuth.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: '123',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: { role: 'host' },
          aud: 'authenticated',
          created_at: '2023-01-01T00:00:00Z',
          email_confirmed_at: '2023-01-01T00:00:00Z',
        },
        session: {
          access_token: 'token123',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'refresh123',
          user: {
            id: '123',
            email: 'test@example.com',
            app_metadata: {},
            user_metadata: { role: 'host' },
            aud: 'authenticated',
            created_at: '2023-01-01T00:00:00Z',
            email_confirmed_at: '2023-01-01T00:00:00Z',
          },
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      },
      error: null,
    });

    mockedFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: { role: 'host' },
              error: null,
            }),
        }),
      }),
    });

    const { getByText, getByPlaceholderText } = render(typeof LoginScreen);
    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Your password'), 'correctpass');
    fireEvent.press(getByText('Log In'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Login Successful', 'Welcome back, host!');
    });
  });
});