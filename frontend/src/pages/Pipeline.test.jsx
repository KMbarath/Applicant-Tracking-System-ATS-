import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import api from '../api/client';
import Pipeline from './Pipeline';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('renders applications with missing candidate or job details without crashing', async () => {
  api.get.mockImplementation((path) => Promise.resolve({
    data: {
      items: path === '/applications'
        ? [{
            id: 1,
            stage: 'Applied',
            applied_at: null,
            candidate: null,
            job: null,
          }]
        : [],
    },
  }));

  render(<Pipeline />);

  expect(await screen.findByText('Unknown candidate')).toBeInTheDocument();
  expect(screen.getByText('Unknown job')).toBeInTheDocument();
  expect(screen.getByText(/date unavailable/)).toBeInTheDocument();
});

test('shows a retryable error for an unexpected API response instead of crashing', async () => {
  api.get.mockResolvedValue({ data: {} });

  render(<Pipeline />);

  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the hiring pipeline.');
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
});
