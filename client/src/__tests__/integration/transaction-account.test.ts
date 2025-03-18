import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTransactionStore } from '@/stores/transaction'
import { useAccountStore } from '@/stores/account'
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

describe('Transaction-Account Integration', () => {
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
  
  it('should fetch accounts and their transactions', async () => {
    // Mock accounts data
    const mockAccounts = [
      {
        id: 'acc1',
        name: 'Checking Account',
        type: 'debit',
        balance: 1000,
        institution: 'Test Bank',
        lastFour: '1234',
        color: '#3B82F6',
        userId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    
    // Mock transactions for the account
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
    
    // Setup API mocks
    vi.mocked(api.get)
      .mockImplementation(async (url) => {
        if (url === '/api/accounts') {
          return { data: mockAccounts, status: 200 }
        } else if (url.startsWith('/api/accounts/acc1/transactions')) {
          return { data: mockTransactions, status: 200 }
        } else if (url.startsWith('/api/transactions')) {
          return { data: mockTransactions, status: 200 }
        }
        throw new Error(`Unexpected URL: ${url}`)
      })
    
    // Initialize stores
    const accountStore = useAccountStore()
    const transactionStore = useTransactionStore()
    
    // Fetch accounts
    await accountStore.fetchAccounts()
    
    // Verify accounts were fetched
    expect(accountStore.accounts.length).toBe(1)
    expect(accountStore.accounts[0].id).toBe('acc1')
    
    // Fetch transactions for the account
    const accountTransactions = await accountStore.getAccountTransactions('acc1')
    
    // Verify transactions were fetched
    expect(accountTransactions.length).toBe(1)
    expect(accountTransactions[0].accountId).toBe('acc1')
  })
  
  it('should add a transaction linked to an account', async () => {
    // Mock accounts data
    const mockAccounts = [
      {
        id: 'acc1',
        name: 'Checking Account',
        type: 'debit',
        balance: 1000,
        institution: 'Test Bank',
        lastFour: '1234',
        color: '#3B82F6',
        userId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    
    // Setup API mocks for accounts
    vi.mocked(api.get).mockResolvedValue({ data: mockAccounts, status: 200 })
    
    // Initialize stores
    const accountStore = useAccountStore()
    const transactionStore = useTransactionStore()
    
    // Fetch accounts
    await accountStore.fetchAccounts()
    
    // New transaction to add
    const newTransaction = {
      amount: 100,
      type: 'INCOME' as const,
      category: 'Income',
      description: 'Test Income',
      date: new Date(),
      accountId: 'acc1' // Link to the account
    }
    
    // Mock response for adding transaction
    const mockAddResponse = {
      id: 'new-trans-id',
      ...newTransaction,
      date: newTransaction.date.toISOString(),
      userId: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Setup API mock for adding transaction
    vi.mocked(api.post).mockResolvedValue({ data: mockAddResponse, status: 201 })
    
    // Add the transaction
    const result = await transactionStore.addTransaction(newTransaction)
    
    // Verify transaction was added with the correct account ID
    expect(result.id).toBe('new-trans-id')
    expect(result.accountId).toBe('acc1')
  })
  
  it('should handle transactions with no account', async () => {
    // New transaction with no account
    const newTransaction = {
      amount: 100,
      type: 'INCOME' as const,
      category: 'Income',
      description: 'Test Income',
      date: new Date()
      // No accountId
    }
    
    // Mock response for adding transaction
    const mockAddResponse = {
      id: 'new-trans-id',
      ...newTransaction,
      date: newTransaction.date.toISOString(),
      userId: 'user1',
      accountId: undefined, // Match the behavior in the app
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Setup API mock for adding transaction
    vi.mocked(api.post).mockResolvedValue({ data: mockAddResponse, status: 201 })
    
    // Initialize store
    const transactionStore = useTransactionStore()
    
    // Add the transaction
    const result = await transactionStore.addTransaction(newTransaction)
    
    // Verify transaction was added without an account ID
    expect(result.accountId).toBeUndefined()
  })
}) 