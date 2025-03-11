<template>
  <div class="balance-card">
    <h3>Balance Overview</h3>
    <div class="balance-grid">
      <div class="balance-item income">
        <span class="label">Income</span>
        <span class="amount">{{ formatCurrency(totalIncome) }}</span>
        <ArrowTrendingUpIcon class="icon" />
      </div>
      <div class="balance-item expenses">
        <span class="label">Expenses</span>
        <span class="amount">{{ formatCurrency(totalExpenses) }}</span>
        <ArrowTrendingDownIcon class="icon" />
      </div>
      <div class="balance-item net">
        <span class="label">Net Balance</span>
        <span class="amount" :class="{ 'negative': netBalance < 0 }">
          {{ formatCurrency(netBalance) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/vue/24/solid'
import currency from 'currency.js'

const props = defineProps<{
  totalIncome: number
  totalExpenses: number
}>()

const netBalance = computed(() => props.totalIncome - props.totalExpenses)

const formatCurrency = (amount: number) => {
  return currency(amount, { symbol: '$' }).format()
}
</script>

<style scoped>
.balance-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.balance-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.balance-item {
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
}

.income {
  background: #ecfdf5;
  color: #065f46;
}

.expenses {
  background: #fef2f2;
  color: #991b1b;
}

.net {
  background: #eff6ff;
  color: #1e40af;
}

.label {
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 1;
}

.amount {
  font-size: 1.5rem;
  font-weight: 600;
  z-index: 1;
}

.amount.negative {
  color: #991b1b;
}

.icon {
  position: absolute;
  right: -0.5rem;
  bottom: -0.5rem;
  width: 3rem;
  height: 3rem;
  opacity: 0.1;
}

@media (max-width: 640px) {
  .balance-grid {
    grid-template-columns: 1fr;
  }
}
</style> 