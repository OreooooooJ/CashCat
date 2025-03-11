import type { Budget, BudgetSummary } from '../types/budget'
import { categoryColors } from './mockData'

const mockBudgets: Budget[] = [
  {
    id: 'b1',
    category: 'Food & Dining',
    amount: 800.0,
    spent: 390.64,
    period: 'monthly',
    startDate: new Date('2024-03-01'),
    isRecurring: true,
    alerts: {
      warning: 80,
      critical: 90,
    },
  },
  {
    id: 'b2',
    category: 'Transportation',
    amount: 300.0,
    spent: 190.43,
    period: 'monthly',
    startDate: new Date('2024-03-01'),
    isRecurring: true,
    alerts: {
      warning: 80,
      critical: 90,
    },
  },
  {
    id: 'b3',
    category: 'Bills & Utilities',
    amount: 500.0,
    spent: 235.31,
    period: 'monthly',
    startDate: new Date('2024-03-01'),
    isRecurring: true,
    alerts: {
      warning: 80,
      critical: 90,
    },
  },
  {
    id: 'b4',
    category: 'Shopping',
    amount: 400.0,
    spent: 269.98,
    period: 'monthly',
    startDate: new Date('2024-03-01'),
    isRecurring: true,
    alerts: {
      warning: 80,
      critical: 90,
    },
  },
  // Yearly Budgets
  {
    id: 'b5',
    category: 'Healthcare',
    amount: 6000.0,
    spent: 2150.75,
    period: 'yearly',
    startDate: new Date('2024-01-01'),
    isRecurring: true,
    alerts: {
      warning: 75,
      critical: 90,
    },
  },
  {
    id: 'b6',
    category: 'Entertainment',
    amount: 3600.0,
    spent: 890.45,
    period: 'yearly',
    startDate: new Date('2024-01-01'),
    isRecurring: true,
    alerts: {
      warning: 80,
      critical: 90,
    },
  },
  {
    id: 'b7',
    category: 'Education',
    amount: 5000.0,
    spent: 1200.0,
    period: 'yearly',
    startDate: new Date('2024-01-01'),
    isRecurring: true,
    alerts: {
      warning: 70,
      critical: 85,
    },
  },
]

export const getBudgetSummary = (budgets: Budget[]): BudgetSummary[] => {
  return budgets.map(budget => {
    const percentageUsed = (budget.spent / budget.amount) * 100
    let status: BudgetSummary['status'] = 'under'

    if (percentageUsed >= 100) {
      status = 'over'
    } else if (percentageUsed >= (budget.alerts?.critical ?? 90)) {
      status = 'critical'
    } else if (percentageUsed >= (budget.alerts?.warning ?? 80)) {
      status = 'warning'
    }

    return {
      category: budget.category,
      budgeted: budget.amount,
      spent: budget.spent,
      remaining: budget.amount - budget.spent,
      percentageUsed,
      status,
    }
  })
}

export const getMockBudgets = () => {
  return {
    budgets: mockBudgets,
    summary: getBudgetSummary(mockBudgets),
  }
}

export const getStatusColor = (status: BudgetSummary['status']): string => {
  switch (status) {
    case 'under':
      return '#10B981' // Green
    case 'warning':
      return '#F59E0B' // Yellow
    case 'critical':
      return '#F97316' // Orange
    case 'over':
      return '#EF4444' // Red
    default:
      return '#6B7280' // Gray
  }
}

export const getBudgetColor = (category: string): string => {
  return categoryColors[category as keyof typeof categoryColors] || categoryColors.Other
}
