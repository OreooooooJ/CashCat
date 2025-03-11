import { describe, it, expect } from 'vitest'
import { getBudgetSummary, getStatusColor, getMockBudgets } from '../mockBudget'
import type { Budget } from '../../types/budget'

describe('Budget Management', () => {
  describe('getBudgetSummary', () => {
    it('should calculate budget summary correctly', () => {
      const testBudgets: Budget[] = [
        {
          id: 'test-1',
          category: 'Food',
          amount: 1000,
          spent: 800,
          period: 'monthly',
          startDate: new Date('2024-03-01'),
          isRecurring: true,
          alerts: {
            warning: 70,
            critical: 90
          }
        }
      ]

      const summary = getBudgetSummary(testBudgets)
      expect(summary).toHaveLength(1)
      expect(summary[0]).toMatchObject({
        category: 'Food',
        budgeted: 1000,
        spent: 800,
        remaining: 200,
        percentageUsed: 80,
        status: 'warning'
      })
    })

    it('should handle different budget statuses correctly', () => {
      const testBudgets: Budget[] = [
        {
          // Under budget
          id: 'test-1',
          category: 'Under',
          amount: 1000,
          spent: 500,
          period: 'monthly',
          startDate: new Date(),
          isRecurring: true
        },
        {
          // Warning level
          id: 'test-2',
          category: 'Warning',
          amount: 1000,
          spent: 850,
          period: 'monthly',
          startDate: new Date(),
          isRecurring: true,
          alerts: {
            warning: 80,
            critical: 90
          }
        },
        {
          // Critical level
          id: 'test-3',
          category: 'Critical',
          amount: 1000,
          spent: 950,
          period: 'monthly',
          startDate: new Date(),
          isRecurring: true,
          alerts: {
            warning: 80,
            critical: 90
          }
        },
        {
          // Over budget
          id: 'test-4',
          category: 'Over',
          amount: 1000,
          spent: 1100,
          period: 'monthly',
          startDate: new Date(),
          isRecurring: true
        }
      ]

      const summary = getBudgetSummary(testBudgets)
      expect(summary).toHaveLength(4)
      
      const underBudget = summary.find(b => b.category === 'Under')
      expect(underBudget?.status).toBe('under')
      
      const warningBudget = summary.find(b => b.category === 'Warning')
      expect(warningBudget?.status).toBe('warning')
      
      const criticalBudget = summary.find(b => b.category === 'Critical')
      expect(criticalBudget?.status).toBe('critical')
      
      const overBudget = summary.find(b => b.category === 'Over')
      expect(overBudget?.status).toBe('over')
    })
  })

  describe('getStatusColor', () => {
    it('should return correct colors for different statuses', () => {
      expect(getStatusColor('under')).toBe('#10B981') // Green
      expect(getStatusColor('warning')).toBe('#F59E0B') // Yellow
      expect(getStatusColor('critical')).toBe('#F97316') // Orange
      expect(getStatusColor('over')).toBe('#EF4444') // Red
    })

    it('should return gray for unknown status', () => {
      // @ts-expect-error Testing invalid status
      expect(getStatusColor('invalid')).toBe('#6B7280')
    })
  })

  describe('getMockBudgets', () => {
    it('should return both budgets and summary', () => {
      const result = getMockBudgets()
      
      expect(result).toHaveProperty('budgets')
      expect(result).toHaveProperty('summary')
      expect(Array.isArray(result.budgets)).toBe(true)
      expect(Array.isArray(result.summary)).toBe(true)
      expect(result.budgets.length).toBeGreaterThan(0)
      expect(result.summary.length).toBe(result.budgets.length)
    })

    it('should have valid budget data', () => {
      const { budgets } = getMockBudgets()
      
      budgets.forEach(budget => {
        expect(budget).toMatchObject({
          id: expect.any(String),
          category: expect.any(String),
          amount: expect.any(Number),
          spent: expect.any(Number),
          period: expect.stringMatching(/^(monthly|yearly)$/),
          startDate: expect.any(Date),
          isRecurring: expect.any(Boolean)
        })

        if (budget.alerts) {
          expect(budget.alerts).toMatchObject({
            warning: expect.any(Number),
            critical: expect.any(Number)
          })
        }
      })
    })
  })
}) 