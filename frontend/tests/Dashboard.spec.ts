import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from '../src/views/Dashboard.vue';

const getMock = vi.fn();
const postMock = vi.fn();

vi.mock('../src/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
  },
  setToken: vi.fn(),
  getToken: vi.fn(() => 'token'),
  clearToken: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('Dashboard.vue', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
  });

  it('renders plans returned by the API with their projected balance', async () => {
    getMock.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          name: 'Retire early',
          current_age: 30,
          retirement_age: 55,
          current_savings: 50000,
          monthly_contribution: 1000,
          annual_return: 7,
          projectedBalance: 987654,
        },
      ],
    });

    const wrapper = mount(Dashboard);
    await flushPromises();

    expect(getMock).toHaveBeenCalledWith('/plans');
    expect(wrapper.text()).toContain('Retire early');
    expect(wrapper.text()).toContain('987,654');
  });

  it('shows an empty state when there are no plans', async () => {
    getMock.mockResolvedValueOnce({ data: [] });

    const wrapper = mount(Dashboard);
    await flushPromises();

    expect(wrapper.text()).toContain('No plans yet');
  });
});
