import type { Transaction } from '@/types/transaction'
import { mockTransactions } from './mockData'

export const expenseService = {
  async getTransactions(): Promise<Transaction[]> {
    // TODO: Replace with actual API call
    return mockTransactions
  },

  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    // TODO: Replace with actual API call
    const newTransaction = {
      ...transaction,
      id: `t${Date.now()}`
    }
    return newTransaction
  },

  async updateTransaction(transaction: Transaction): Promise<Transaction> {
    // TODO: Replace with actual API call
    return transaction
  },

  async deleteTransaction(id: string): Promise<void> {
    // TODO: Replace with actual API call
  }
} 