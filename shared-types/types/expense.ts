export interface Expense {
  id?: string
  amount: number
  category: string
  note?: string
  date: Date
  userId: string
}
