export interface Transaction {
  id?: string
  amount: number
  vendor?: string
  originalDescription?: string
  category: string
  subcategory?: string
  date: Date
  description?: string
  accountId?: string
  isAutoCategorized?: boolean
  type?: 'income' | 'expense' | 'INCOME' | 'EXPENSE'
  userId?: string
  createdAt?: Date
  updatedAt?: Date
}
