<template>
  <div class="dashboard">
    <!-- Current Date Display -->
    <div class="current-date-display">
      <p>Current Date: {{ formattedCurrentDate }}</p>
    </div>
    
    <div class="grid-layout">
      <AccountsOverview
        class="accounts-overview"
        :accounts="accounts"
      />
      
      <CashFlowOverview
        class="cash-flow-overview"
      />
      
      <BudgetManager class="budget-manager" />
      
      <SpendingChart
        class="spending-chart"
        :spending-data="spendingByCategory"
      />
      
      <RecentTransactions
        class="recent-transactions"
        :transactions="recentTransactions"
      />
    </div>

    <!-- Add Transaction FAB -->
    <button class="fab" @click="openTransactionForm">
      <PlusIcon class="w-6 h-6" />
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
              <DialogTitle as="h3" class="modal-title">Add Transaction</DialogTitle>
              <TransactionEntryForm @save="onTransactionAdded" @close="closeTransactionForm" />
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { PlusIcon } from '@heroicons/vue/24/solid'
import AccountsOverview from '../components/dashboard/AccountsOverview.vue'
import CashFlowOverview from '../components/dashboard/CashFlowOverview.vue'
import SpendingChart from '../components/dashboard/SpendingChart.vue'
import RecentTransactions from '../components/dashboard/RecentTransactions.vue'
import BudgetManager from '../components/dashboard/BudgetManager.vue'
import TransactionEntryForm from '../components/TransactionEntryForm.vue'
import { categoryColors } from '../services/mockData'
import type { Transaction } from '../types/transaction'
import type { Account } from '../types/account'
import { useTransactionStore } from '../stores/transaction'
import { useAccountStore } from '../stores/account'

// State
const isModalOpen = ref(false)
const transactionStore = useTransactionStore()
const accountStore = useAccountStore()
const accounts = computed(() => accountStore.accounts)
const currentDate = ref(new Date())

// Format the current date for display
const formattedCurrentDate = computed(() => {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  }
  return currentDate.value.toLocaleDateString('en-US', options)
})

// Update the current date every minute
const updateCurrentDate = () => {
  currentDate.value = new Date()
}

// Set up the timer when component is mounted
onMounted(() => {
  // Update immediately
  updateCurrentDate()
  
  // Then update every minute
  const intervalId = setInterval(updateCurrentDate, 60000)
  
  // Clear interval on component unmount
  onUnmounted(() => {
    clearInterval(intervalId)
  })
})

// Computed values
const totalIncome = computed(() => transactionStore.calculateTotalIncome())
const totalExpenses = computed(() => transactionStore.calculateTotalExpenses())

const spendingByCategory = computed(() => {
  return transactionStore.getSpendingByCategory().map(({ category, amount }) => ({
    category,
    amount,
    color: categoryColors[category as keyof typeof categoryColors] || categoryColors.Other,
  }))
})

const recentTransactions = computed(() => transactionStore.getRecentTransactions(5))

// Methods
const openTransactionForm = () => {
  isModalOpen.value = true
}

const closeTransactionForm = () => {
  isModalOpen.value = false
}

const onTransactionAdded = async (transaction: Transaction) => {
  try {
    await transactionStore.addTransaction(transaction)
    closeTransactionForm()
  } catch (error) {
    console.error('Failed to add transaction:', error)
    // You could add error handling UI here
  }
}

// Load initial data
onMounted(async () => {
  // Fetch real account data from API
  await accountStore.fetchAccounts()
  
  // Fetch real transaction data from API
  await transactionStore.fetchTransactions()
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

/* Make sure grid items have explicit styles */
.accounts-overview,
.cash-flow-overview,
.budget-manager,
.spending-chart,
.recent-transactions {
  width: 100%;
  min-height: 100px;
  display: block;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .grid-layout {
    grid-template-columns: repeat(2, 1fr);
    grid-template-areas:
      "accounts accounts"
      "cash-flow cash-flow"
      "budget budget"
      "spending recent";
  }

  .accounts-overview {
    grid-area: accounts;
  }

  .cash-flow-overview {
    grid-area: cash-flow;
    min-height: 350px; /* Ensure enough height for the chart */
  }

  .budget-manager {
    grid-area: budget;
  }

  .spending-chart {
    grid-area: spending;
  }

  .recent-transactions {
    grid-area: recent;
  }
}

@media (min-width: 1024px) {
  .grid-layout {
    grid-template-columns: repeat(3, 1fr);
    grid-template-areas:
      "accounts accounts accounts"
      "cash-flow cash-flow cash-flow"
      "budget budget recent"
      "spending spending recent";
  }
}

.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background-color: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
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

.current-date-display {
  background: white;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  text-align: right;
}

.current-date-display p {
  margin: 0;
  font-size: 0.95rem;
  color: #4b5563;
  font-weight: 500;
}
</style>
