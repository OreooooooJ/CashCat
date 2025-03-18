<template>
  <div class="account-detail-view">
    <div class="page-header">
      <button class="back-btn" @click="goBack">
        <ArrowLeftIcon class="w-5 h-5 mr-2" />
        Back to Bank Accounts
      </button>
      
      <div class="account-actions">
        <button class="edit-btn" @click="showEditModal = true">
          <PencilIcon class="w-5 h-5 mr-2" />
          Edit
        </button>
        <button class="delete-btn" @click="confirmDelete">
          <TrashIcon class="w-5 h-5 mr-2" />
          Delete
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading bank account details...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <ExclamationCircleIcon class="w-8 h-8 text-red-500" />
      <p>{{ error }}</p>
      <button class="back-btn" @click="goBack">
        <ArrowLeftIcon class="w-5 h-5 mr-2" />
        Back to Bank Accounts
      </button>
    </div>

    <template v-else-if="account">
      <div class="account-header" :style="{ borderColor: account.color }">
        <div class="account-info">
          <h1>{{ account.name }}</h1>
          <p class="account-type">{{ formatAccountType(account.type) }}</p>
          <p v-if="account.institution" class="account-institution">
            {{ account.institution }} <span v-if="account.lastFour">•••• {{ account.lastFour }}</span>
          </p>
        </div>
        <div class="account-balance">
          <p class="balance-label">Current Balance</p>
          <p class="balance-amount" :class="{ negative: account.balance < 0 }">
            {{ formatCurrency(account.balance) }}
          </p>
        </div>
      </div>

      <div class="transactions-section">
        <div class="section-header">
          <h2>Recent Transactions</h2>
          <div class="transaction-filters">
            <select v-model="transactionFilter" class="filter-select">
              <option value="all">All Transactions</option>
              <option value="income">Income Only</option>
              <option value="expense">Expenses Only</option>
            </select>
          </div>
        </div>

        <div v-if="isLoadingTransactions" class="loading-transactions">
          <div class="spinner"></div>
          <p>Loading transactions...</p>
        </div>

        <div v-else-if="transactionError" class="empty-transactions">
          <ExclamationCircleIcon class="w-8 h-8 text-red-500 mb-2" />
          <p>{{ transactionError }}</p>
          <button class="retry-btn mt-2" @click="fetchAccountTransactions">
            Retry Loading Transactions
          </button>
        </div>

        <div v-else-if="transactions.length === 0" class="empty-transactions">
          <p>No transactions found for this bank account.</p>
          <router-link to="/transactions" class="add-transaction-btn">
            <PlusIcon class="w-5 h-5 mr-2" />
            Add Transaction
          </router-link>
        </div>

        <div v-else class="transactions-list">
          <div 
            v-for="transaction in filteredTransactions" 
            :key="transaction.id" 
            class="transaction-item"
          >
            <div class="transaction-date">
              <p class="date">{{ formatDate(transaction.date) }}</p>
              <p class="day">{{ formatDay(transaction.date) }}</p>
            </div>
            <div class="transaction-details">
              <p class="transaction-vendor">{{ transaction.vendor || transaction.description }}</p>
              <p class="transaction-category">{{ transaction.category }}</p>
            </div>
            <p 
              class="transaction-amount" 
              :class="{ 'text-green-600': transaction.type === 'income', 'text-red-600': transaction.type === 'expense' }"
            >
              {{ formatCurrency(transaction.amount) }}
            </p>
          </div>

          <div v-if="transactions.length >= 35" class="view-all-link">
            <router-link :to="`/transactions?accountId=${accountId}`">
              View all transactions
            </router-link>
          </div>
        </div>
      </div>
    </template>

    <!-- Edit Account Modal -->
    <div v-if="showEditModal && account" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h2>Edit Account</h2>
          <button class="close-btn" @click="showEditModal = false">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
        <form class="account-form" @submit.prevent="submitEditAccount">
          <div class="form-group">
            <label for="account-name">Account Name</label>
            <input 
              id="account-name" 
              v-model="editedAccount.name" 
              type="text" 
              required 
              placeholder="e.g. Checking Account"
            />
          </div>
          
          <div class="form-group">
            <label for="account-type">Account Type</label>
            <select id="account-type" v-model="editedAccount.type" required>
              <option value="checking">Checking Account</option>
              <option value="savings">Savings Account</option>
              <option value="credit">Credit Card</option>
              <option value="investment">Investment Account</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="account-balance">Current Balance</label>
            <div class="balance-input">
              <span class="currency-symbol">$</span>
              <input 
                id="account-balance" 
                v-model="editedAccount.balance" 
                type="text" 
                required 
                placeholder="0.00"
                @input="formatBalance"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="account-institution">Institution (Optional)</label>
            <input 
              id="account-institution" 
              v-model="editedAccount.institution" 
              type="text" 
              placeholder="e.g. Chase Bank"
            />
          </div>
          
          <div class="form-group">
            <label for="account-last-four">Last 4 Digits (Optional)</label>
            <input 
              id="account-last-four" 
              v-model="editedAccount.lastFour" 
              type="text" 
              maxlength="4" 
              placeholder="1234"
              pattern="[0-9]{4}"
            />
          </div>
          
          <div class="form-group">
            <label for="account-color">Color</label>
            <div class="color-options">
              <button 
                v-for="color in accountColors" 
                :key="color" 
                type="button"
                class="color-option" 
                :class="{ selected: editedAccount.color === color }"
                :style="{ backgroundColor: color }"
                @click="editedAccount.color = color"
              ></button>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showEditModal = false">
              Cancel
            </button>
            <button type="submit" class="submit-btn" :disabled="isSubmitting">
              <span v-if="isSubmitting">Saving...</span>
              <span v-else>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-container delete-modal">
        <div class="modal-header">
          <h2>Delete Account</h2>
          <button class="close-btn" @click="showDeleteModal = false">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
        <div class="modal-content">
          <ExclamationTriangleIcon class="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p class="text-center mb-4">
            Are you sure you want to delete this account? This action cannot be undone.
          </p>
          <p class="text-center text-gray-500 mb-6">
            All transactions associated with this account will remain in the system.
          </p>
          <div class="flex justify-end gap-4">
            <button class="cancel-btn" @click="showDeleteModal = false">
              Cancel
            </button>
            <button class="delete-confirm-btn" :disabled="isDeleting" @click="deleteAccount">
              <span v-if="isDeleting">Deleting...</span>
              <span v-else>Delete Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/account';
import { useTransactionStore } from '@/stores/transaction';
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline';
import currency from 'currency.js';
import type { Account } from '@/types/account';
import type { Transaction } from '@/types/transaction';

const route = useRoute();
const router = useRouter();
const accountStore = useAccountStore();
const transactionStore = useTransactionStore();

const accountId = computed(() => route.params.id as string);
const account = computed(() => 
  accountStore.accounts.find(a => a.id === accountId.value)
);

const isLoading = computed(() => accountStore.isLoading);
const error = computed(() => accountStore.error);

const transactions = ref<Transaction[]>([]);
const isLoadingTransactions = ref(false);
const transactionError = ref<string | null>(null);
const transactionFilter = ref('all');

const showEditModal = ref(false);
const showDeleteModal = ref(false);
const isSubmitting = ref(false);
const isDeleting = ref(false);

const accountColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6B7280'  // Gray
];

// Define a local interface for the edited account
interface EditedAccount {
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: string | number;
  institution?: string;
  lastFour?: string;
  color?: string;
}

const editedAccount = ref<EditedAccount>({
  name: '',
  type: 'checking',
  balance: '',
  institution: '',
  lastFour: '',
  color: ''
});

// Initialize edited account when account data is available
watch(account, (newAccount) => {
  if (newAccount) {
    editedAccount.value = {
      name: newAccount.name,
      type: newAccount.type as 'checking' | 'savings' | 'credit' | 'investment',
      balance: currency(newAccount.balance, { symbol: '' }).format(),
      institution: newAccount.institution || '',
      lastFour: newAccount.lastFour || '',
      color: newAccount.color || accountColors[0]
    };
  }
}, { immediate: true });

// Update document title when account is loaded
watch(account, (newAccount) => {
  if (newAccount) {
    document.title = `${newAccount.name} | CashCat`;
  } else {
    document.title = 'Bank Account Detail | CashCat';
  }
}, { immediate: true });

const filteredTransactions = computed(() => {
  if (transactionFilter.value === 'all') {
    return transactions.value;
  } else if (transactionFilter.value === 'income') {
    return transactions.value.filter(t => t.type === 'income');
  } else {
    return transactions.value.filter(t => t.type === 'expense');
  }
});

const formatCurrency = (amount: number) => {
  return currency(amount, { symbol: '$' }).format();
};

const formatAccountType = (type: string) => {
  switch (type) {
    case 'checking':
      return 'Checking Account';
    case 'savings':
      return 'Savings Account';
    case 'credit':
      return 'Credit Card';
    case 'investment':
      return 'Investment Account';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const formatDay = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short'
  });
};

const formatBalance = (event: Event) => {
  const input = (event.target as HTMLInputElement).value.replace(/[^\d.-]/g, '');
  if (input) {
    editedAccount.value.balance = currency(input, { symbol: '' }).format();
  } else {
    editedAccount.value.balance = '';
  }
};

const goBack = () => {
  router.push('/accounts');
};

const fetchAccountTransactions = async () => {
  if (!accountId.value) return;
  
  isLoadingTransactions.value = true;
  transactionError.value = null;
  
  try {
    const data = await accountStore.getAccountTransactions(accountId.value);
    
    // Convert server transactions to client format
    transactions.value = data.map((transaction: any) => {
      return {
        id: transaction.id,
        amount: transaction.amount,
        category: transaction.category,
        date: new Date(transaction.date),
        description: transaction.description,
        vendor: transaction.description || transaction.category,
        type: transaction.type.toLowerCase()
      };
    });
  } catch (err) {
    console.error('Error fetching account transactions:', err);
    transactionError.value = 'Failed to load transactions. Please try again.';
  } finally {
    isLoadingTransactions.value = false;
  }
};

const submitEditAccount = async () => {
  if (!account.value || !editedAccount.value.name) return;
  
  try {
    isSubmitting.value = true;
    
    // Convert balance string to number
    let balanceValue: number;
    if (typeof editedAccount.value.balance === 'string') {
      balanceValue = parseFloat(editedAccount.value.balance.replace(/,/g, '') || '0');
    } else {
      balanceValue = editedAccount.value.balance;
    }
    
    // For credit accounts, make the balance negative if it's positive
    const adjustedBalance = editedAccount.value.type === 'credit' && balanceValue > 0 
      ? -balanceValue 
      : balanceValue;
    
    await accountStore.updateAccount(accountId.value, {
      name: editedAccount.value.name,
      type: editedAccount.value.type as 'checking' | 'savings' | 'credit' | 'investment',
      balance: adjustedBalance,
      institution: editedAccount.value.institution || undefined,
      lastFour: editedAccount.value.lastFour || undefined,
      color: editedAccount.value.color
    });
    
    showEditModal.value = false;
  } catch (err) {
    console.error('Error updating account:', err);
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = () => {
  showDeleteModal.value = true;
};

const deleteAccount = async () => {
  if (!accountId.value) return;
  
  try {
    isDeleting.value = true;
    await accountStore.deleteAccount(accountId.value);
    router.push('/accounts');
  } catch (err) {
    console.error('Error deleting account:', err);
  } finally {
    isDeleting.value = false;
    showDeleteModal.value = false;
  }
};

onMounted(async () => {
  if (accountStore.accounts.length === 0) {
    await accountStore.fetchAccounts();
  }
  
  fetchAccountTransactions();
});
</script>

<style scoped>
.account-detail-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.back-btn {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  color: #4b5563;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: #e5e7eb;
}

.account-actions {
  display: flex;
  gap: 0.75rem;
}

.edit-btn {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  color: #4b5563;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.edit-btn:hover {
  background-color: #e5e7eb;
}

.delete-btn {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #fee2e2;
  color: #dc2626;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.delete-btn:hover {
  background-color: #fecaca;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid rgba(16, 185, 129, 0.2);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.account-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background-color: white;
  border-radius: 0.5rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 6px solid;
}

.account-info h1 {
  font-size: 1.875rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.account-type {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.account-institution {
  font-size: 0.875rem;
  color: #6b7280;
}

.account-balance {
  text-align: right;
}

.balance-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.balance-amount {
  font-size: 2rem;
  font-weight: 600;
  color: #10b981;
}

.balance-amount.negative {
  color: #ef4444;
}

.transactions-section {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 500;
  color: #4b5563;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.loading-transactions,
.empty-transactions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.add-transaction-btn {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #10b981;
  color: white;
  border-radius: 0.375rem;
  font-weight: 500;
  margin-top: 1rem;
  transition: background-color 0.2s;
}

.add-transaction-btn:hover {
  background-color: #059669;
}

.transactions-list {
  display: flex;
  flex-direction: column;
}

.transaction-item {
  display: flex;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-date {
  width: 80px;
  flex-shrink: 0;
}

.transaction-date .date {
  font-weight: 500;
  color: #1f2937;
}

.transaction-date .day {
  font-size: 0.75rem;
  color: #6b7280;
}

.transaction-details {
  flex: 1;
  margin: 0 1rem;
}

.transaction-vendor {
  font-weight: 500;
  color: #1f2937;
}

.transaction-category {
  font-size: 0.875rem;
  color: #6b7280;
}

.transaction-amount {
  font-weight: 600;
  text-align: right;
  width: 100px;
}

.view-all-link {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.view-all-link a {
  color: #10b981;
  font-weight: 500;
  text-decoration: none;
}

.view-all-link a:hover {
  text-decoration: underline;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-container {
  background-color: white;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.delete-modal {
  max-width: 450px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  color: #6b7280;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #1f2937;
}

.modal-content {
  padding: 1.5rem;
}

.account-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
}

.balance-input {
  position: relative;
}

.currency-symbol {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.balance-input input {
  padding-left: 1.5rem;
}

.color-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.color-option {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.color-option.selected {
  border-color: #1f2937;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-btn {
  padding: 0.625rem 1.25rem;
  background-color: #f3f4f6;
  color: #4b5563;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background-color: #e5e7eb;
}

.submit-btn {
  padding: 0.625rem 1.25rem;
  background-color: #10b981;
  color: white;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background-color: #059669;
}

.submit-btn:disabled,
.delete-confirm-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.delete-confirm-btn {
  padding: 0.625rem 1.25rem;
  background-color: #ef4444;
  color: white;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.delete-confirm-btn:hover:not(:disabled) {
  background-color: #dc2626;
}

@media (max-width: 768px) {
  .account-detail-view {
    padding: 1rem;
  }
  
  .account-header {
    flex-direction: column;
    padding: 1.5rem;
  }
  
  .account-balance {
    text-align: left;
    margin-top: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .account-actions {
    width: 100%;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style> 