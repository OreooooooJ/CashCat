/**
 * DEVELOPMENT/TESTING ONLY
 * 
 * This file contains mock budget data for development and testing purposes.
 * It should not be imported in production code.
 */

import type { Budget } from '@/types/budget'

export interface BudgetSummary {
  category: string
  amount: number
  spent: number
  status: 'good' | 'warning' | 'critical'
  percentSpent: number
}

const mockBudgets: Budget[] = [
  {
    id: 'b1',
    category: 'Food & Dining',
    amount: 500,
    spent: 200,
    period: 'monthly',
    startDate: new Date('2024-03-01'),
    isRecurring: true,
    alerts: {
      warning: 70,
      critical: 90
    }
  },
  {
    id: 'b2',
    category: 'Transportation',
    amount: 300,
    spent: 150,
    period: 'monthly',
    startDate: new Date('2024-03-01'),
    isRecurring: true,
    alerts: {
      warning: 70,
      critical: 90
    }
  },
  {
    id: 'b3',
    category: 'Entertainment',
    amount: 200,
    spent: 50,
    period: 'monthly',
    startDate: new Date('2024-03-01'),
    isRecurring: true,
    alerts: {
      warning: 70,
      critical: 90
    }
  }
]

export const getStatusColor = (status: BudgetSummary['status']) => {
  switch (status) {
    case 'good':
      return '#10B981' // green
    case 'warning':
      return '#F59E0B' // yellow
    case 'critical':
      return '#EF4444' // red
    default:
      return '#6B7280' // gray
  }
}

export const getBudgetColor = (percentSpent: number) => {
  if (percentSpent >= 90) return '#EF4444' // red
  if (percentSpent >= 70) return '#F59E0B' // yellow
  return '#10B981' // green
}

export const getMockBudgets = () => {
  return {
    budgets: mockBudgets
  }
} 