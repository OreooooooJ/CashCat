import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '../DefaultLayout.vue';

// Mock components
vi.mock('@heroicons/vue/24/outline', () => ({
  BellIcon: {
    render: () => null
  },
  MoonIcon: {
    render: () => null
  },
  SunIcon: {
    render: () => null
  }
}));

vi.mock('../../components/layout/AppSidebar/index.vue', () => ({
  default: {
    name: 'AppSidebar',
    render: () => null
  }
}));

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: { template: '<div>Home</div>' }
    }
  ]
});

describe('DefaultLayout', () => {
  it('should initialize with dark mode when system prefers it', async () => {
    // Mock system preference for dark mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    });
    
    // Mock document.documentElement
    const classList = {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn().mockReturnValue(false)
    };
    
    Object.defineProperty(document, 'documentElement', {
      writable: true,
      value: { classList }
    });
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn()
      }
    });
    
    const wrapper = mount(DefaultLayout, {
      global: {
        plugins: [
          createPinia(),
          router
        ],
        stubs: {
          RouterView: true
        }
      }
    });

    await flushPromises();
    
    // Should initialize with dark mode
    expect(classList.add).toHaveBeenCalledWith('dark');
  });
}); 