import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAccountStore } from '@/stores/account'
import type { Account } from '@/types/account'
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

describe('Account Store', () => {
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
      
      vi.mocked(api.get).mockResolvedValue({ data: mockAccounts, status: 200 })
      
      const accountStore = useAccountStore()
      await accountStore.fetchAccounts()
      
      expect(accountStore.accounts.length).toBe(1)
      expect(accountStore.accounts[0].name).toBe('Checking Account')
      expect(accountStore.isLoading).toBe(false)
      expect(accountStore.error).toBeNull()
    })
    
    it('should handle fetch error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('API error'))
      
      const accountStore = useAccountStore()
      
      await accountStore.fetchAccounts()
      
      expect(accountStore.isLoading).toBe(false)
      expect(accountStore.error).not.toBeNull()
    })
  })
  
  describe('addAccount', () => {
    it('should add an account successfully', async () => {
      const newAccount = {
        name: 'New Account',
        type: 'checking' as const,
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
      
      vi.mocked(api.post).mockResolvedValue({ data: mockResponse, status: 201 })
      
      const accountStore = useAccountStore()
      const result = await accountStore.addAccount(newAccount)
      
      expect(result.id).toBe('new-acc-id')
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
        type: 'checking',
        balance: 1000,
        institution: 'Test Bank',
        lastFour: '1234',
        color: '#3B82F6',
        userId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      vi.mocked(api.get).mockResolvedValue({ data: [initialAccount], status: 200 })
      
      const accountStore = useAccountStore()
      await accountStore.fetchAccounts()
      
      // Now update it
      const updatedAccount = {
        ...initialAccount,
        name: 'Updated Account',
        balance: 1500
      }
      
      vi.mocked(api.put).mockResolvedValue({ data: updatedAccount, status: 200 })
      
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
          type: 'checking',
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
      
      vi.mocked(api.get).mockResolvedValue({ data: accounts, status: 200 })
      
      const accountStore = useAccountStore()
      await accountStore.fetchAccounts()
      
      expect(accountStore.accounts.length).toBe(2)
      
      // Now delete one account
      vi.mocked(api.delete).mockResolvedValue({ data: {}, status: 200 })
      
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
      
      vi.mocked(api.get).mockResolvedValue({ data: mockTransactions, status: 200 })
      
      const accountStore = useAccountStore()
      const transactions = await accountStore.getAccountTransactions('acc1')
      
      expect(transactions.length).toBe(1)
      expect(transactions[0].accountId).toBe('acc1')
    })
  })
}) 