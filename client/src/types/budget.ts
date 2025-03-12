export interface Budget {
  id?: string
  category: string
  amount: number
  spent: number
  period: 'monthly' | 'yearly'
  startDate: Date
  isRecurring: boolean
  alerts: {
    warning: number
    critical: number
  }
}

export interface BudgetSummary {
  category: string
  budgeted: number
  spent: number
  remaining: number
  percentageUsed: number
  status: 'under' | 'warning' | 'critical' | 'over'
}

export interface BudgetFormData {
  amount: number
  category: string
  subcategory: string
  description: string
}
