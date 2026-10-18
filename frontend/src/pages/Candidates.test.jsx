import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import api from '../api/client';
import Candidates from './Candidates';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('omits empty numeric filters when loading candidates', async () => {
  api.get.mockResolvedValue({
    data: { items: [], page: 1, page_size: 20, total: 0 },
  });

  render(
    <MemoryRouter>
      <Candidates />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(api.get).toHaveBeenCalledWith('/candidates', {
      params: {
        sort_by: 'created_at',
        order: 'desc',
        page: 1,
      },
    });
  });
});

test('shows a readable API validation error and allows retry', async () => {
  api.get.mockRejectedValue({
    response: {
      data: {
        detail: [{ type: 'int_parsing', msg: 'Input should be a valid integer' }],
      },
    },
  });

  render(
    <MemoryRouter>
      <Candidates />
    </MemoryRouter>,
  );

  expect(await screen.findByText('Input should be a valid integer')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
});
