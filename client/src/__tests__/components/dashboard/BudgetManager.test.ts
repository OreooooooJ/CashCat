import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import BudgetManager from '@/components/dashboard/BudgetManager.vue';
import { createPinia, setActivePinia } from 'pinia';

// Mock the useBudgetStore
vi.mock('@/stores/budget', () => ({
  useBudgetStore: () => ({
    budgets: [
      {
        id: 1,
        category: 'Food',
        amount: 500,
        spent: 300,
        remaining: 200,
        percentageUsed: 60.0
      },
      {
        id: 2,
        category: 'Entertainment',
        amount: 200,
        spent: 150,
        remaining: 50,
        percentageUsed: 75.0
      }
    ],
    fetchBudgets: vi.fn()
  })
}));

describe('BudgetManager', () => {
  it('renders properly', () => {
    setActivePinia(createPinia());
    const wrapper = mount(BudgetManager);
    expect(wrapper.exists()).toBe(true);
  });
}); 