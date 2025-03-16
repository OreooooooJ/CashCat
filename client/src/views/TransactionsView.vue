<template>
  <div class="transactions-view">
    <div class="page-header">
      <h1>Transactions</h1>
      <button class="add-transaction-btn" @click="showAddTransactionModal = true">
        <PlusIcon class="w-5 h-5 mr-2" />
        Add Transaction
      </button>
    </div>

    <div class="filters">
      <div class="filter-group">
        <label for="account-filter">Account</label>
        <select id="account-filter" v-model="accountFilter">
          <option value="">All Accounts</option>
          <option v-for="account in accounts" :key="account.id" :value="account.id">
            {{ account.name }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="type-filter">Type</label>
        <select id="type-filter" v-model="typeFilter">
          <option value="">All Types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="category-filter">Category</label>
        <select id="category-filter" v-model="categoryFilter">
          <option value="">All Categories</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading transactions...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <ExclamationCircleIcon class="w-8 h-8 text-red-500" />
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchTransactions">Retry</button>
    </div>

    <div v-else-if="filteredTransactions.length === 0" class="empty-state">
      <ReceiptRefundIcon class="w-16 h-16 text-gray-300" />
      <h2>No Transactions Found</h2>
      <p>Add your first transaction or adjust your filters</p>
      <button class="add-transaction-btn" @click="showAddTransactionModal = true">
        <PlusIcon class="w-5 h-5 mr-2" />
        Add Transaction
      </button>
    </div>

    <div v-else class="transactions-table-container">
      <table class="transactions-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Account</th>
            <th class="amount-column">Amount</th>
            <th class="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="transaction in filteredTransactions" :key="transaction.id" :class="{ 'income': transaction.amount > 0 }">
            <td>{{ formatDate(transaction.date) }}</td>
            <td>{{ transaction.description || transaction.vendor }}</td>
            <td>{{ transaction.category }}</td>
            <td>{{ getAccountName(transaction.accountId) }}</td>
            <td class="amount-column" :class="{ 'income': transaction.amount > 0, 'expense': transaction.amount < 0 }">
              {{ formatCurrency(transaction.amount) }}
            </td>
            <td class="actions-column">
              <button class="delete-btn" @click="deleteTransaction(transaction.id)">
                <TrashIcon class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Transaction Form Modal -->
    <TransitionRoot appear :show="showAddTransactionModal" as="template">
      <Dialog as="div" class="modal-wrapper" @close="closeTransactionForm">
        <div class="modal-backdrop" aria-hidden="true" />
        
        <div class="modal-container">
          <TransitionChild
            as="template"
            enter="modal-enter"
            enter-from="modal-enter-from"
            enter-to="modal-enter-to"
            leave="modal-leave"
            leave-from="modal-leave-from"
            leave-to="modal-leave-to"
          >
            <DialogPanel class="modal-panel">
              <DialogTitle as="h3" class="modal-title">Add Transaction</DialogTitle>
              <TransactionEntryView @save="onTransactionAdded" @close="closeTransactionForm" />
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue';
import { PlusIcon, TrashIcon, ExclamationCircleIcon, ReceiptRefundIcon } from '@heroicons/vue/24/outline';
import TransactionEntryView from './TransactionEntryView.vue';
import { useTransactionStore } from '../stores/transaction';
import { useAccountStore } from '../stores/account';
import currency from 'currency.js';
import type { Transaction } from '../types/transaction';

// Stores
const transactionStore = useTransactionStore();
const accountStore = useAccountStore();

// State
const showAddTransactionModal = ref(false);
const accountFilter = ref('');
const typeFilter = ref('');
const categoryFilter = ref('');
const isDeleting = ref(false);

// Computed
const transactions = computed(() => transactionStore.transactions);
const accounts = computed(() => accountStore.accounts);
const isLoading = computed(() => transactionStore.isLoading);
const error = computed(() => transactionStore.error);

// Available categories
const categories = [
  'Income',
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Bills & Utilities',
  'Entertainment',
  'Health & Fitness',
  'Travel',
  'Education',
  'Personal Care',
  'Gifts & Donations',
  'Investments',
  'Other'
];

// Filtered transactions
const filteredTransactions = computed(() => {
  return transactions.value.filter(transaction => {
    // Account filter
    if (accountFilter.value && transaction.accountId && transaction.accountId !== accountFilter.value) {
      return false;
    }
    
    // Type filter
    if (typeFilter.value && transaction.type !== typeFilter.value) {
      return false;
    }
    
    // Category filter
    if (categoryFilter.value && transaction.category !== categoryFilter.value) {
      return false;
    }
    
    return true;
  });
});

// Methods
const formatDate = (date: Date | string | undefined) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatCurrency = (amount: number) => {
  return currency(amount, { symbol: '$' }).format();
};

const getAccountName = (accountId: string | undefined) => {
  if (!accountId) return 'No Account';
  const account = accounts.value.find(a => a.id === accountId);
  return account ? account.name : 'Unknown Account';
};

const closeTransactionForm = () => {
  showAddTransactionModal.value = false;
};

const onTransactionAdded = async () => {
  closeTransactionForm();
  await fetchTransactions();
};

const fetchTransactions = async () => {
  await transactionStore.fetchTransactions();
};

const deleteTransaction = async (id: string) => {
  if (isDeleting.value) return;
  
  if (!confirm('Are you sure you want to delete this transaction?')) {
    return;
  }
  
  isDeleting.value = true;
  
  try {
    await transactionStore.deleteTransaction(id);
  } catch (error) {
    console.error('Error deleting transaction:', error);
  } finally {
    isDeleting.value = false;
  }
};

// Load data
onMounted(async () => {
  await accountStore.fetchAccounts();
  await transactionStore.fetchTransactions();
});
</script>

<style scoped>
.transactions-view {
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

h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.add-transaction-btn {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-transaction-btn:hover {
  background: #2563eb;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 200px;
}

.filter-group label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.transactions-table-container {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
}

.transactions-table th,
.transactions-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.transactions-table th {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.transactions-table tbody tr:hover {
  background: #f9fafb;
}

.amount-column {
  text-align: right;
  font-weight: 600;
}

.income {
  color: #10b981;
}

.expense {
  color: #ef4444;
}

.actions-column {
  text-align: center;
  width: 60px;
}

.delete-btn {
  padding: 0.25rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s;
}

.delete-btn:hover {
  color: #ef4444;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state p {
  color: #ef4444;
  margin: 0.5rem 0 1rem;
}

.retry-btn {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.empty-state h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 1rem 0 0.5rem;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

/* Modal Styles */
.modal-wrapper {
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow-y: auto;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-container {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  pointer-events: none;
}

.modal-panel {
  width: 100%;
  max-width: 600px;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  position: relative;
  z-index: 51;
  pointer-events: auto;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

/* Modal Transitions */
.modal-enter {
  transition: all 0.3s ease-out;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.modal-enter-to {
  opacity: 1;
  transform: scale(1);
}

.modal-leave {
  transition: all 0.2s ease-in;
}

.modal-leave-from {
  opacity: 1;
  transform: scale(1);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style> 