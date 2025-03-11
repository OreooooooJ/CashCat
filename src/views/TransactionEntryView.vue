<template>
  <div class="transaction-entry">
    <h2>Add Transaction</h2>
    <Form v-slot="{ errors }" class="entry-form" @submit="onSubmit">
      <div class="form-group" :class="{ 'has-error': errors.amount }">
        <label for="amount">Amount</label>
        <Field
          id="amount"
          v-slot="{ field }"
          v-model="amount"
          name="amount"
          type="text"
          rules="required|min_value:0"
        >
          <input
            v-bind="field"
            type="text"
            :class="{ error: errors.amount }"
            :value="formattedAmount"
            @input="formatAmount"
            @blur="formatAmount"
          />
        </Field>
        <span v-if="errors.amount" class="error-message">{{ errors.amount }}</span>
      </div>

      <div class="form-group" :class="{ 'has-error': errors.vendor }">
        <label for="vendor">Vendor</label>
        <Field
          id="vendor"
          v-slot="{ field, errorMessage }"
          name="vendor"
          type="text"
          rules="required|min:2"
        >
          <div class="vendor-input">
            <input
              v-bind="field"
              type="text"
              :class="{ error: errorMessage }"
              list="vendor-suggestions"
              @input="handleVendorInput"
            />
            <datalist id="vendor-suggestions">
              <option v-for="vendor in vendorSuggestions" :key="vendor" :value="vendor" />
            </datalist>
          </div>
        </Field>
        <span v-if="errors.vendor" class="error-message">{{ errors.vendor }}</span>
      </div>

      <div class="form-group" :class="{ 'has-error': errors.category }">
        <label for="category">Category</label>
        <Field
          id="category"
          v-slot="{ field, errorMessage }"
          name="category"
          as="select"
          rules="required"
        >
          <select v-bind="field" :class="{ error: errorMessage }">
            <option value="">Select a category</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </Field>
        <span v-if="errors.category" class="error-message">{{ errors.category }}</span>
      </div>

      <div class="form-group" :class="{ 'has-error': errors.date }">
        <label for="date">Date</label>
        <Field v-slot="{ handleChange, errorMessage }" name="date" rules="required">
          <Datepicker
            v-model="selectedDate"
            :enable-time-picker="false"
            :class="{ error: errorMessage }"
            auto-apply
            input-class-name="date-input"
            @update:model-value="handleChange"
          />
        </Field>
        <span v-if="errors.date" class="error-message">{{ errors.date }}</span>
      </div>

      <button type="submit" class="submit-button">Add Transaction</button>
    </Form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Form, Field } from 'vee-validate'
import currency from 'currency.js'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

// Types
interface Category {
  id: string
  name: string
}

interface Transaction {
  id?: string
  amount: number
  vendor: string
  category: string
  date: Date
}

// State
const amount = ref('')
const formattedAmount = ref('')
const selectedDate = ref(new Date())
const vendorSuggestions = ref<string[]>([])
const recentVendors = ref<string[]>([])

// Sample categories (replace with your categories management system)
const categories = ref<Category[]>([
  { id: 'groceries', name: 'Groceries' },
  { id: 'utilities', name: 'Utilities' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'transport', name: 'Transportation' },
  { id: 'dining', name: 'Dining Out' },
  { id: 'shopping', name: 'Shopping' },
  { id: 'health', name: 'Healthcare' },
  { id: 'other', name: 'Other' },
])

// Currency formatting
const formatAmount = (event?: Event) => {
  if (event) {
    const input = (event.target as HTMLInputElement).value.replace(/[^\d.]/g, '')
    amount.value = input
  }

  if (amount.value) {
    formattedAmount.value = currency(amount.value, {
      symbol: '$',
      precision: 2,
    }).format()
  }
}

// Vendor suggestions
const handleVendorInput = (event: Event) => {
  const input = (event.target as HTMLInputElement).value.toLowerCase()
  if (input.length > 1) {
    vendorSuggestions.value = recentVendors.value.filter(vendor =>
      vendor.toLowerCase().includes(input)
    )
  } else {
    vendorSuggestions.value = []
  }
}

// Form submission
const onSubmit = (values: any) => {
  const transaction: Transaction = {
    amount: currency(values.amount).value,
    vendor: values.vendor,
    category: values.category,
    date: selectedDate.value,
  }

  // Store in local state (we'll add Firestore integration later)
  const transactions = JSON.parse(localStorage.getItem('transactions') || '[]')
  transactions.push({ ...transaction, id: Date.now().toString() })
  localStorage.setItem('transactions', JSON.stringify(transactions))

  // Update recent vendors
  if (!recentVendors.value.includes(values.vendor)) {
    recentVendors.value.push(values.vendor)
    localStorage.setItem('recentVendors', JSON.stringify(recentVendors.value))
  }

  // Reset form
  amount.value = ''
  formattedAmount.value = ''
  selectedDate.value = new Date()
}

// Load saved vendors on mount
onMounted(() => {
  const savedVendors = localStorage.getItem('recentVendors')
  if (savedVendors) {
    recentVendors.value = JSON.parse(savedVendors)
  }
})
</script>

<style scoped>
.transaction-entry {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.entry-form {
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

input,
select,
.date-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus,
select:focus,
.date-input:focus {
  outline: none;
  border-color: #1a237e;
  box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.1);
}

.has-error input,
.has-error select,
.has-error .date-input {
  border-color: #dc2626;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
}

.submit-button {
  background: #1a237e;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover {
  background: #283593;
}

.submit-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.2);
}

/* Date picker customization */
:deep(.dp__input) {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
}

:deep(.dp__input:focus) {
  border-color: #1a237e;
  box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.1);
}

:deep(.dp__main) {
  border-radius: 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
