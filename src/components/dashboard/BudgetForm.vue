<template>
  <div class="budget-form">
    <Form v-slot="{ errors }" class="form" @submit="onSubmit">
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
            <option
              v-for="category in Object.keys(categoryColors)"
              :key="category"
              :value="category"
            >
              {{ category }}
            </option>
          </select>
        </Field>
        <span v-if="errors.category" class="error-message">{{ errors.category }}</span>
      </div>

      <div class="form-group" :class="{ 'has-error': errors.amount }">
        <label for="amount">Budget Amount</label>
        <Field
          id="amount"
          v-slot="{ field }"
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

      <div class="form-group">
        <label for="period">Budget Period</label>
        <Field
          id="period"
          v-slot="{ field, errorMessage }"
          name="period"
          as="select"
          rules="required"
        >
          <select v-bind="field" :class="{ error: errorMessage }">
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </Field>
        <span v-if="errors.period" class="error-message">{{ errors.period }}</span>
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <Field v-slot="{ field }" name="isRecurring" type="checkbox">
            <input type="checkbox" v-bind="field" />
          </Field>
          Recurring budget
        </label>
      </div>

      <div class="form-group alerts-section">
        <h4>Alert Thresholds</h4>
        <div class="alerts-grid">
          <div class="alert-input">
            <label for="warning">Warning at</label>
            <Field
              id="warning"
              v-slot="{ field, errorMessage }"
              name="warning"
              type="number"
              rules="required|min_value:1|max_value:100"
            >
              <div class="percentage-input">
                <input
                  v-bind="field"
                  type="number"
                  min="1"
                  max="100"
                  :class="{ error: errorMessage }"
                />
                <span class="percentage-symbol">%</span>
              </div>
            </Field>
          </div>

          <div class="alert-input">
            <label for="critical">Critical at</label>
            <Field
              id="critical"
              v-slot="{ field, errorMessage }"
              name="critical"
              type="number"
              rules="required|min_value:1|max_value:100"
            >
              <div class="percentage-input">
                <input
                  v-bind="field"
                  type="number"
                  min="1"
                  max="100"
                  :class="{ error: errorMessage }"
                />
                <span class="percentage-symbol">%</span>
              </div>
            </Field>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="cancel-btn" @click="$emit('close')">Cancel</button>
        <button type="submit" class="submit-btn">
          {{ editMode ? 'Update Budget' : 'Set Budget' }}
        </button>
      </div>
    </Form>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'
import { Form, Field } from 'vee-validate'
import currency from 'currency.js'
import type { Budget } from '../../types/budget'
import { categoryColors } from '../../services/mockData'

const props = defineProps<{
  editMode?: boolean
  initialBudget?: Budget
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', budget: Budget): void
}>()

const amount = ref(props.initialBudget?.amount.toString() || '')
const formattedAmount = ref('')

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

const onSubmit = (values: any) => {
  const budget: Budget = {
    id: props.initialBudget?.id,
    category: values.category,
    amount: currency(values.amount).value,
    spent: props.initialBudget?.spent || 0,
    period: values.period,
    startDate: new Date(),
    isRecurring: values.isRecurring,
    alerts: {
      warning: Number(values.warning),
      critical: Number(values.critical),
    },
  }

  emit('save', budget)
}
</script>

<style scoped>
.budget-form {
  padding: 1rem;
}

.form {
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
select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus,
select:focus {
  outline: none;
  border-color: #1a237e;
  box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.1);
}

.has-error input,
.has-error select {
  border-color: #dc2626;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type='checkbox'] {
  width: auto;
  margin: 0;
}

.alerts-section h4 {
  font-size: 1rem;
  color: #374151;
  margin: 0 0 0.75rem;
}

.alerts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.alert-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.percentage-input {
  position: relative;
  display: flex;
  align-items: center;
}

.percentage-input input {
  padding-right: 2rem;
}

.percentage-symbol {
  position: absolute;
  right: 0.75rem;
  color: #6b7280;
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
  background: #1a237e;
  border: none;
  color: white;
}

.submit-btn:hover {
  background: #283593;
}
</style>
