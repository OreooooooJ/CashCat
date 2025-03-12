import { PrismaClient } from '@prisma/client'
import type { Expense } from '../../../shared/types/expense'

const prisma = new PrismaClient()

export const expenseService = {
  async addExpense(expense: Expense): Promise<string> {
    const result = await prisma.transaction.create({
      data: {
        amount: expense.amount,
        category: expense.category,
        note: expense.note || null,
        date: new Date(expense.date),
        userId: expense.userId,
      },
    })
    return result.id
  },

  async getExpenses(userId: string): Promise<Expense[]> {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
      },
      orderBy: {
        date: 'desc',
      },
    })

    return transactions.map(transaction => ({
      id: transaction.id,
      amount: transaction.amount,
      category: transaction.category,
      note: transaction.note || undefined,
      date: transaction.date,
      userId: transaction.userId,
    }))
  },
} 