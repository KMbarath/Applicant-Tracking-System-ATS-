import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Login from './Login';

vi.mock('../api/client', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const login = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ login });
});

test('renders a blank sign-in form without local demo credentials', () => {
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>,
  );

  expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  expect(screen.getByLabelText('Email')).toHaveValue('');
  expect(screen.queryByText(/seeded locally/i)).not.toBeInTheDocument();
});

test('registers a recruiter and signs them in', async () => {
  api.post.mockResolvedValue({ data: { id: 1 } });
  login.mockResolvedValue(undefined);

  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Demo Recruiter' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'recruiter@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'SecurePass123!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create account', exact: true }));

  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Demo Recruiter',
      email: 'recruiter@example.com',
      password: 'SecurePass123!',
    });
    expect(login).toHaveBeenCalledWith({
      email: 'recruiter@example.com',
      password: 'SecurePass123!',
    });
  });
});
