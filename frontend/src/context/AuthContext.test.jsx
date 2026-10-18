import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import api from '../api/client';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

function AuthStatus() {
  const { user, ready } = useAuth();
  return <p>{!ready ? 'Checking session' : user ? user.name : 'Signed out'}</p>;
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

test('clears expired cached sessions instead of restoring the cached user', async () => {
  localStorage.setItem('ats_token', 'expired-token');
  localStorage.setItem('ats_user', JSON.stringify({ name: 'Old user' }));
  api.get.mockRejectedValue({ response: { status: 401 } });

  render(
    <AuthProvider>
      <AuthStatus />
    </AuthProvider>,
  );

  expect(await screen.findByText('Signed out')).toBeInTheDocument();
  await waitFor(() => {
    expect(localStorage.getItem('ats_token')).toBeNull();
    expect(localStorage.getItem('ats_user')).toBeNull();
  });
});

test('keeps cached login usable when session validation cannot reach the API', async () => {
  localStorage.setItem('ats_token', 'valid-token');
  localStorage.setItem('ats_user', JSON.stringify({ name: 'Demo Recruiter' }));
  api.get.mockRejectedValue(new Error('Network unavailable'));

  render(
    <AuthProvider>
      <AuthStatus />
    </AuthProvider>,
  );

  expect(await screen.findByText('Demo Recruiter')).toBeInTheDocument();
});
