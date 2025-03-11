<template>
  <div class="accounts-overview">
    <div class="header">
      <h3>Accounts</h3>
      <div class="total-balance">
        <span class="label">Net Worth</span>
        <span class="amount" :class="{ 'negative': totalBalance < 0 }">
          {{ formatCurrency(totalBalance) }}
        </span>
      </div>
    </div>

    <div class="accounts-grid">
      <!-- Debit Accounts -->
      <div class="account-group">
        <h4>Cash & Debit</h4>
        <div class="account-list">
          <div
            v-for="account in debitAccounts"
            :key="account.id"
            class="account-card"
            :style="{ borderLeftColor: account.color }"
          >
            <div class="account-info">
              <div class="primary">
                <span class="name">{{ account.name }}</span>
                <span class="balance">{{ formatCurrency(account.balance) }}</span>
              </div>
              <div class="secondary">
                <span class="institution">{{ account.institution }}</span>
                <span class="last-four">•••• {{ account.lastFour }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Credit Accounts -->
      <div class="account-group">
        <h4>Credit Cards</h4>
        <div class="account-list">
          <div
            v-for="account in creditAccounts"
            :key="account.id"
            class="account-card"
            :style="{ borderLeftColor: account.color }"
          >
            <div class="account-info">
              <div class="primary">
                <span class="name">{{ account.name }}</span>
                <span class="balance negative">{{ formatCurrency(account.balance) }}</span>
              </div>
              <div class="secondary">
                <span class="institution">{{ account.institution }}</span>
                <span class="last-four">•••• {{ account.lastFour }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import currency from 'currency.js'
import type { Account } from '../../services/mockData'

const props = defineProps<{
  accounts: Account[]
}>()

const debitAccounts = computed(() => 
  props.accounts.filter(account => account.type === 'debit')
)

const creditAccounts = computed(() => 
  props.accounts.filter(account => account.type === 'credit')
)

const totalBalance = computed(() => 
  props.accounts.reduce((sum, account) => sum + account.balance, 0)
)

const formatCurrency = (amount: number) => {
  return currency(amount, { symbol: '$' }).format()
}
</script>

<style scoped>
.accounts-overview {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.total-balance {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.total-balance .label {
  font-size: 0.875rem;
  color: #6b7280;
}

.total-balance .amount {
  font-size: 1.5rem;
  font-weight: 600;
  color: #047857;
}

.total-balance .amount.negative {
  color: #dc2626;
}

.accounts-grid {
  display: grid;
  gap: 2rem;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.account-group h4 {
  font-size: 1rem;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 1rem;
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.account-card {
  background: #f9fafb;
  border-radius: 6px;
  padding: 1rem;
  border-left: 4px solid;
  transition: transform 0.2s;
}

.account-card:hover {
  transform: translateX(4px);
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

@media (max-width: 640px) {
  .accounts-grid {
    grid-template-columns: 1fr;
  }
}
</style> 