export interface Account {
  id: string
  name: string
  type: 'checking' | 'savings' | 'credit' | 'investment'
  balance: number
  institution?: string
  lastFour?: string
  color?: string
  userId?: string
  createdAt?: Date
  updatedAt?: Date
} 