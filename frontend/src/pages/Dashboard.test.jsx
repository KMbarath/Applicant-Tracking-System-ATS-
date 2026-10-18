import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import api from '../api/client';
import Dashboard from './Dashboard';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('recharts', () => {
  const Chart = ({ children }) => <div>{children}</div>;
  return {
    Bar: Chart,
    BarChart: Chart,
    Line: Chart,
    LineChart: Chart,
    ResponsiveContainer: Chart,
    Tooltip: Chart,
    XAxis: Chart,
    YAxis: Chart,
  };
});

test('shows a recoverable error when dashboard requests fail', async () => {
  api.get.mockRejectedValue({
    response: {
      data: {
        detail: [{ type: 'datetime_parsing', msg: 'Input should be a valid datetime' }],
      },
    },
  });

  render(<Dashboard />);

  expect(await screen.findByText('Input should be a valid datetime')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
});

test('omits blank optional date filters from dashboard API requests', async () => {
  api.get.mockImplementation((url) => {
    const data = url === '/jobs'
      ? { items: [] }
      : url === '/dashboard/summary'
        ? { total_candidates: 0 }
        : url === '/dashboard/recent-activity'
          ? []
          : [];
    return Promise.resolve({ data });
  });

  render(<Dashboard />);

  await waitFor(() => {
    expect(api.get).toHaveBeenCalledWith('/dashboard/summary', { params: {} });
  });
});
