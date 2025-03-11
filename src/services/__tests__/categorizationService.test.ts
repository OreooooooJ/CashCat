import { describe, it, expect, beforeEach } from 'vitest'
import { categorizationService } from '../categorizationService'
import type { Transaction } from '../../types/transaction'

describe('CategorizationService', () => {
  beforeEach(() => {
    localStorage.clear()
    // Add some test rules
    categorizationService.addRule(
      'WALMART',
      'Walmart',
      'Shopping',
      'Retail',
      'test-account'
    )
    categorizationService.addRule(
      'STARBUCKS',
      'Starbucks',
      'Food & Dining',
      'Coffee Shops'
    )
  })

  describe('addRule', () => {
    it('should add a new categorization rule', () => {
      const rule = categorizationService.addRule(
        'TARGET',
        'Target',
        'Shopping',
        'Retail'
      )
      
      expect(rule).toMatchObject({
        pattern: 'TARGET',
        vendor: 'Target',
        category: 'Shopping',
        subcategory: 'Retail',
        userDefined: true
      })
      
      const rules = categorizationService.getRules()
      expect(rules).toContainEqual(expect.objectContaining({
        pattern: 'TARGET',
        vendor: 'Target'
      }))
    })
  })

  describe('categorizeTransaction', () => {
    it('should return empty results for transactions without description', () => {
      const result = categorizationService.categorizeTransaction({
        amount: 100,
        date: new Date(),
        vendor: 'Unknown',
        category: 'Uncategorized',
        accountId: 'test-account'
      })

      expect(result.vendor).toHaveLength(0)
      expect(result.categories).toHaveLength(0)
      expect(result.matchedRules).toHaveLength(0)
    })

    it('should match transaction with existing rule', () => {
      const result = categorizationService.categorizeTransaction({
        originalDescription: 'WALMART STORE #123',
        amount: 50.00,
        date: new Date(),
        vendor: 'Unknown',
        category: 'Uncategorized',
        accountId: 'test-account'
      })

      expect(result.vendor).toContainEqual(
        expect.objectContaining({
          vendor: 'Walmart',
          source: 'user'
        })
      )
      expect(result.categories).toContainEqual(
        expect.objectContaining({
          category: 'Shopping',
          subcategory: 'Retail'
        })
      )
    })

    it('should consider account ID when matching rules', () => {
      const result = categorizationService.categorizeTransaction({
        originalDescription: 'WALMART STORE #123',
        amount: 50.00,
        date: new Date(),
        vendor: 'Unknown',
        category: 'Uncategorized',
        accountId: 'different-account'
      })

      // Should not match the rule with specific account
      expect(result.matchedRules).not.toContainEqual(
        expect.objectContaining({
          source: 'test-account'
        })
      )
    })
  })

  describe('learnFromTransaction', () => {
    it('should create a new rule from transaction', () => {
      const transaction: Transaction = {
        id: 'test-1',
        originalDescription: 'CHIPOTLE NYC #456',
        amount: 15.99,
        date: new Date(),
        vendor: 'Chipotle',
        category: 'Food & Dining',
        subcategory: 'Restaurants',
        accountId: 'test-account'
      }

      categorizationService.learnFromTransaction(transaction)
      
      const rules = categorizationService.getRules()
      expect(rules).toContainEqual(
        expect.objectContaining({
          vendor: 'Chipotle',
          category: 'Food & Dining',
          subcategory: 'Restaurants'
        })
      )
    })

    it('should not create rule from transaction without description', () => {
      const transaction: Transaction = {
        id: 'test-2',
        amount: 25.00,
        date: new Date(),
        vendor: 'Unknown',
        category: 'Uncategorized',
        accountId: 'test-account'
      }

      const initialRulesCount = categorizationService.getRules().length
      categorizationService.learnFromTransaction(transaction)
      
      expect(categorizationService.getRules()).toHaveLength(initialRulesCount)
    })
  })
}) 