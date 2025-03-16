<template>
  <div class="transaction-entry">
    <h1 class="text-2xl font-bold mb-6">Add Transaction</h1>
    
    <form class="transaction-form" @submit.prevent="saveTransaction">
      <div class="form-group">
        <label for="amount">Amount</label>
        <div class="amount-input">
          <span class="currency-symbol">$</span>
          <input
            id="amount"
            v-model="transaction.amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            required
            @input="formatAmount"
          />
        </div>
        <div v-if="v$.amount.$error" class="error-message">
          {{ v$.amount.$errors[0].$message }}
        </div>
      </div>
      
      <div class="form-group">
        <label for="type">Type</label>
        <select
          id="type"
          v-model="transaction.type"
          required
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <div v-if="v$.type.$error" class="error-message">
          {{ v$.type.$errors[0].$message }}
        </div>
      </div>
      
      <div class="form-group">
        <label for="description">Description</label>
        <input
          id="description"
          v-model="transaction.description"
          type="text"
          placeholder="Enter transaction description"
          required
        />
        <div v-if="v$.description.$error" class="error-message">
          {{ v$.description.$errors[0].$message }}
        </div>
      </div>
      
      <div class="form-group">
        <label for="category">Category</label>
        <select
          id="category"
          v-model="transaction.category"
          required
        >
          <option value="" disabled>Select a category</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
        <div v-if="v$.category.$error" class="error-message">
          {{ v$.category.$errors[0].$message }}
        </div>
      </div>
      
      <div class="form-group">
        <label for="account">Account</label>
        <select
          id="account"
          v-model="transaction.accountId"
        >
          <option value="">None</option>
          <option v-for="account in accounts" :key="account.id" :value="account.id">
            {{ account.name }}
          </option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="date">Date</label>
        <input
          id="date"
          v-model="dateString"
          type="date"
          required
        />
        <div v-if="v$.date.$error" class="error-message">
          {{ v$.date.$errors[0].$message }}
        </div>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="save-button" :disabled="isSubmitting">
          {{ isSubmitting ? 'Adding...' : 'Add Transaction' }}
        </button>
        <button type="button" class="cancel-button" @click="$emit('close')">
          Cancel
        </button>
      </div>
      
      <div v-if="error" class="form-error">
        {{ error }}
      </div>
    </form>
    
    <!-- Debug section -->
    <div class="mt-8 p-4 bg-gray-100 rounded-lg">
      <h3 class="text-lg font-semibold mb-2">Debug Info</h3>
      <div class="text-sm">
        <p><strong>Transaction Data:</strong> {{ JSON.stringify(transaction) }}</p>
        <p><strong>Validation Errors:</strong> {{ v$.$errors.length > 0 ? JSON.stringify(v$.$errors) : 'None' }}</p>
        <p><strong>Available Accounts:</strong> {{ accounts.length > 0 ? accounts.length + ' accounts' : 'No accounts' }}</p>
        <div v-if="submitResult" class="mt-2 p-2 bg-blue-100 rounded">
          <p><strong>Last Submit Result:</strong> {{ submitResult }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required, minValue } from '@vuelidate/validators';
import { useTransactionStore } from '@/stores/transaction';
import { useAccountStore } from '@/stores/account';
import type { Transaction } from '@/types/transaction';

const emit = defineEmits(['save', 'close']);

const transactionStore = useTransactionStore();
const accountStore = useAccountStore();
const accounts = ref(accountStore.accounts);

// Debug state
const submitResult = ref('');

// Form state
const transaction = ref({
  amount: '',
  type: 'expense',
  category: '',
  description: '',
  date: new Date(),
  accountId: ''
});

const isSubmitting = ref(false);
const error = ref('');

// Format date for input
const dateString = computed({
  get: () => {
    const date = transaction.value.date;
    return date.toISOString().split('T')[0];
  },
  set: (value: string) => {
    transaction.value.date = new Date(value);
  }
});

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

// Validation rules
const rules = {
  amount: { required, minValue: minValue(0.01) },
  description: { required },
  category: { required },
  date: { required }
};

const v$ = useVuelidate(rules, transaction);

// Format amount as currency
function formatAmount() {
  // Ensure amount is a valid number
  const amount = parseFloat(transaction.value.amount as any);
  if (!isNaN(amount)) {
    transaction.value.amount = amount.toFixed(2);
  }
}

// Save transaction
async function saveTransaction() {
  const result = await v$.value.$validate();
  if (!result) return;
  
  isSubmitting.value = true;
  error.value = '';
  submitResult.value = '';
  
  try {
    // Convert amount to number
    let amount = parseFloat(transaction.value.amount as any);
    
    // Get the selected account
    const selectedAccount = accounts.value.find(a => a.id === transaction.value.accountId);
    const accountType = selectedAccount?.type?.toLowerCase() || '';
    
    // Determine sign based on transaction type and account type
    if (transaction.value.type === 'expense') {
      // For expenses, amount should be negative
      amount = -Math.abs(amount);
    } else {
      // For income, amount should be positive
      amount = Math.abs(amount);
    }
    
    // Create transaction object
    const newTransaction: Partial<Transaction> = {
      amount,
      type: transaction.value.type,
      category: transaction.value.category,
      description: transaction.value.description,
      date: transaction.value.date,
      accountId: transaction.value.accountId || undefined
    };
    
    // Save transaction
    const savedTransaction = await transactionStore.addTransaction(newTransaction as any);
    
    // Debug info
    submitResult.value = `Transaction saved successfully with ID: ${savedTransaction.id}`;
    
    // Reset form
    transaction.value = {
      amount: '',
      type: 'expense',
      category: '',
      description: '',
      date: new Date(),
      accountId: ''
    };
    
    // Reset validation
    v$.value.$reset();
    
    // Emit save event
    emit('save', savedTransaction);
  } catch (err) {
    console.error('Error saving transaction:', err);
    error.value = err instanceof Error ? err.message : 'Failed to save transaction';
    submitResult.value = `Error: ${error.value}`;
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(async () => {
  // Fetch accounts
  try {
    await accountStore.fetchAccounts();
    accounts.value = accountStore.accounts;
  } catch (err) {
    console.error('Error fetching accounts:', err);
  }
});
</script>

<style scoped>
.transaction-entry {
  padding: 1.5rem;
}

.transaction-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

input, select, textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.amount-input {
  position: relative;
}

.currency-symbol {
  position: absolute;
  left: 0.75rem;
  top: 0.75rem;
  color: #6b7280;
}

.amount-input input {
  padding-left: 1.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.save-button {
  flex: 1;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
}

.save-button:hover {
  background: #2563eb;
}

.save-button:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.cancel-button {
  flex: 1;
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #d1d5db;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
}

.cancel-button:hover {
  background: #e5e7eb;
}

.error-message {
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.form-error {
  background: #fee2e2;
  color: #b91c1c;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-top: 1rem;
  font-size: 0.875rem;
}
</style>
