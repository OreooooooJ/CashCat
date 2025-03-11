<template>
  <div class="transaction-entry">
    <h2>Add Transaction</h2>
    <Form v-slot="{ errors }" class="entry-form" @submit="onSubmit">
      <div class="form-group" :class="{ 'has-error': errors.description }">
        <label for="description">Description</label>
        <Field
          id="description"
          v-slot="{ field, errorMessage }"
          name="description"
          type="text"
          rules="required|min:2"
        >
          <input
            v-bind="field"
            type="text"
            :class="{ error: errorMessage }"
            @input="handleDescriptionInput"
          />
        </Field>
        <span v-if="errors.description" class="error-message">{{ errors.description }}</span>

        <!-- Auto-categorization suggestions -->
        <div v-if="autoCategorization" class="suggestions">
          <div v-if="autoCategorization.vendor.length > 0" class="suggestion-group">
            <span class="suggestion-label">Vendor:</span>
            <div class="suggestion-items">
              <button
                v-for="suggestion in autoCategorization.vendor"
                :key="suggestion.vendor"
                type="button"
                class="suggestion-item"
                :class="{ 'high-confidence': suggestion.confidence > 0.8 }"
                @click="selectVendor(suggestion.vendor)"
              >
                {{ suggestion.vendor }}
              </button>
            </div>
          </div>

          <div v-if="autoCategorization.categories.length > 0" class="suggestion-group">
            <span class="suggestion-label">Category:</span>
            <div class="suggestion-items">
              <button
                v-for="suggestion in autoCategorization.categories"
                :key="suggestion.category + (suggestion.subcategory || '')"
                type="button"
                class="suggestion-item"
                :class="{ 'high-confidence': suggestion.confidence > 0.8 }"
                @click="selectCategory(suggestion)"
              >
                {{ suggestion.category }}
                <span v-if="suggestion.subcategory" class="subcategory">
                  ({{ suggestion.subcategory }})
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="form-group" :class="{ 'has-error': errors.amount }">
        <label for="amount">Amount</label>
        <Field
          id="amount"
          v-slot="{ field, errorMessage }"
          name="amount"
          type="text"
          rules="required|min_value:0"
        >
          <input
            v-bind="field"
            v-model="amount"
            type="text"
            :class="{ error: errorMessage }"
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
          <input v-bind="field" v-model="vendor" type="text" :class="{ error: errorMessage }" />
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
          <select v-bind="field" v-model="category" :class="{ error: errorMessage }">
            <option value="">Select a category</option>
            <option v-for="cat in Object.keys(categoryColors)" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </Field>
        <span v-if="errors.category" class="error-message">{{ errors.category }}</span>
      </div>

      <div class="form-group" :class="{ 'has-error': errors.subcategory }">
        <label for="subcategory">Subcategory</label>
        <Field id="subcategory" v-slot="{ field, errorMessage }" name="subcategory" as="select">
          <select v-bind="field" v-model="subcategory" :class="{ error: errorMessage }">
            <option value="">Select a subcategory</option>
            <option v-for="sub in getSubcategories" :key="sub" :value="sub">
              {{ sub }}
            </option>
          </select>
        </Field>
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

      <button type="submit" class="submit-button" :disabled="loading">
        {{ loading ? 'Adding...' : 'Add Transaction' }}
      </button>
    </Form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Form, Field } from 'vee-validate'
import currency from 'currency.js'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { categoryColors } from '../services/mockData'
import { categorizationService } from '../services/categorizationService'
import type { Transaction } from '../types/transaction'
import type { AutoCategorizationResult, CategorySuggestion } from '../types/categorization'

const props = defineProps<{
  defaultAccountId?: string
}>()

const emit = defineEmits<{
  (e: 'transaction-added', transaction: Transaction): void
}>()

// Form state
const loading = ref(false)
const amount = ref('')
const formattedAmount = ref('')
const selectedDate = ref(new Date())
const vendor = ref('')
const category = ref('')
const subcategory = ref('')
const autoCategorization = ref<AutoCategorizationResult | null>(null)

// Computed properties
const getSubcategories = computed(() => {
  // TODO: Get subcategories based on selected category
  return ['Groceries', 'Restaurants', 'Coffee Shops', 'Fast Food']
})

// Methods
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

const handleDescriptionInput = (event: Event) => {
  const input = (event.target as HTMLInputElement).value
  if (input.length > 2) {
    // Get categorization suggestions
    const result = categorizationService.categorizeTransaction({
      originalDescription: input,
    })

    if (result.vendor.length > 0 || result.categories.length > 0) {
      autoCategorization.value = result

      // Auto-fill if we have high-confidence matches
      const bestVendor = result.vendor.find(v => v.confidence > 0.8)
      const bestCategory = result.categories.find(c => c.confidence > 0.8)

      if (bestVendor) {
        vendor.value = bestVendor.vendor
      }

      if (bestCategory) {
        category.value = bestCategory.category
        if (bestCategory.subcategory) {
          subcategory.value = bestCategory.subcategory
        }
      }
    } else {
      autoCategorization.value = null
    }
  }
}

const selectVendor = (selectedVendor: string) => {
  vendor.value = selectedVendor
}

const selectCategory = (suggestion: CategorySuggestion) => {
  category.value = suggestion.category
  if (suggestion.subcategory) {
    subcategory.value = suggestion.subcategory
  }
}

const resetForm = () => {
  amount.value = ''
  formattedAmount.value = ''
  selectedDate.value = new Date()
  vendor.value = ''
  category.value = ''
  subcategory.value = ''
  autoCategorization.value = null
}

const onSubmit = async (values: any) => {
  try {
    loading.value = true
    const transaction: Transaction = {
      amount: currency(amount.value).value,
      vendor: values.vendor || vendor.value,
      category: values.category || category.value,
      subcategory: values.subcategory || subcategory.value || undefined,
      date: selectedDate.value,
      originalDescription: values.description,
      isAutoCategorized: autoCategorization.value !== null,
      accountId: props.defaultAccountId || 'default',
    }

    // Learn from this categorization if it wasn't auto-categorized
    if (!transaction.isAutoCategorized && transaction.originalDescription) {
      categorizationService.learnFromTransaction(transaction)
    }

    // Reset form
    resetForm()
    emit('transaction-added', transaction)
  } catch (error) {
    console.error('Error adding transaction:', error)
  } finally {
    loading.value = false
  }
}
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

.submit-button:disabled {
  background: #9fa8da;
  cursor: not-allowed;
}

/* Suggestions styles */
.suggestions {
  margin-top: 0.5rem;
}

.suggestion-group {
  margin-top: 0.5rem;
}

.suggestion-label {
  font-size: 0.75rem;
  color: #6b7280;
  display: block;
  margin-bottom: 0.25rem;
}

.suggestion-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.suggestion-item {
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-item:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.suggestion-item.high-confidence {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #047857;
}

.suggestion-item.high-confidence:hover {
  background: #d1fae5;
  border-color: #6ee7b7;
}

.subcategory {
  font-size: 0.75rem;
  color: #6b7280;
  margin-left: 0.25rem;
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
