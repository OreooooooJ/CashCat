<template>
  <form @submit.prevent="onSubmit" class="transaction-form">
    <div class="form-group">
      <label for="amount">Amount</label>
      <div class="amount-input">
        <span class="currency-symbol">$</span>
        <input
          id="amount"
          v-model="amount"
          type="text"
          required
          @input="formatAmount"
          :class="{ 'has-error': v$.amount.$error }"
        />
      </div>
      <span v-if="v$.amount.$error" class="error-message">
        Please enter a valid amount
      </span>
    </div>

    <div class="form-group">
      <label for="vendor">Vendor</label>
      <input
        id="vendor"
        v-model="vendor"
        type="text"
        required
        :class="{ 'has-error': v$.vendor.$error }"
      />
      <span v-if="v$.vendor.$error" class="error-message">
        Vendor name is required
      </span>
    </div>

    <div class="form-group">
      <label for="category">Category</label>
      <select
        id="category"
        v-model="category"
        required
        :class="{ 'has-error': v$.category.$error }"
      >
        <option value="">Select a category</option>
        <option v-for="cat in categories" :key="cat" :value="cat">
          {{ cat }}
        </option>
      </select>
      <span v-if="v$.category.$error" class="error-message">
        Please select a category
      </span>
    </div>

    <div class="form-group">
      <label for="account">Account</label>
      <select
        id="account"
        v-model="accountId"
        required
        :class="{ 'has-error': v$.accountId.$error }"
      >
        <option value="">Select an account</option>
        <option v-for="account in accounts" :key="account.id" :value="account.id">
          {{ account.name }}
        </option>
      </select>
      <span v-if="v$.accountId.$error" class="error-message">
        Please select an account
      </span>
    </div>

    <div class="form-group">
      <label for="description">Description (Optional)</label>
      <textarea
        id="description"
        v-model="description"
        rows="3"
      />
    </div>

    <div class="form-actions">
      <button type="button" class="cancel-btn" @click="$emit('close')">
        Cancel
      </button>
      <button type="submit" class="submit-btn">
        Add Transaction
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import currency from 'currency.js'
import { getMockData } from '../services/mockData'
import type { Transaction } from '../types/transaction'

const emit = defineEmits<{
  (e: 'save', transaction: Transaction): void
  (e: 'close'): void
}>()

// Form state
const amount = ref('')
const vendor = ref('')
const category = ref('')
const accountId = ref('')
const description = ref('')

// Get accounts for the dropdown
const { accounts } = getMockData()

// Available categories
const categories = [
  'Income',
  'Bills & Utilities',
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Health & Fitness',
  'Travel',
  'Other'
]

// Validation rules
const rules = {
  amount: { required, validAmount: helpers.withMessage('Invalid amount', (value: string) => {
    if (!value) return false
    const numericValue = currency(value.replace(/[^\d.-]/g, '')).value
    return !isNaN(numericValue) && numericValue !== 0
  })},
  vendor: { required },
  category: { required },
  accountId: { required }
}

const v$ = useVuelidate(rules, {
  amount,
  vendor,
  category,
  accountId
})

// Format amount as currency
const formatAmount = (event: Event) => {
  const input = (event.target as HTMLInputElement).value.replace(/[^\d.-]/g, '')
  if (input) {
    amount.value = currency(input, { symbol: '' }).format()
  } else {
    amount.value = ''
  }
}

// Form submission
const onSubmit = async () => {
  const isValid = await v$.value.$validate()
  if (!isValid) return

  const numericAmount = currency(amount.value).value

  const transaction: Transaction = {
    id: `t${Date.now()}`,
    amount: numericAmount,
    vendor: vendor.value,
    category: category.value,
    date: new Date(),
    accountId: accountId.value,
    description: description.value || undefined,
    isAutoCategorized: false
  }

  emit('save', transaction)
}
</script>

<style scoped>
.transaction-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 500;
  color: #374151;
}

.amount-input {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-symbol {
  position: absolute;
  left: 0.75rem;
  color: #6b7280;
}

input[type="text"],
select,
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input[id="amount"] {
  padding-left: 1.75rem;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #14b8a6;
  box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.1);
}

.has-error {
  border-color: #dc2626;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.cancel-btn,
.submit-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-btn {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #374151;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.submit-btn {
  background: #14b8a6;
  border: none;
  color: white;
}

.submit-btn:hover {
  background: #0d9488;
}
</style>
