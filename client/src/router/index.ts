import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import DashboardView from '../views/DashboardView.vue';
import LoginView from '../views/LoginView.vue';

// Use a constant for base URL to avoid import.meta.env typing issues
const BASE_URL = '/'; // Default to root path

const router = createRouter({
  history: createWebHistory(BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: DefaultLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard'
        },
        {
          path: '/dashboard',
          name: 'dashboard',
          component: DashboardView
        },
        {
          path: '/transactions',
          name: 'transactions',
          component: () => import('@/views/TransactionsView.vue')
        },
        {
          path: '/accounts',
          name: 'accounts',
          component: () => import('@/views/AccountsView.vue')
        },
        {
          path: '/accounts/:id',
          name: 'account-detail',
          component: () => import('@/views/AccountDetailView.vue')
        },
        {
          path: '/analytics',
          name: 'analytics',
          component: () => import('@/views/AnalyticsView.vue')
        },
        {
          path: '/settings',
          name: 'settings',
          component: () => import('@/views/SettingsView.vue')
        }
      ]
    }
  ]
});

// Helper function to check authentication status
function isUserAuthenticated() {
  // AUTHENTICATION TEMPORARILY DISABLED
  // Always return true to bypass authentication checks
  return true;
  
  /* Original authentication logic:
  try {
    // Check if we're in a browser environment
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('token') !== null;
    }
    return false;
  } catch (_) {
    return false;
  }
  */
}

// Navigation guard
router.beforeEach((to, from, next) => {
  const isAuthenticated = isUserAuthenticated();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false);

  if (requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && isAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
