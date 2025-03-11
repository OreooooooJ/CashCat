import { describe, it, expect } from 'vitest'
import {
  getMockData,
  categoryColors,
  subcategoryIcons,
  vendorPatterns,
  type Account,
} from '../mockData'
import type { Transaction } from '../../types/transaction'

describe('MockData Service', () => {
  describe('getMockData', () => {
    it('should return accounts and transactions', () => {
      const { accounts, transactions } = getMockData()

      expect(Array.isArray(accounts)).toBe(true)
      expect(Array.isArray(transactions)).toBe(true)
      expect(accounts.length).toBeGreaterThan(0)
      expect(transactions.length).toBeGreaterThan(0)
    })

    it('should have valid account data', () => {
      const { accounts } = getMockData()

      accounts.forEach((account: Account) => {
        expect(account).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          type: expect.stringMatching(/^(credit|debit|cash)$/),
          institution: expect.any(String),
          lastFour: expect.any(String),
          balance: expect.any(Number),
          color: expect.stringMatching(/^#[0-9A-F]{6}$/i),
        })
      })
    })

    it('should have valid transaction data', () => {
      const { transactions } = getMockData()

      transactions.forEach((transaction: Transaction) => {
        expect(transaction).toMatchObject({
          id: expect.any(String),
          amount: expect.any(Number),
          vendor: expect.any(String),
          category: expect.any(String),
          date: expect.any(Date),
          accountId: expect.any(String),
        })

        // Optional fields should be of correct type if present
        if (transaction.subcategory) {
          expect(typeof transaction.subcategory).toBe('string')
        }
        if (transaction.description) {
          expect(typeof transaction.description).toBe('string')
        }
        if (transaction.originalDescription) {
          expect(typeof transaction.originalDescription).toBe('string')
        }
        if (transaction.isAutoCategorized !== undefined) {
          expect(typeof transaction.isAutoCategorized).toBe('boolean')
        }
      })
    })

    it('should have transactions linked to valid accounts', () => {
      const { accounts, transactions } = getMockData()
      const accountIds = accounts.map(a => a.id)

      transactions.forEach(transaction => {
        expect(accountIds).toContain(transaction.accountId)
      })
    })
  })

  describe('categoryColors', () => {
    it('should have valid color codes for all categories', () => {
      Object.values(categoryColors).forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i)
      })
    })

    it('should include all necessary categories', () => {
      const requiredCategories = [
        'Income',
        'Food & Dining',
        'Bills & Utilities',
        'Transportation',
        'Shopping',
        'Entertainment',
        'Healthcare',
        'Education',
        'Transfer',
        'Other',
      ]

      requiredCategories.forEach(category => {
        expect(categoryColors).toHaveProperty(category)
      })
    })
  })

  describe('subcategoryIcons', () => {
    it('should have valid emoji or symbol for all subcategories', () => {
      Object.values(subcategoryIcons).forEach(icon => {
        // Match both Unicode emojis and simple symbols
        expect(icon).toMatch(/[\u{1F300}-\u{1F9FF}]|[☕⛽↔️💡📺🛒🍽️]/u)
      })
    })

    it('should include common subcategories', () => {
      const commonSubcategories = [
        'Groceries',
        'Restaurants',
        'Coffee Shops',
        'Utilities',
        'Streaming Services',
        'Gas & Fuel',
        'Public Transit',
      ]

      commonSubcategories.forEach(subcategory => {
        expect(subcategoryIcons).toHaveProperty(subcategory)
      })
    })
  })

  describe('vendorPatterns', () => {
    it('should have valid vendor pattern data', () => {
      vendorPatterns.forEach(pattern => {
        expect(pattern).toMatchObject({
          pattern: expect.any(String),
          vendor: expect.any(String),
          category: expect.any(String),
        })

        if (pattern.subcategory) {
          expect(typeof pattern.subcategory).toBe('string')
        }
      })
    })

    it('should include common vendors', () => {
      const vendors = vendorPatterns.map(p => p.vendor)
      const commonVendors = ['Walmart', 'Amazon', 'Starbucks']

      commonVendors.forEach(vendor => {
        expect(vendors).toContain(vendor)
      })
    })
  })
})
