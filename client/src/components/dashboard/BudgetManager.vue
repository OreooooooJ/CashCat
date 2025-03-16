<template>
  <div class="budget-manager">
    <div class="header">
      <div class="header-left">
        <h3>Budget Overview</h3>
        <div class="period-toggle">
          <button
            :class="{ active: selectedPeriod === 'monthly' }"
            class="period-btn"
            @click="selectedPeriod = 'monthly'"
          >
            Monthly
          </button>
          <button
            :class="{ active: selectedPeriod === 'yearly' }"
            class="period-btn"
            @click="selectedPeriod = 'yearly'"
          >
            Yearly
          </button>
        </div>
      </div>
      <button class="add-budget-btn" @click="openBudgetForm">Set Budget</button>
    </div>

    <div class="budget-list">
      <div v-if="!filteredBudgetSummary.length" class="no-budgets">
        No {{ selectedPeriod }} budgets set. Click "Set Budget" to get started.
      </div>
      <div v-for="budget in filteredBudgetSummary" :key="budget.category" class="budget-item">
        <div class="budget-header">
          <div class="category-info">
            <span class="category" :style="{ backgroundColor: getBudgetColor(budget.category) }">
              {{ budget.category }}
            </span>
            <span class="status-badge" :style="{ backgroundColor: getStatusColor(budget.status) }">
              {{ formatStatus(budget.status) }}
            </span>
          </div>
          <div class="amount-info">
            <span class="spent">{{ formatCurrency(budget.spent) }}</span>
            <span class="total">of {{ formatCurrency(budget.budgeted) }}</span>
          </div>
        </div>

        <div class="progress-container">
          <div
            class="progress-bar"
            :style="{
              width: Math.min(budget.percentageUsed, 100) + '%',
              backgroundColor: getStatusColor(budget.status),
            }"
          />
        </div>

        <div class="budget-footer">
          <span class="remaining" :class="{ negative: budget.remaining < 0 }">
            {{ budget.remaining >= 0 ? 'Remaining: ' : 'Over by: ' }}
            {{ formatCurrency(Math.abs(budget.remaining)) }}
          </span>
          <span class="percentage"> {{ budget.percentageUsed?.toFixed(1) || '0.0' }}% </span>
        </div>
      </div>
    </div>

    <!-- Budget Form Modal -->
    <TransitionRoot appear :show="isModalOpen" as="template">
      <Dialog as="div" class="modal-wrapper" @close="closeBudgetForm">
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
              <DialogTitle as="h3" class="modal-title">
                {{ selectedBudget ? 'Edit Budget' : 'Set New Budget' }}
              </DialogTitle>
              <BudgetForm
                :edit-mode="!!selectedBudget"
                :initial-budget="selectedBudget"
                @save="onBudgetSave"
                @close="closeBudgetForm"
              />
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import currency from 'currency.js'
import type { Budget, BudgetSummary } from '../../types/budget'
import { getMockBudgets, getStatusColor, getBudgetColor } from '../../services/mockBudget'
import BudgetForm from './BudgetForm.vue'

const budgetSummary = ref<BudgetSummary[]>([])
const isModalOpen = ref(false)
const selectedBudget = ref<Budget | undefined>(undefined)
const selectedPeriod = ref<'monthly' | 'yearly'>('monthly')

const { budgets: mockBudgets } = getMockBudgets()

const filteredBudgetSummary = computed(() => {
  if (!budgetSummary.value || budgetSummary.value.length === 0) {
    return []
  }
  
  return budgetSummary.value.filter(budget => {
    const originalBudget = mockBudgets.find(b => b.category === budget.category)
    return originalBudget?.period === selectedPeriod.value
  })
})

const formatCurrency = (amount: number) => {
  return currency(amount, { symbol: '$' }).format()
}

const formatStatus = (status: BudgetSummary['status']) => {
  switch (status) {
    case 'under':
      return 'On Track'
    case 'warning':
      return 'Warning'
    case 'critical':
      return 'Critical'
    case 'over':
      return 'Over Budget'
    default:
      return 'Unknown'
  }
}

const openBudgetForm = (event: MouseEvent, budget?: Budget) => {
  selectedBudget.value = budget
  isModalOpen.value = true
}

const closeBudgetForm = () => {
  isModalOpen.value = false
  selectedBudget.value = undefined
}

const onBudgetSave = (budget: Budget) => {
  // TODO: Implement budget saving logic
  console.log('Saving budget:', budget)
  closeBudgetForm()
}

// Helper function to determine budget status
const getStatus = (spent: number, amount: number): 'good' | 'warning' | 'critical' => {
  const percentage = (spent / amount) * 100;
  if (percentage >= 90) return 'critical';
  if (percentage >= 70) return 'warning';
  return 'good';
};

const getBudgetColorByPercentage = (percentSpent: number) => {
  if (percentSpent >= 90) return '#EF4444'; // red for critical
  if (percentSpent >= 70) return '#F59E0B'; // amber for warning
  return '#10B981'; // green for good
};

const getBudgetColorByCategory = (category: string) => {
  // Find the budget by category
  const budget = mockBudgets.find(b => b.category === category);
  if (!budget) return '#6B7280'; // gray default
  
  // Calculate percentage spent
  const percentSpent = (budget.spent / budget.amount) * 100;
  return getBudgetColorByPercentage(percentSpent);
};

onMounted(() => {
  // Create budget summary from mock budgets
  const { budgets } = getMockBudgets();
  budgetSummary.value = budgets.map(budget => ({
    category: budget.category,
    amount: budget.amount,
    spent: budget.spent,
    status: getStatus(budget.spent, budget.amount),
    percentSpent: (budget.spent / budget.amount) * 100
  }));
});
</script>

<style scoped>
.budget-manager {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.add-budget-btn {
  padding: 0.5rem 1rem;
  background: #1a237e;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-budget-btn:hover {
  background: #283593;
}

.budget-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.budget-item {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
}

.budget-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
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

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: white;
}

.amount-info {
  text-align: right;
}

.spent {
  font-weight: 600;
  color: #1f2937;
}

.total {
  color: #6b7280;
  font-size: 0.875rem;
  margin-left: 0.25rem;
}

.progress-container {
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.progress-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.budget-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.remaining {
  color: #047857;
}

.remaining.negative {
  color: #dc2626;
}

.percentage {
  color: #6b7280;
}

.no-budgets {
  text-align: center;
  color: #6b7280;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 0.875rem;
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
}

.modal-container {
  min-height: 100vh;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-panel {
  width: 100%;
  max-width: 600px;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  position: relative;
  z-index: 51;
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

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.period-toggle {
  display: flex;
  gap: 0.25rem;
  background: #f3f4f6;
  padding: 0.25rem;
  border-radius: 6px;
}

.period-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  background: transparent;
  color: #6b7280;
  transition: all 0.2s;
}

.period-btn.active {
  background: white;
  color: #1f2937;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
