<template>
  <div class="expense-tracker">
    <h2>Track Your Expenses</h2>

    <!-- Add Expense Form -->
    <form class="expense-form" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="amount">Amount</label>
        <input id="amount" v-model.number="form.amount" type="number" step="0.01" required />
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <input id="description" v-model="form.description" type="text" required />
      </div>

      <div class="form-group">
        <label for="category">Category</label>
        <select id="category" v-model="form.category" required>
          <option value="food">Food</option>
          <option value="transport">Transport</option>
          <option value="utilities">Utilities</option>
          <option value="entertainment">Entertainment</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div class="form-group">
        <label for="receipt">Receipt (optional)</label>
        <input id="receipt" type="file" accept="image/*" @change="handleFileChange" />
      </div>

      <button type="submit" :disabled="loading">Add Expense</button>
    </form>

    <!-- Expenses List -->
    <div class="expenses-list">
      <h3>Recent Expenses</h3>
      <div v-if="loading">Loading...</div>
      <div v-else-if="expenses.length === 0">No expenses yet</div>
      <ul v-else>
        <li v-for="expense in expenses" :key="expense.id" class="expense-item">
          <div class="expense-details">
            <strong>${{ expense.amount.toFixed(2) }}</strong>
            <span>{{ expense.description }}</span>
            <span class="category">{{ expense.category }}</span>
            <span class="date">{{ formatDate(expense.date) }}</span>
          </div>
          <a v-if="expense.receipt" :href="expense.receipt" target="_blank" class="receipt-link">
            View Receipt
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Expense } from '../types/expense'
import { expenseService } from '../services/expenseService'

const expenses = ref<Expense[]>([])
const loading = ref(false)
const form = ref({
  amount: 0,
  description: '',
  category: 'other' as Expense['category'],
})
const receiptFile = ref<File | null>(null)

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files?.length) {
    receiptFile.value = input.files[0]
  }
}

const handleSubmit = async () => {
  try {
    loading.value = true
    const expense: Expense = {
      ...form.value,
      date: new Date(),
    }

    await expenseService.addExpense(expense, receiptFile.value || undefined)

    // Reset form
    form.value = {
      amount: 0,
      description: '',
      category: 'other',
    }
    receiptFile.value = null

    // Refresh expenses list
    await loadExpenses()
  } catch (error) {
    console.error('Error adding expense:', error)
  } finally {
    loading.value = false
  }
}

const loadExpenses = async () => {
  try {
    loading.value = true
    expenses.value = await expenseService.getExpenses()
  } catch (error) {
    console.error('Error loading expenses:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

onMounted(() => {
  loadExpenses()
})
</script>

<style scoped>
.expense-tracker {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.expense-form {
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  background: #1a237e;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

button:hover {
  background: #283593;
}

button:disabled {
  background: #ccc;
}

.expenses-list {
  margin-top: 2rem;
}

.expenses-list h3 {
  color: #374151;
  margin-bottom: 1rem;
}

.expense-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.expense-details {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.category {
  background: #e0e0e0;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #374151;
}

.receipt-link {
  color: #1a237e;
  text-decoration: none;
  font-size: 0.875rem;
}

.receipt-link:hover {
  text-decoration: underline;
}

.date {
  color: #6b7280;
  font-size: 0.875rem;
}
</style>
