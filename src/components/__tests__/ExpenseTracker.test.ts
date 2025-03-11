import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ExpenseTracker from '../ExpenseTracker.vue'
import { expenseService } from '../../services/expenseService'
import type { Expense } from '../../types/expense'

// Mock the expense service
vi.mock('../../services/expenseService', () => ({
  expenseService: {
    addExpense: vi.fn(),
    getExpenses: vi.fn(),
  },
}))

describe('ExpenseTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Initialize with empty expenses by default
    ;(expenseService.getExpenses as any).mockResolvedValue([])
  })

  it('renders the form and expenses list', async () => {
    const wrapper = mount(ExpenseTracker)
    await flushPromises()

    // Check form elements
    expect(wrapper.find('input#amount').exists()).toBe(true)
    expect(wrapper.find('input#description').exists()).toBe(true)
    expect(wrapper.find('select#category').exists()).toBe(true)
    expect(wrapper.find('input#receipt').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)

    // Check expenses list section
    expect(wrapper.find('.expenses-list').exists()).toBe(true)
    expect(wrapper.text()).toContain('Recent Expenses')
  })

  it('displays loading state while fetching expenses', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })
    ;(expenseService.getExpenses as any).mockReturnValue(promise)

    const wrapper = mount(ExpenseTracker)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.expenses-list').text()).toContain('Loading')

    // Resolve the promise to clean up
    resolvePromise!([])
    await flushPromises()
  })

  it('shows empty state when no expenses exist', async () => {
    ;(expenseService.getExpenses as any).mockResolvedValue([])
    const wrapper = mount(ExpenseTracker)

    await flushPromises()

    expect(wrapper.find('.expenses-list').text()).toContain('No expenses yet')
  })

  it('submits new expense correctly', async () => {
    const wrapper = mount(ExpenseTracker)
    await flushPromises()

    // Set form values
    await wrapper.find('input#amount').setValue(42.5)
    await wrapper.find('input#description').setValue('Test expense')
    await wrapper.find('select#category').setValue('food')

    // Mock successful expense addition
    ;(expenseService.addExpense as any).mockResolvedValueOnce('new-expense-id')

    // Submit the form
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // Verify service was called with correct data
    expect(expenseService.addExpense).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 42.5,
        description: 'Test expense',
        category: 'food',
        date: expect.any(Date),
      }),
      undefined
    )

    // Verify form was reset
    const amountInput = wrapper.find('input#amount').element as HTMLInputElement
    const descriptionInput = wrapper.find('input#description').element as HTMLInputElement
    const categorySelect = wrapper.find('select#category').element as HTMLSelectElement

    expect(amountInput.value).toBe('0')
    expect(descriptionInput.value).toBe('')
    expect(categorySelect.value).toBe('other')
  })

  it('displays expenses from the service', async () => {
    const mockExpenses = [
      {
        id: '1',
        amount: 42.5,
        description: 'Test expense',
        category: 'food',
        date: new Date('2024-03-10'),
      },
    ]

    ;(expenseService.getExpenses as any).mockResolvedValueOnce(mockExpenses)

    const wrapper = mount(ExpenseTracker)
    await flushPromises()

    const expenseItem = wrapper.find('.expense-item')
    expect(expenseItem.exists()).toBe(true)
    expect(expenseItem.text()).toContain('42.50')
    expect(expenseItem.text()).toContain('Test expense')
    expect(expenseItem.text()).toContain('food')
  })

  it('handles file upload', async () => {
    const wrapper = mount(ExpenseTracker)
    await flushPromises()

    const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' })

    // Mock the file input event
    const input = wrapper.find('input#receipt').element as HTMLInputElement
    Object.defineProperty(input, 'files', {
      value: [file],
    })
    await wrapper.find('input#receipt').trigger('change')

    // Set other form values
    await wrapper.find('input#amount').setValue(50)
    await wrapper.find('input#description').setValue('Test with receipt')
    await wrapper.find('select#category').setValue('food')

    // Mock successful expense addition
    ;(expenseService.addExpense as any).mockResolvedValueOnce('new-expense-id')

    // Submit form
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // Verify service was called with file
    expect(expenseService.addExpense).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 50,
        description: 'Test with receipt',
        category: 'food',
        date: expect.any(Date),
      }),
      file
    )
  })
})
