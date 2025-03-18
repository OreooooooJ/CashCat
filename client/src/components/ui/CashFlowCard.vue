<template>
  <div class="cash-flow-card" :class="type">
    <span class="label">{{ label }}</span>
    <span class="amount" :class="{ negative: isNegative }">{{ formattedAmount }}</span>
    <TrendIndicator 
      :value="trendValue" 
      :label="trendLabel"
      :inverse-color="type === 'expenses'"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import currency from 'currency.js';
import TrendIndicator from './TrendIndicator.vue';

interface Props {
  label: string;
  amount: number;
  trendValue: number;
  trendLabel?: string;
  type: 'income' | 'expenses' | 'net';
}

const props = withDefaults(defineProps<Props>(), {
  trendLabel: 'vs Last Period'
});

const formattedAmount = computed(() => {
  return currency(props.amount, { symbol: '$' }).format();
});

const isNegative = computed(() => {
  return props.amount < 0;
});
</script>

<style scoped>
.cash-flow-card {
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
}

.amount {
  font-size: 1.5rem;
  font-weight: 600;
}

.amount.negative {
  color: #991b1b;
}
</style> 