import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTransactionStore } from '@/stores/transaction'
import { useAccountStore } from '@/stores/account'

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

describe('Transaction-Account Integration', () => {
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
    
    // Setup fetch mocks
    vi.mocked(fetch)
      .mockResolvedValueOnce(mockFetchResponse(mockAccounts)) // For fetchAccounts
      .mockResolvedValueOnce(mockFetchResponse(mockTransactions)) // For getAccountTransactions
    
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
    
    // Setup fetch mocks for accounts
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(mockAccounts))
    
    // Initialize stores
    const accountStore = useAccountStore()
    const transactionStore = useTransactionStore()
    
    // Fetch accounts
    await accountStore.fetchAccounts()
    
    // New transaction to add
    const newTransaction = {
      amount: 100,
      type: 'INCOME',
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
    
    // Setup fetch mock for adding transaction
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(mockAddResponse))
    
    // Add the transaction
    const result = await transactionStore.addTransaction(newTransaction)
    
    // Verify transaction was added with the correct account ID
    expect(result.accountId).toBe('acc1')
    expect(transactionStore.transactions.length).toBe(1)
    expect(transactionStore.transactions[0].accountId).toBe('acc1')
    
    // Verify the request was made with the account ID
    expect(fetch).toHaveBeenCalledWith(
      '/api/transactions',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"accountId":"acc1"')
      })
    )
  })
  
  it('should handle transactions with no account', async () => {
    // New transaction with no account
    const newTransaction = {
      amount: 100,
      type: 'INCOME',
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
      accountId: null, // No account
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Setup fetch mock for adding transaction
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(mockAddResponse))
    
    // Initialize store
    const transactionStore = useTransactionStore()
    
    // Add the transaction
    const result = await transactionStore.addTransaction(newTransaction)
    
    // Verify transaction was added without an account ID
    expect(result.accountId).toBeNull()
    
    // Verify the request was made without an account ID
    expect(fetch).toHaveBeenCalledWith(
      '/api/transactions',
      expect.objectContaining({
        method: 'POST',
        body: expect.not.stringContaining('"accountId"')
      })
    )
  })
}) 