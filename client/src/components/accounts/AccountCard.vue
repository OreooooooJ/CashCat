<template>
  <div 
    class="account-card"
    :style="{ borderLeftColor: account.color }"
  >
    <div class="account-info">
      <div class="primary">
        <span class="name">{{ account.name }}</span>
        <span class="balance" :class="{ negative: account.balance < 0 }">
          {{ formatCurrency(account.balance) }}
        </span>
      </div>
      <div class="secondary">
        <span class="institution">{{ account.institution || 'No Institution' }}</span>
        <span v-if="account.lastFour" class="last-four">•••• {{ account.lastFour }}</span>
        <span v-else class="last-four">No Card</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Account } from '@/types/account';
import currency from 'currency.js';

defineProps<{
  account: Account;
}>();

const formatCurrency = (amount: number) => {
  return currency(amount, { symbol: '$' }).format();
};
</script>

<style scoped>
.account-card {
  background: #f9fafb;
  border-radius: 6px;
  padding: 1rem;
  border-left: 4px solid;
  transition: transform 0.2s;
  cursor: pointer;
}

.account-card:hover {
  transform: translateX(4px);
  background-color: #f3f4f6;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.primary {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name {
  font-weight: 500;
  color: #1f2937;
}

.balance {
  font-weight: 600;
  color: #047857;
}

.balance.negative {
  color: #dc2626;
}

.secondary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #6b7280;
}

.institution {
  font-weight: 500;
}
</style> 