import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RecentTransactions from '@/components/dashboard/RecentTransactions.vue'
import type { Transaction } from '@/types/transaction'

describe('RecentTransactions', () => {
  it('renders properly with no transactions', () => {
    const wrapper = mount(RecentTransactions, {
      props: {
        transactions: []
      }
    })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('No transactions yet')
  })

  it('renders transactions when provided', () => {
    const transactions: Transaction[] = [
      {
        id: 't1',
        amount: 100,
        type: 'INCOME',
        category: 'Test Category',
        description: 'Test Vendor',
        date: new Date(),
        accountId: 'acc1'
      }
    ]
    const wrapper = mount(RecentTransactions, {
      props: {
        transactions
      }
    })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Vendor')
    expect(wrapper.text()).toContain('Test Category')
  })
}) 