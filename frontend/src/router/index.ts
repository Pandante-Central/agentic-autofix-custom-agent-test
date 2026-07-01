import { createRouter, createWebHistory } from 'vue-router';
import { getToken } from '../api/client';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'login', component: () => import('../views/Login.vue') },
  { path: '/register', name: 'register', component: () => import('../views/Register.vue') },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/plans/:id',
    name: 'plan-detail',
    component: () => import('../views/PlanDetail.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/calculator',
    name: 'calculator',
    component: () => import('../views/Calculator.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/Settings.vue'),
    meta: { requiresAuth: true },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !getToken()) {
    return { name: 'login' };
  }
});
