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

  // Fetch all bank accounts
  async function fetchAccounts() {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Using the api utility with authentication handled by interceptor
      const response = await api.get('/api/accounts');
      
      console.log('Response status:', response.status);
      
      const data = response.data;
      console.log('Raw bank account data from API:', data);
      
      // Debug: Log each account's type before conversion
      data.forEach((account: ServerAccount, index: number) => {
        console.log(`Bank Account ${index + 1} (${account.name}): type = "${account.type}" (${typeof account.type})`);
      });
      
      // Convert server accounts to client format
      accounts.value = data.map((account: ServerAccount) => {
        // Debug: Log the account type conversion
        console.log(`Converting bank account ${account.name} with type "${account.type}"`);
        
        // Map legacy 'debit' type to 'checking'
        let accountType = account.type;
        if (accountType === 'debit') {
          accountType = 'checking';
          console.log(`Mapped 'debit' to 'checking' for account ${account.name}`);
        }
        
        const convertedAccount = {
          id: account.id,
          name: account.name,
          type: accountType as Account['type'],
          balance: account.balance,
          institution: account.institution || '',
          lastFour: account.lastFour || '',
          color: account.color || getDefaultColor(accountType),
          userId: account.userId,
          createdAt: new Date(account.createdAt),
          updatedAt: new Date(account.updatedAt)
        };
        
        console.log(`Converted bank account ${convertedAccount.name}: type = "${convertedAccount.type}"`);
        return convertedAccount;
      });
      
      // Debug: Log the final accounts array
      console.log('Final bank accounts array:', accounts.value);
      console.log('Checking accounts:', accounts.value.filter(a => a.type === 'checking'));
      console.log('Savings accounts:', accounts.value.filter(a => a.type === 'savings'));
      console.log('Credit accounts:', accounts.value.filter(a => a.type === 'credit'));
      console.log('Investment accounts:', accounts.value.filter(a => a.type === 'investment'));
    } catch (err) {
      console.error('Error fetching bank accounts:', err);
      error.value = 'Failed to load bank accounts';
    } finally {
      isLoading.value = false;
    }
  }

  // Add a new bank account
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
      console.error('Error adding bank account:', err);
      error.value = 'Failed to add bank account';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Update an existing bank account
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
      console.error('Error updating bank account:', err);
      error.value = 'Failed to update bank account';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Delete a bank account
  async function deleteAccount(id: string) {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Using the api utility with authentication handled by interceptor
      await api.delete(`/api/accounts/${id}`);
      
      // Remove the account from the store
      accounts.value = accounts.value.filter(a => a.id !== id);
    } catch (err) {
      console.error('Error deleting bank account:', err);
      error.value = 'Failed to delete bank account';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Get transactions for a specific bank account
  async function getAccountTransactions(accountId: string, limit = 35) {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Using the api utility with authentication handled by interceptor
      const response = await api.get(`/api/transactions?accountId=${accountId}&limit=${limit}`);
      
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
      case 'checking':
        return '#10B981'; // Green
      case 'credit':
        return '#EF4444'; // Red
      case 'investment':
        return '#8B5CF6'; // Purple
      case 'savings':
        return '#3B82F6'; // Blue
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