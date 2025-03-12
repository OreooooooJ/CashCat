import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BudgetManager from '@/components/dashboard/BudgetManager.vue';
import { createPinia, setActivePinia } from 'pinia';

describe('BudgetManager', () => {
  it('renders properly', () => {
    setActivePinia(createPinia());
    const wrapper = mount(BudgetManager);
    expect(wrapper.exists()).toBe(true);
  });
}); 