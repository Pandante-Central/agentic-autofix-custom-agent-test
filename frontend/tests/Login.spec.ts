import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';
import Login from '../src/views/Login.vue';

const postMock = vi.fn();

vi.mock('../src/api/client', () => ({
  apiClient: { post: (...args: unknown[]) => postMock(...args) },
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
  clearToken: vi.fn(),
}));

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/login', name: 'login', component: Login },
      { path: '/dashboard', name: 'dashboard', component: { template: '<div/>' } },
    ],
  });
}

describe('Login.vue', () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it('submits credentials and navigates to the dashboard on success', async () => {
    postMock.mockResolvedValueOnce({ data: { token: 'abc123', user: { id: 1, username: 'alice' } } });
    const router = makeRouter();
    router.push('/login');
    await router.isReady();

    const wrapper = mount(Login, { global: { plugins: [router] } });

    await wrapper.find('#username').setValue('alice');
    await wrapper.find('#password').setValue('hunter2');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(postMock).toHaveBeenCalledWith('/auth/login', { username: 'alice', password: 'hunter2' });
    expect(router.currentRoute.value.name).toBe('dashboard');
  });

  it('shows an error message when login fails', async () => {
    postMock.mockRejectedValueOnce({ response: { data: { error: 'Invalid credentials' } } });
    const router = makeRouter();
    router.push('/login');
    await router.isReady();

    const wrapper = mount(Login, { global: { plugins: [router] } });

    await wrapper.find('#username').setValue('alice');
    await wrapper.find('#password').setValue('wrong');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.text()).toContain('Invalid credentials');
  });
});
