import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Transaction } from '@/types/transaction';

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<Transaction[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Fetch all transactions
  async function fetchTransactions() {
    isLoading.value = true;
    error.value = null;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch('/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      
      // Convert date strings to Date objects
      transactions.value = data.map((transaction: any) => ({
        ...transaction,
        date: new Date(transaction.date)
      }));
    } catch (err) {
      console.error('Error fetching transactions:', err);
      error.value = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      isLoading.value = false;
    }
  }

  // Add a new transaction
  async function addTransaction(transaction: Omit<Transaction, 'id'>) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transaction)
      });
      
      if (!response.ok) {
        throw new Error('Failed to add transaction');
      }
      
      const newTransaction = await response.json();
      
      // Convert date string to Date object
      newTransaction.date = new Date(newTransaction.date);
      
      // Add to local state
      transactions.value.push(newTransaction);
      
      return newTransaction;
    } catch (err) {
      console.error('Error adding transaction:', err);
      error.value = err instanceof Error ? err.message : 'Unknown error';
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
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }
      
      // Remove from local state
      transactions.value = transactions.value.filter(t => t.id !== id);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      error.value = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Calculate total income
  const totalIncome = () => {
    return transactions.value
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Calculate total expenses
  const totalExpenses = () => {
    return transactions.value
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  // Calculate net cash flow
  const netCashFlow = () => {
    return totalIncome() - totalExpenses();
  };

  // Get recent transactions
  const getRecentTransactions = (count = 5) => {
    return [...transactions.value]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, count);
  };

  // Get spending by category
  const getSpendingByCategory = () => {
    const spending = new Map<string, number>();

    transactions.value
      .filter(t => t.amount < 0)
      .forEach(t => {
        const current = spending.get(t.category) || 0;
        spending.set(t.category, current + Math.abs(t.amount));
      });

    return Array.from(spending.entries()).map(([category, amount]) => ({
      category,
      amount
    }));
  };

  return {
    transactions,
    isLoading,
    error,
    fetchTransactions,
    addTransaction,
    deleteTransaction,
    totalIncome,
    totalExpenses,
    netCashFlow,
    getRecentTransactions,
    getSpendingByCategory
  };
}); 