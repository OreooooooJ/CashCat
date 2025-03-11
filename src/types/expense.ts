export interface Expense {
  id?: string
  amount: number
  description: string
  category: 'food' | 'transport' | 'utilities' | 'entertainment' | 'other'
  date: Date
  receipt?: string // for Firebase Storage
}
