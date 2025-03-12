import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BalanceCard from '@/components/dashboard/BalanceCard.vue';

describe('BalanceCard', () => {
  it('renders properly with zero values', () => {
    const wrapper = mount(BalanceCard, {
      props: {
        totalIncome: 0,
        totalExpenses: 0
      }
    });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('$0.00');
  });

  it('calculates net balance correctly', () => {
    const wrapper = mount(BalanceCard, {
      props: {
        totalIncome: 1000,
        totalExpenses: 400
      }
    });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('$1,000.00');
    expect(wrapper.text()).toContain('$400.00');
    expect(wrapper.text()).toContain('$600.00');
  });
}); 