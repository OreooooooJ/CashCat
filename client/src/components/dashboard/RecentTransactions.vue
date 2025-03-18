<template>
  <div class="recent-transactions">
    <h3>Recent Transactions</h3>
    <div class="transactions-list">
      <div v-if="!transactions.length" class="no-transactions">No transactions yet</div>
      <div v-for="transaction in transactions" :key="transaction.id" class="transaction-item">
        <div class="transaction-info">
          <div class="primary-info">
            <div class="vendor-info">
              <span class="vendor">{{ transaction.description || 'Unknown' }}</span>
              <span v-if="transaction.originalDescription" class="original-desc">
                {{ transaction.originalDescription }}
              </span>
            </div>
            <span class="amount" :class="{ 
              'income': transaction.type === 'income' || transaction.type === 'INCOME', 
              'expense': transaction.type === 'expense' || transaction.type === 'EXPENSE' 
            }">
              {{ formatCurrency(transaction.amount) }}
            </span>
          </div>
          <div class="secondary-info">
            <div class="category-info">
              <span
                class="category"
                :style="{ backgroundColor: getCategoryColor(transaction.category) }"
              >
                {{ transaction.category }}
              </span>
              <span v-if="transaction.subcategory" class="subcategory">
                {{ getSubcategoryIcon(transaction.subcategory) }} {{ transaction.subcategory }}
              </span>
            </div>
            <span class="date">{{ formatDate(transaction.date) }}</span>
          </div>
          <div v-if="transaction.accountId" class="description">
            Account ID: {{ transaction.accountId }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import currency from 'currency.js'
import type { Transaction } from '@/types/transaction'
import { categoryColors, subcategoryIcons } from '@/services/mockData'

const props = defineProps<{
  transactions: Transaction[]
}>()

// Debug log to see transaction types
console.log('RecentTransactions received transactions:', props.transactions);

// Check if transactions have the expected properties
if (props.transactions.length > 0) {
  console.log('First transaction:', {
    id: props.transactions[0].id,
    description: props.transactions[0].description,
    type: props.transactions[0].type,
    accountId: props.transactions[0].accountId,
    amount: props.transactions[0].amount,
    date: props.transactions[0].date,
    vendor: props.transactions[0].vendor
  });
} else {
  console.log('No transactions found, fetching from API...');
}

// Additional debug log to check for any transactions with unexpected types
const unexpectedTypes = props.transactions.filter(t => 
  t.type !== 'income' && 
  t.type !== 'expense' && 
  t.type !== 'INCOME' && 
  t.type !== 'EXPENSE'
);
if (unexpectedTypes.length > 0) {
  console.warn('Found transactions with unexpected types:', unexpectedTypes);
}

const formatCurrency = (amount: number) => {
  return currency(amount, { symbol: '$' }).format()
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

const getCategoryColor = (category: string) => {
  return categoryColors[category as keyof typeof categoryColors] || categoryColors.Other
}

const getSubcategoryIcon = (subcategory: string) => {
  return subcategoryIcons[subcategory as keyof typeof subcategoryIcons] || '•'
}
</script>

<style scoped>
.recent-transactions {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: 100%;
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transaction-item {
  padding: 1rem;
  border-radius: 6px;
  background: #f9fafb;
  transition: background-color 0.2s;
}

.transaction-item:hover {
  background: #f3f4f6;
}

.transaction-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.primary-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.vendor-info {
  display: flex;
  flex-direction: column;
}

.vendor {
  font-weight: 500;
  color: #1f2937;
}

.original-desc {
  font-size: 0.75rem;
  color: #6b7280;
}

.amount {
  font-weight: 600;
  color: #047857;
  white-space: nowrap;
}

.amount.income {
  color: #047857;
}

.amount.expense {
  color: #dc2626;
}

.secondary-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: white;
  text-transform: capitalize;
}

.subcategory {
  color: #4b5563;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.date {
  color: #6b7280;
  font-size: 0.75rem;
}

.description {
  font-size: 0.875rem;
  color: #4b5563;
  margin-top: 0.25rem;
}

.no-transactions {
  text-align: center;
  color: #6b7280;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 0.875rem;
}
</style>
