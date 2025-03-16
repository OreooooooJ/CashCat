import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTransactionStore } from '@/stores/transaction'
import type { Transaction } from '@/types/transaction'

// Mock fetch
global.fetch = vi.fn() as unknown as typeof fetch

// Helper to mock fetch responses
function mockFetchResponse(data: any, ok = true): Response {
  return {
    ok,
    json: () => Promise.resolve(data),
    headers: new Headers(),
    redirected: false,
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
    type: 'basic' as ResponseType,
    url: '',
    clone: function() { return this },
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve('')
  } as Response
}

describe('Transaction Store', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
    
    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('fake-token')
    
    // Reset fetch mock
    vi.mocked(fetch).mockReset()
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })
  
  describe('fetchTransactions', () => {
    it('should fetch transactions successfully', async () => {
      const mockTransactions = [
        {
          id: 'trans1',
          amount: 100,
          type: 'INCOME',
          category: 'Income',
          description: 'Test Income',
          date: new Date().toISOString(),
          accountId: 'acc1',
          userId: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      
      vi.mocked(fetch).mockResolvedValue(mockFetchResponse(mockTransactions))
      
      const transactionStore = useTransactionStore()
      await transactionStore.fetchTransactions()
      
      expect(transactionStore.transactions.length).toBe(1)
      expect(transactionStore.transactions[0].amount).toBe(100)
      expect(transactionStore.isLoading).toBe(false)
      expect(transactionStore.error).toBeNull()
    })
    
    it('should handle fetch error', async () => {
      vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ error: 'Failed to fetch' }, false))
      
      const transactionStore = useTransactionStore()
      
      try {
        await transactionStore.fetchTransactions()
      } catch (error) {
        // Expected to throw
      }
      
      expect(transactionStore.isLoading).toBe(false)
      expect(transactionStore.error).not.toBeNull()
    })
    
    it('should handle authentication error', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce(null)
      
      const transactionStore = useTransactionStore()
      
      try {
        await transactionStore.fetchTransactions()
      } catch (error) {
        // Expected to throw
      }
      
      expect(transactionStore.isLoading).toBe(false)
      expect(transactionStore.error).toBe('Not authenticated')
    })
  })
  
  describe('addTransaction', () => {
    it('should add a transaction successfully', async () => {
      const newTransaction = {
        amount: 100,
        type: 'INCOME',
        category: 'Income',
        description: 'Test Income',
        date: new Date(),
        accountId: 'acc1'
      }
      
      const mockResponse = {
        id: 'new-trans-id',
        ...newTransaction,
        date: newTransaction.date.toISOString(),
        userId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      vi.mocked(fetch).mockResolvedValue(mockFetchResponse(mockResponse))
      
      const transactionStore = useTransactionStore()
      const result = await transactionStore.addTransaction(newTransaction)
      
      expect(result).toEqual(mockResponse)
      expect(transactionStore.transactions.length).toBe(1)
      expect(transactionStore.transactions[0].id).toBe('new-trans-id')
    })
    
    it('should handle negative amounts for expenses', async () => {
      const newTransaction = {
        amount: -50, // Negative amount
        type: 'EXPENSE',
        category: 'Food & Dining',
        description: 'Groceries',
        date: new Date(),
        accountId: 'acc1'
      }
      
      const mockResponse = {
        id: 'new-trans-id',
        ...newTransaction,
        amount: 50, // Server stores positive amount
        date: newTransaction.date.toISOString(),
        userId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      vi.mocked(fetch).mockResolvedValue(mockFetchResponse(mockResponse))
      
      const transactionStore = useTransactionStore()
      await transactionStore.addTransaction(newTransaction)
      
      // Verify the amount was converted to positive before sending to server
      expect(fetch).toHaveBeenCalledWith(
        '/api/transactions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"amount":50') // Positive amount
        })
      )
    })
  })
  
  describe('deleteTransaction', () => {
    it('should delete a transaction successfully', async () => {
      // First add transactions
      const transactions = [
        {
          id: 'trans1',
          amount: 100,
          type: 'INCOME',
          category: 'Income',
          description: 'Test Income',
          date: new Date().toISOString(),
          accountId: 'acc1',
          userId: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'trans2',
          amount: 50,
          type: 'EXPENSE',
          category: 'Food & Dining',
          description: 'Groceries',
          date: new Date().toISOString(),
          accountId: 'acc1',
          userId: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      
      vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(transactions))
      
      const transactionStore = useTransactionStore()
      await transactionStore.fetchTransactions()
      
      expect(transactionStore.transactions.length).toBe(2)
      
      // Now delete one transaction
      vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse({}, true))
      
      await transactionStore.deleteTransaction('trans1')
      
      expect(transactionStore.transactions.length).toBe(1)
      expect(transactionStore.transactions[0].id).toBe('trans2')
    })
  })
  
  describe('groupTransactionsByPeriod', () => {
    it('should group transactions by month', async () => {
      const transactions = [
        {
          id: 'trans1',
          amount: 100,
          type: 'INCOME',
          category: 'Income',
          description: 'January Income',
          date: new Date(2025, 0, 15).toISOString(), // January 15, 2025
          accountId: 'acc1',
          userId: 'user1'
        },
        {
          id: 'trans2',
          amount: 200,
          type: 'INCOME',
          category: 'Income',
          description: 'January Income 2',
          date: new Date(2025, 0, 20).toISOString(), // January 20, 2025
          accountId: 'acc1',
          userId: 'user1'
        },
        {
          id: 'trans3',
          amount: 50,
          type: 'EXPENSE',
          category: 'Food & Dining',
          description: 'February Expense',
          date: new Date(2025, 1, 10).toISOString(), // February 10, 2025
          accountId: 'acc1',
          userId: 'user1'
        }
      ]
      
      vi.mocked(fetch).mockResolvedValue(mockFetchResponse(transactions))
      
      const transactionStore = useTransactionStore()
      await transactionStore.fetchTransactions()
      
      const grouped = transactionStore.groupTransactionsByPeriod('month')
      
      expect(Object.keys(grouped).length).toBe(2) // Two months
      expect(grouped['January 2025'].length).toBe(2) // Two transactions in January
      expect(grouped['February 2025'].length).toBe(1) // One transaction in February
    })
    
    it('should calculate period totals correctly', async () => {
      const transactions = [
        {
          id: 'trans1',
          amount: 100,
          type: 'INCOME',
          category: 'Income',
          description: 'Income 1',
          date: new Date(2025, 0, 15).toISOString(),
          accountId: 'acc1',
          userId: 'user1'
        },
        {
          id: 'trans2',
          amount: 50,
          type: 'EXPENSE',
          category: 'Food & Dining',
          description: 'Expense 1',
          date: new Date(2025, 0, 20).toISOString(),
          accountId: 'acc1',
          userId: 'user1'
        }
      ]
      
      vi.mocked(fetch).mockResolvedValue(mockFetchResponse(transactions))
      
      const transactionStore = useTransactionStore()
      await transactionStore.fetchTransactions()
      
      const periodTotals = transactionStore.getPeriodTotals('month')
      
      expect(periodTotals['January 2025'].income).toBe(100)
      expect(periodTotals['January 2025'].expenses).toBe(50)
      expect(periodTotals['January 2025'].net).toBe(50) // 100 - 50
    })
  })
}) 