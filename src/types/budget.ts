export interface Budget {
  id?: string
  category: string
  amount: number
  spent: number
  period: 'monthly' | 'yearly'
  startDate: Date
  endDate?: Date
  isRecurring: boolean
  alerts?: {
    warning: number // Percentage for warning (e.g., 80%)
    critical: number // Percentage for critical (e.g., 90%)
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
