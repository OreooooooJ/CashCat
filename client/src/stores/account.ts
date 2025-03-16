import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Account } from '@/types/account';
import api from '@/utils/api';

// Define a server account type to match what comes from the API
interface ServerAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  institution?: string;
  lastFour?: string;
  color?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const useAccountStore = defineStore('account', () => {
  const accounts = ref<Account[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Fetch all accounts
  async function fetchAccounts() {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Using the api utility with authentication handled by interceptor
      const response = await api.get('/api/accounts');
      
      console.log('Response status:', response.status);
      
      const data = response.data;
      console.log('Raw account data from API:', data);
      
      // Convert server accounts to client format
      accounts.value = data.map((account: ServerAccount) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.balance,
        institution: account.institution || '',
        lastFour: account.lastFour || '',
        color: account.color || getDefaultColor(account.type),
        userId: account.userId,
        createdAt: new Date(account.createdAt),
        updatedAt: new Date(account.updatedAt)
      }));
    } catch (err) {
      console.error('Error fetching accounts:', err);
      error.value = 'Failed to load accounts';
    } finally {
      isLoading.value = false;
    }
  }

  // Add a new account
  async function addAccount(account: Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Using the api utility with authentication handled by interceptor
      const response = await api.post('/api/accounts', account);
      
      // Add the new account to the store
      const newAccount = {
        ...account,
        id: response.data.id,
        userId: response.data.userId,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
      
      accounts.value.push(newAccount);
      return newAccount;
    } catch (err) {
      console.error('Error adding account:', err);
      error.value = 'Failed to add account';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Update an existing account
  async function updateAccount(id: string, accountData: Partial<Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Using the api utility with authentication handled by interceptor
      const response = await api.put(`/api/accounts/${id}`, accountData);
      
      // Update the account in the store
      const index = accounts.value.findIndex(a => a.id === id);
      if (index !== -1) {
        accounts.value[index] = {
          ...accounts.value[index],
          ...accountData,
          updatedAt: new Date(response.data.updatedAt)
        };
      }
      
      return accounts.value[index];
    } catch (err) {
      console.error('Error updating account:', err);
      error.value = 'Failed to update account';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Delete an account
  async function deleteAccount(id: string) {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Using the api utility with authentication handled by interceptor
      await api.delete(`/api/accounts/${id}`);
      
      // Remove the account from the store
      accounts.value = accounts.value.filter(a => a.id !== id);
    } catch (err) {
      console.error('Error deleting account:', err);
      error.value = 'Failed to delete account';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Get transactions for a specific account
  async function getAccountTransactions(accountId: string, limit = 35) {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Using the api utility with authentication handled by interceptor
      const response = await api.get(`/api/accounts/${accountId}/transactions?limit=${limit}`);
      
      return response.data.map((t: any) => ({
        ...t,
        date: new Date(t.date)
      }));
    } catch (err) {
      console.error('Error fetching account transactions:', err);
      error.value = 'Failed to load account transactions';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Calculate total balance
  const totalBalance = () => {
    return accounts.value.reduce((sum, account) => sum + account.balance, 0);
  };

  // Get default color based on account type
  function getDefaultColor(type: string): string {
    switch (type) {
      case 'debit':
        return '#10B981'; // Green
      case 'credit':
        return '#EF4444'; // Red
      case 'investment':
        return '#8B5CF6'; // Purple
      default:
        return '#3B82F6'; // Blue
    }
  }

  return {
    accounts,
    isLoading,
    error,
    fetchAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    getAccountTransactions,
    totalBalance
  };
}); 