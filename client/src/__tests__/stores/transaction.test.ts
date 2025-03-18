import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTransactionStore } from '@/stores/transaction'
import type { Transaction } from '@/types/transaction'
import api from '@/utils/api'

// Mock the api module
vi.mock('@/utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('Transaction Store', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
    
    // Reset API mocks
    vi.mocked(api.get).mockReset()
    vi.mocked(api.post).mockReset()
    vi.mocked(api.put).mockReset()
    vi.mocked(api.delete).mockReset()
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
      
      // Mock the API response
      vi.mocked(api.get).mockResolvedValue({ 
        data: mockTransactions, 
        status: 200 
      })
      
      const transactionStore = useTransactionStore()
      await transactionStore.fetchTransactions()
      
      expect(transactionStore.transactions.length).toBe(1)
      expect(transactionStore.transactions[0].amount).toBe(100)
      expect(transactionStore.isLoading).toBe(false)
      expect(transactionStore.error).toBeNull()
    })
    
    it('should handle fetch error', async () => {
      // Mock a failed API response
      vi.mocked(api.get).mockRejectedValue(new Error('API error'))
      
      const transactionStore = useTransactionStore()
      
      await transactionStore.fetchTransactions()
      
      expect(transactionStore.isLoading).toBe(false)
      expect(transactionStore.error).not.toBeNull()
    })
  })
  
  describe('addTransaction', () => {
    it('should add a transaction successfully', async () => {
      const newTransaction = {
        amount: 100,
        type: 'INCOME' as const,
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
      
      vi.mocked(api.post).mockResolvedValue({ data: mockResponse, status: 201 })
      
      const transactionStore = useTransactionStore()
      const result = await transactionStore.addTransaction(newTransaction)
      
      expect(result.id).toBe('new-trans-id')
      expect(transactionStore.transactions.length).toBe(1)
      expect(transactionStore.transactions[0].id).toBe('new-trans-id')
    })
  })
  
  describe('deleteTransaction', () => {
    it('should delete a transaction successfully', async () => {
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
      
      // Mock getting the transactions
      vi.mocked(api.get).mockResolvedValue({ data: transactions, status: 200 })
      
      const transactionStore = useTransactionStore()
      await transactionStore.fetchTransactions()
      
      // Mock successful deletion
      vi.mocked(api.delete).mockResolvedValue({ data: {}, status: 200 })
      
      await transactionStore.deleteTransaction('trans1')
      
      expect(transactionStore.transactions.length).toBe(1)
      expect(transactionStore.transactions[0].id).toBe('trans2')
    })
  })
}) 