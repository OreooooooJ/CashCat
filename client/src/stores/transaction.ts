import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Transaction } from '@/types/transaction';
import api from '@/utils/api';

// Define a server transaction type to match what comes from the API
interface ServerTransaction {
  id: string;
  amount: number;
  type: string;
  category: string;
  description?: string;
  date: string;
  userId: string;
  accountId?: string;
  createdAt: string;
  updatedAt: string;
}

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<Transaction[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Fetch transactions from API
  async function fetchTransactions() {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Using the api utility with authentication handled by interceptor
      const response = await api.get('/api/transactions');
      
      console.log('Response status:', response.status);
      
      // Map server transactions to client format
      transactions.value = response.data.map((t: ServerTransaction) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        category: t.category,
        description: t.description || '',
        date: new Date(t.date),
        userId: t.userId,
        accountId: t.accountId,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt)
      }));
    } catch (err) {
      console.error('Error fetching transactions:', err);
      error.value = 'Failed to load transactions';
    } finally {
      isLoading.value = false;
    }
  }

  // Add a new transaction
  async function addTransaction(transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Format the transaction for the server
      const serverTransaction = {
        ...transaction,
        date: transaction.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      };
      
      console.log('Sending transaction to server:', serverTransaction);
      
      // Using the api utility with authentication handled by interceptor
      const response = await api.post('/api/transactions', serverTransaction);
      
      // Add the new transaction to the store
      const newTransaction = {
        ...transaction,
        id: response.data.id,
        userId: response.data.userId,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
      
      transactions.value.push(newTransaction);
      return newTransaction;
    } catch (err) {
      console.error('Error adding transaction:', err);
      error.value = 'Failed to add transaction';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Update a transaction's category
  async function updateCategory(id: string, category: string) {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Using the api utility with authentication handled by interceptor
      const response = await api.put(`/api/transactions/${id}/category`, { category });
      
      // Update the transaction in the store
      const index = transactions.value.findIndex(t => t.id === id);
      if (index !== -1) {
        transactions.value[index] = {
          ...transactions.value[index],
          category,
          updatedAt: new Date()
        };
      }
      
      return response.data;
    } catch (err) {
      console.error('Error updating transaction category:', err);
      error.value = 'Failed to update category';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Delete a transaction
  async function deleteTransaction(id: string) {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Using the api utility with authentication handled by interceptor
      await api.delete(`/api/transactions/${id}`);
      
      // Remove the transaction from the store
      transactions.value = transactions.value.filter(t => t.id !== id);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      error.value = 'Failed to delete transaction';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Calculate total income
  function calculateTotalIncome() {
    console.log('Calculating total income from', transactions.value.length, 'transactions');
    const incomeTransactions = transactions.value.filter(t => t.type === 'income');
    console.log('Income transactions:', incomeTransactions);
    return incomeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  }

  // Calculate total expenses
  function calculateTotalExpenses() {
    console.log('Calculating total expenses from', transactions.value.length, 'transactions');
    const expenseTransactions = transactions.value.filter(t => t.type === 'expense');
    console.log('Expense transactions:', expenseTransactions);
    return expenseTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  }

  // Get spending by category
  function getSpendingByCategory() {
    const expenseTransactions = transactions.value.filter(t => t.type === 'expense');
    const categoryMap = new Map<string, number>();
    
    for (const transaction of expenseTransactions) {
      const category = transaction.category;
      const currentAmount = categoryMap.get(category) || 0;
      categoryMap.set(category, currentAmount + Math.abs(transaction.amount));
    }
    
    return Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount
    }));
  }

  // Get recent transactions
  function getRecentTransactions(limit = 5) {
    return [...transactions.value]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  // Calculate net cash flow
  const netCashFlow = computed(() => {
    const income = calculateTotalIncome();
    const expenses = calculateTotalExpenses();
    console.log('Net cash flow:', income - expenses);
    return income - expenses;
  });

  // Group transactions by period (current month, previous month, etc.)
  function groupTransactionsByPeriod(period: 'current' | 'previous') {
    console.log('Calculating', period, 'period data with', transactions.value.length, 'transactions');
    console.log('Grouping transactions by period:', period);
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    let startDate: Date;
    let endDate: Date;
    
    if (period === 'current') {
      startDate = new Date(currentYear, currentMonth, 1);
      endDate = new Date(currentYear, currentMonth + 1, 0);
    } else {
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth, 0);
    }
    
    console.log(`Period date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    const filteredTransactions = transactions.value.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
    
    console.log(`Found ${filteredTransactions.length} transactions for ${period} period`);
    
    const income = filteredTransactions
      .filter(t => t.type && t.type.toLowerCase() === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type && t.type.toLowerCase() === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const result = { income, expenses };
    console.log(period, 'period data:', result);
    return result;
  }

  // Get current period data
  const currentPeriodData = computed(() => {
    const data = groupTransactionsByPeriod('current');
    console.log('Total income computed:', data.income);
    return data;
  });

  // Get previous period data
  const previousPeriodData = computed(() => {
    const data = groupTransactionsByPeriod('previous');
    console.log('Total expenses computed:', data.expenses);
    return data;
  });

  // Get net cash flow for the current period
  const currentPeriodNetCashFlow = computed(() => {
    const result = currentPeriodData.value.income - currentPeriodData.value.expenses;
    console.log('Net cash flow computed:', result);
    return result;
  });

  return {
    transactions,
    isLoading,
    error,
    fetchTransactions,
    addTransaction,
    updateCategory,
    deleteTransaction,
    calculateTotalIncome,
    calculateTotalExpenses,
    getSpendingByCategory,
    getRecentTransactions,
    netCashFlow,
    currentPeriodData,
    previousPeriodData,
    currentPeriodNetCashFlow
  };
}); 