import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAccountStore } from '@/stores/account'
import type { Account } from '@/types/account'

// Mock fetch
global.fetch = vi.fn() as unknown as typeof fetch

// Helper to mock fetch responses
function mockFetchResponse(data: any, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
    headers: new Headers(),
    redirected: false,
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
    type: 'basic' as ResponseType,
    url: '',
    clone: () => mockFetchResponse(data, ok) as unknown as Response,
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(''),
  } as Response)
}

describe('Account Store', () => {
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
  
  describe('fetchAccounts', () => {
    it('should fetch accounts successfully', async () => {
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
      
      vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(mockAccounts) as Response)
      
      const accountStore = useAccountStore()
      await accountStore.fetchAccounts()
      
      expect(accountStore.accounts.length).toBe(1)
      expect(accountStore.accounts[0].name).toBe('Checking Account')
      expect(accountStore.isLoading).toBe(false)
      expect(accountStore.error).toBeNull()
    })
    
    it('should handle fetch error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse({ error: 'Failed to fetch' }, false) as Response)
      
      const accountStore = useAccountStore()
      
      try {
        await accountStore.fetchAccounts()
      } catch (error) {
        // Expected to throw
      }
      
      expect(accountStore.isLoading).toBe(false)
      expect(accountStore.error).not.toBeNull()
    })
    
    it('should handle authentication error', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce(null)
      
      const accountStore = useAccountStore()
      
      try {
        await accountStore.fetchAccounts()
      } catch (error) {
        // Expected to throw
      }
      
      expect(accountStore.isLoading).toBe(false)
      expect(accountStore.error).toBe('Not authenticated')
    })
  })
  
  describe('addAccount', () => {
    it('should add an account successfully', async () => {
      const newAccount = {
        name: 'New Account',
        type: 'debit' as const,
        balance: 500,
        institution: 'Test Bank',
        lastFour: '5678',
        color: '#10B981'
      }
      
      const mockResponse = {
        id: 'new-acc-id',
        ...newAccount,
        userId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(mockResponse) as Response)
      
      const accountStore = useAccountStore()
      const result = await accountStore.addAccount(newAccount)
      
      expect(result).toEqual(mockResponse)
      expect(accountStore.accounts.length).toBe(1)
      expect(accountStore.accounts[0].id).toBe('new-acc-id')
    })
  })
  
  describe('updateAccount', () => {
    it('should update an account successfully', async () => {
      // First add an account
      const initialAccount = {
        id: 'acc1',
        name: 'Initial Account',
        type: 'debit',
        balance: 1000,
        institution: 'Test Bank',
        lastFour: '1234',
        color: '#3B82F6',
        userId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse([initialAccount]) as Response)
      
      const accountStore = useAccountStore()
      await accountStore.fetchAccounts()
      
      // Now update it
      const updatedAccount = {
        ...initialAccount,
        name: 'Updated Account',
        balance: 1500
      }
      
      vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(updatedAccount) as Response)
      
      await accountStore.updateAccount('acc1', {
        name: 'Updated Account',
        balance: 1500
      })
      
      expect(accountStore.accounts.length).toBe(1)
      expect(accountStore.accounts[0].name).toBe('Updated Account')
      expect(accountStore.accounts[0].balance).toBe(1500)
    })
  })
  
  describe('deleteAccount', () => {
    it('should delete an account successfully', async () => {
      // First add accounts
      const accounts = [
        {
          id: 'acc1',
          name: 'Account 1',
          type: 'debit',
          balance: 1000,
          institution: 'Test Bank',
          lastFour: '1234',
          color: '#3B82F6',
          userId: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'acc2',
          name: 'Account 2',
          type: 'credit',
          balance: -500,
          institution: 'Test Bank',
          lastFour: '5678',
          color: '#EF4444',
          userId: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      
      vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(accounts) as Response)
      
      const accountStore = useAccountStore()
      await accountStore.fetchAccounts()
      
      expect(accountStore.accounts.length).toBe(2)
      
      // Now delete one account
      vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse({}, true) as Response)
      
      await accountStore.deleteAccount('acc1')
      
      expect(accountStore.accounts.length).toBe(1)
      expect(accountStore.accounts[0].id).toBe('acc2')
    })
  })
  
  describe('getAccountTransactions', () => {
    it('should fetch transactions for an account', async () => {
      const mockTransactions = [
        {
          id: 'trans1',
          amount: 100,
          type: 'INCOME',
          category: 'Income',
          description: 'Test Income',
          date: new Date().toISOString(),
          accountId: 'acc1',
          userId: 'user1'
        }
      ]
      
      vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(mockTransactions) as Response)
      
      const accountStore = useAccountStore()
      const transactions = await accountStore.getAccountTransactions('acc1')
      
      expect(transactions).toEqual(mockTransactions)
      expect(fetch).toHaveBeenCalledWith(
        '/api/accounts/acc1/transactions?limit=35',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token'
          })
        })
      )
    })
  })
  
  describe('totalBalance', () => {
    it('should calculate total balance correctly', async () => {
      const accounts = [
        {
          id: 'acc1',
          name: 'Checking',
          type: 'debit',
          balance: 1000,
          institution: 'Test Bank',
          lastFour: '1234',
          color: '#3B82F6',
          userId: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'acc2',
          name: 'Credit Card',
          type: 'credit',
          balance: -500,
          institution: 'Test Bank',
          lastFour: '5678',
          color: '#EF4444',
          userId: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      
      vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(accounts) as Response)
      
      const accountStore = useAccountStore()
      await accountStore.fetchAccounts()
      
      expect(accountStore.totalBalance()).toBe(500) // 1000 + (-500)
    })
  })
}) 