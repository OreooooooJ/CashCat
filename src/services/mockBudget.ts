import type { Budget, BudgetSummary } from '../types/budget'

const budgets: Budget[] = [
  {
    id: 'b1',
    category: 'Food & Dining',
    amount: 800,
    spent: 650,
    period: 'monthly',
    startDate: new Date('2024-03-01'),
    isRecurring: true,
    alerts: {
      warning: 80,
      critical: 90
    }
  },
  {
    id: 'b2',
    category: 'Transportation',
    amount: 300,
    spent: 275,
    period: 'monthly',
    startDate: new Date('2024-03-01'),
    isRecurring: true,
    alerts: {
      warning: 80,
      critical: 90
    }
  },
  {
    id: 'b3',
    category: 'Shopping',
    amount: 500,
    spent: 425,
    period: 'monthly',
    startDate: new Date('2024-03-01'),
    isRecurring: true,
    alerts: {
      warning: 80,
      critical: 90
    }
  },
  {
    id: 'b4',
    category: 'Entertainment',
    amount: 200,
    spent: 150,
    period: 'monthly',
    startDate: new Date('2024-03-01'),
    isRecurring: true,
    alerts: {
      warning: 80,
      critical: 90
    }
  }
]

const calculateBudgetStatus = (percentageUsed: number, warningThreshold: number, criticalThreshold: number): BudgetSummary['status'] => {
  if (percentageUsed >= 100) return 'over'
  if (percentageUsed >= criticalThreshold) return 'critical'
  if (percentageUsed >= warningThreshold) return 'warning'
  return 'under'
}

const getBudgetSummary = (budgets: Budget[]): BudgetSummary[] => {
  return budgets.map(budget => {
    const percentageUsed = (budget.spent / budget.amount) * 100
    const remaining = budget.amount - budget.spent

    return {
      category: budget.category,
      budgeted: budget.amount,
      spent: budget.spent,
      remaining,
      percentageUsed,
      status: calculateBudgetStatus(percentageUsed, budget.alerts.warning, budget.alerts.critical)
    }
  })
}

export const getMockBudgets = () => {
  return {
    budgets,
    summary: getBudgetSummary(budgets)
  }
}

export const getStatusColor = (status: BudgetSummary['status']): string => {
  switch (status) {
    case 'under':
      return '#047857' // Green
    case 'warning':
      return '#D97706' // Yellow
    case 'critical':
      return '#DC2626' // Red
    case 'over':
      return '#991B1B' // Dark Red
    default:
      return '#6B7280' // Gray
  }
}

export const getBudgetColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Food & Dining': '#059669',
    'Transportation': '#2563EB',
    'Shopping': '#7C3AED',
    'Entertainment': '#DB2777',
    'Bills & Utilities': '#9333EA',
    'Health & Fitness': '#DC2626',
    'Travel': '#0891B2',
    'Other': '#6B7280'
  }

  return colors[category] || colors.Other
}
