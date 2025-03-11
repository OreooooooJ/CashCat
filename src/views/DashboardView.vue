<template>
  <div class="dashboard">
    <div class="grid-layout">
      <!-- Accounts Overview -->
      <AccountsOverview :accounts="accounts" class="accounts-overview" />

      <!-- Balance Card -->
      <BalanceCard
        :total-income="totalIncome"
        :total-expenses="totalExpenses"
        class="balance-card"
      />

      <!-- Budget Manager -->
      <BudgetManager class="budget-manager" />

      <!-- Spending Breakdown -->
      <SpendingChart :spending-data="spendingByCategory" class="spending-chart" />

      <!-- Recent Transactions -->
      <RecentTransactions :transactions="recentTransactions" class="recent-transactions" />
    </div>

    <!-- Floating Action Button -->
    <button class="fab" aria-label="Add new transaction" @click="openTransactionForm">
      <PlusIcon class="h-6 w-6" />
    </button>

    <!-- Transaction Form Modal -->
    <TransitionRoot appear :show="isModalOpen" as="template">
      <Dialog as="div" class="modal-wrapper" @close="closeTransactionForm">
        <div class="modal-backdrop" aria-hidden="true" />

        <div class="modal-container">
          <TransitionChild
            as="template"
            enter="modal-enter"
            enter-from="modal-enter-from"
            enter-to="modal-enter-to"
            leave="modal-leave"
            leave-from="modal-leave-from"
            leave-to="modal-leave-to"
          >
            <DialogPanel class="modal-panel">
              <DialogTitle as="h3" class="modal-title"> Add Transaction </DialogTitle>
              <TransactionEntryView @transaction-added="onTransactionAdded" />
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { PlusIcon } from '@heroicons/vue/24/solid'
import AccountsOverview from '../components/dashboard/AccountsOverview.vue'
import BalanceCard from '../components/dashboard/BalanceCard.vue'
import SpendingChart from '../components/dashboard/SpendingChart.vue'
import RecentTransactions from '../components/dashboard/RecentTransactions.vue'
import BudgetManager from '../components/dashboard/BudgetManager.vue'
import TransactionEntryView from './TransactionEntryView.vue'
import { getMockData, categoryColors } from '../services/mockData'
import type { Transaction } from '../types/transaction'
import type { Account } from '../services/mockData'

// State
const isModalOpen = ref(false)
const transactions = ref<Transaction[]>([])
const accounts = ref<Account[]>([])

// Computed values
const totalIncome = computed(() =>
  transactions.value.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
)

const totalExpenses = computed(() =>
  transactions.value.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
)

const spendingByCategory = computed(() => {
  const spending = new Map<string, number>()

  transactions.value
    .filter(t => t.amount < 0)
    .forEach(t => {
      const current = spending.get(t.category) || 0
      spending.set(t.category, current + Math.abs(t.amount))
    })

  return Array.from(spending.entries()).map(([category, amount]) => ({
    category,
    amount,
    color: categoryColors[category as keyof typeof categoryColors] || categoryColors.Other,
  }))
})

const recentTransactions = computed(() =>
  [...transactions.value].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5)
)

// Methods
const openTransactionForm = () => {
  isModalOpen.value = true
}

const closeTransactionForm = () => {
  isModalOpen.value = false
}

const onTransactionAdded = (transaction: Transaction) => {
  transactions.value.push(transaction)
  closeTransactionForm()
}

// Load initial data
onMounted(() => {
  const { accounts: mockAccounts, transactions: mockTransactions } = getMockData()
  accounts.value = mockAccounts
  transactions.value = mockTransactions.map(t => ({
    ...t,
    date: new Date(t.date),
  }))
})
</script>

<style scoped>
.dashboard {
  padding: 1rem;
  position: relative;
  min-height: calc(100vh - 4rem);
  background: #f3f4f6;
}

.grid-layout {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
  max-width: 1200px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .grid-layout {
    grid-template-columns: repeat(2, 1fr);
  }

  .accounts-overview {
    grid-column: 1 / -1;
  }

  .balance-card {
    grid-column: 1 / -1;
  }

  .budget-manager {
    grid-column: 1 / -1;
  }

  .spending-chart {
    grid-column: 1 / 2;
  }

  .recent-transactions {
    grid-column: 2 / 3;
  }
}

.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: #14b8a6;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);
  transition:
    transform 0.2s,
    background-color 0.2s;
}

.fab:hover {
  transform: scale(1.05);
  background: #0d9488;
}

.fab:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.4);
}

/* Modal Styles */
.modal-wrapper {
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow-y: auto;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-container {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  pointer-events: none;
}

.modal-panel {
  width: 100%;
  max-width: 600px;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  position: relative;
  z-index: 51;
  pointer-events: auto;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

/* Modal Transitions */
.modal-enter {
  transition: all 0.3s ease-out;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.modal-enter-to {
  opacity: 1;
  transform: scale(1);
}

.modal-leave {
  transition: all 0.2s ease-in;
}

.modal-leave-from {
  opacity: 1;
  transform: scale(1);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
