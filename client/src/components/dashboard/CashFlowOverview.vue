<template>
  <div class="cash-flow-card">
    <div class="card-header">
      <h3>Cash Flow Overview</h3>
      <div class="time-period-selector">
        <button 
          :class="{ active: timePeriod === 'monthly' }" 
          @click="timePeriod = 'monthly'"
        >
          Monthly
        </button>
        <button 
          :class="{ active: timePeriod === 'yearly' }" 
          @click="timePeriod = 'yearly'"
        >
          Yearly
        </button>
      </div>
    </div>

    <div class="cash-flow-summary">
      <div class="cash-flow-item income">
        <span class="label">Income</span>
        <span class="amount">{{ formatCurrency(totalIncome) }}</span>
        <div class="trend">
          <span class="trend-label">{{ timePeriod === 'monthly' ? 'vs Last Month' : 'vs Last Year' }}</span>
          <span class="trend-value" :class="{ 'positive': incomeTrend > 0, 'negative': incomeTrend < 0 }">
            {{ incomeTrend > 0 ? '+' : '' }}{{ incomeTrend.toFixed(1) }}%
            <ArrowTrendingUpIcon v-if="incomeTrend >= 0" class="trend-icon" />
            <ArrowTrendingDownIcon v-else class="trend-icon" />
          </span>
        </div>
      </div>
      
      <div class="cash-flow-item expenses">
        <span class="label">Expenses</span>
        <span class="amount">{{ formatCurrency(totalExpenses) }}</span>
        <div class="trend">
          <span class="trend-label">{{ timePeriod === 'monthly' ? 'vs Last Month' : 'vs Last Year' }}</span>
          <span class="trend-value" :class="{ 'positive': expensesTrend < 0, 'negative': expensesTrend > 0 }">
            {{ expensesTrend > 0 ? '+' : '' }}{{ expensesTrend.toFixed(1) }}%
            <ArrowTrendingUpIcon v-if="expensesTrend > 0" class="trend-icon" />
            <ArrowTrendingDownIcon v-else class="trend-icon" />
          </span>
        </div>
      </div>
      
      <div class="cash-flow-item net">
        <span class="label">Net Cash Flow</span>
        <span class="amount" :class="{ negative: netCashFlow < 0 }">
          {{ formatCurrency(netCashFlow) }}
        </span>
        <div class="trend">
          <span class="trend-label">{{ timePeriod === 'monthly' ? 'vs Last Month' : 'vs Last Year' }}</span>
          <span class="trend-value" :class="{ 'positive': netCashFlowTrend > 0, 'negative': netCashFlowTrend < 0 }">
            {{ netCashFlowTrend > 0 ? '+' : '' }}{{ netCashFlowTrend.toFixed(1) }}%
            <ArrowTrendingUpIcon v-if="netCashFlowTrend > 0" class="trend-icon" />
            <ArrowTrendingDownIcon v-else class="trend-icon" />
          </span>
        </div>
      </div>
    </div>

    <div class="chart-container">
      <h4>{{ timePeriod === 'monthly' ? '6-Month' : '12-Month' }} Trend</h4>
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/vue/24/solid'
import currency from 'currency.js'
import Chart from 'chart.js/auto'
import type { Transaction } from '@/types/transaction'
import { useTransactionStore } from '@/stores/transaction'

const transactionStore = useTransactionStore()

const chartCanvas = ref<HTMLCanvasElement | null>(null)
const timePeriod = ref<'monthly' | 'yearly'>('monthly')
let chart: Chart | null = null

// Get current date info
const now = new Date()
const currentMonth = now.getMonth()
const currentYear = now.getFullYear()

// Helper function to group transactions by period
const groupTransactionsByPeriod = (transactions: Transaction[], isPreviousPeriod = false) => {
  console.log('Grouping transactions by period:', isPreviousPeriod ? 'previous' : 'current');
  console.log('Total transactions to process:', transactions.length);
  
  const result = {
    income: 0,
    expenses: 0
  }

  // Filter transactions by period
  const filteredTransactions = transactions.filter(transaction => {
    if (!transaction.date) {
      console.log('Transaction missing date:', transaction);
      return false;
    }
    
    const transactionDate = new Date(transaction.date);
    const transactionMonth = transactionDate.getMonth();
    const transactionYear = transactionDate.getFullYear();
    
    let include = false;
    
    if (timePeriod.value === 'monthly') {
      // For monthly view
      if (isPreviousPeriod) {
        // Previous month
        include = (transactionMonth === (currentMonth - 1 + 12) % 12) && 
               (transactionMonth === 11 && currentMonth === 0 ? transactionYear === currentYear - 1 : transactionYear === currentYear);
      } else {
        // Current month
        include = transactionMonth === currentMonth && transactionYear === currentYear;
      }
    } else {
      // For yearly view
      if (isPreviousPeriod) {
        // Previous year
        include = transactionYear === currentYear - 1;
      } else {
        // Current year
        include = transactionYear === currentYear;
      }
    }
    
    if (include) {
      console.log(`Including transaction: ${transaction.description}, date: ${transactionDate.toISOString()}, type: ${transaction.type}, amount: ${transaction.amount}`);
    }
    
    return include;
  });
  
  console.log(`Found ${filteredTransactions.length} transactions for ${isPreviousPeriod ? 'previous' : 'current'} period`);
  
  // Log all filtered transactions for debugging
  filteredTransactions.forEach((t, index) => {
    console.log(`Transaction ${index + 1}: ${t.description}, type: ${t.type}, amount: ${t.amount}`);
  });
  
  filteredTransactions.forEach(transaction => {
    // Use transaction type to determine income or expense
    const type = transaction.type ? transaction.type.toLowerCase() : '';
    if (type === 'income') {
      result.income += Math.abs(transaction.amount);
      console.log(`Added to income: ${transaction.description}, amount: ${Math.abs(transaction.amount)}`);
    } else if (type === 'expense') {
      result.expenses += Math.abs(transaction.amount);
      console.log(`Added to expenses: ${transaction.description}, amount: ${Math.abs(transaction.amount)}`);
    } else {
      console.log('Unknown transaction type:', type, 'for transaction:', transaction.description);
    }
  });
  
  console.log(`Period totals - Income: ${result.income}, Expenses: ${result.expenses}`);
  return result;
}

// Calculate current period totals
const currentPeriodData = computed(() => {
  console.log('Calculating current period data with', transactionStore.transactions.length, 'transactions');
  const result = groupTransactionsByPeriod(transactionStore.transactions);
  console.log('Current period data:', result);
  return result;
})

// Calculate previous period totals
const previousPeriodData = computed(() => {
  console.log('Calculating previous period data with', transactionStore.transactions.length, 'transactions');
  const result = groupTransactionsByPeriod(transactionStore.transactions, true);
  console.log('Previous period data:', result);
  return result;
})

// Current period values
const totalIncome = computed(() => {
  console.log('Total income computed:', currentPeriodData.value.income);
  return currentPeriodData.value.income;
})
const totalExpenses = computed(() => {
  console.log('Total expenses computed:', currentPeriodData.value.expenses);
  return currentPeriodData.value.expenses;
})
const netCashFlow = computed(() => {
  console.log('Net cash flow computed:', totalIncome.value - totalExpenses.value);
  return totalIncome.value - totalExpenses.value;
})

// Calculate trends (percentage change from previous period)
const calculateTrend = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

const incomeTrend = computed(() => 
  calculateTrend(currentPeriodData.value.income, previousPeriodData.value.income)
)

const expensesTrend = computed(() => 
  calculateTrend(currentPeriodData.value.expenses, previousPeriodData.value.expenses)
)

const netCashFlowTrend = computed(() => {
  const currentNet = currentPeriodData.value.income - currentPeriodData.value.expenses
  const previousNet = previousPeriodData.value.income - previousPeriodData.value.expenses
  
  // Handle special case where previous net is zero or both are negative
  if (previousNet === 0) return currentNet > 0 ? 100 : (currentNet < 0 ? -100 : 0)
  if (previousNet < 0 && currentNet < 0) {
    // If both are negative, less negative is better
    return ((Math.abs(previousNet) - Math.abs(currentNet)) / Math.abs(previousNet)) * 100
  }
  
  return calculateTrend(currentNet, previousNet)
})

// Format currency
const formatCurrency = (amount: number) => {
  return currency(amount, { symbol: '$' }).format()
}

// Generate historical data for chart
const getHistoricalData = () => {
  const labels = []
  const incomeData = []
  const expenseData = []
  const netData = []
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  if (timePeriod.value === 'monthly') {
    // Get 6 months of data
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear
      
      labels.push(months[monthIndex])
      
      // Filter transactions for this month
      const monthlyData = transactionStore.transactions.reduce((acc, transaction) => {
        const transactionDate = new Date(transaction.date)
        if (transactionDate.getMonth() === monthIndex && transactionDate.getFullYear() === year) {
          const type = transaction.type ? transaction.type.toLowerCase() : '';
          if (type === 'income') {
            acc.income += Math.abs(transaction.amount)
          } else if (type === 'expense') {
            acc.expenses += Math.abs(transaction.amount)
          }
        }
        return acc
      }, { income: 0, expenses: 0 })
      
      incomeData.push(monthlyData.income)
      expenseData.push(monthlyData.expenses)
      netData.push(monthlyData.income - monthlyData.expenses)
    }
  } else {
    // Get 12 months of data for yearly view
    for (let i = 0; i < 12; i++) {
      labels.push(months[i])
      
      // Filter transactions for this month in current year
      const monthlyData = transactionStore.transactions.reduce((acc, transaction) => {
        const transactionDate = new Date(transaction.date)
        if (transactionDate.getMonth() === i && transactionDate.getFullYear() === currentYear) {
          const type = transaction.type ? transaction.type.toLowerCase() : '';
          if (type === 'income') {
            acc.income += Math.abs(transaction.amount)
          } else if (type === 'expense') {
            acc.expenses += Math.abs(transaction.amount)
          }
        }
        return acc
      }, { income: 0, expenses: 0 })
      
      incomeData.push(monthlyData.income)
      expenseData.push(monthlyData.expenses)
      netData.push(monthlyData.income - monthlyData.expenses)
    }
  }
  
  return { labels, incomeData, expenseData, netData }
}

// Initialize and update chart
const initChart = () => {
  if (!chartCanvas.value) return
  
  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return
  
  const { labels, incomeData, expenseData, netData } = getHistoricalData()
  
  if (chart) {
    chart.destroy()
  }
  
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: false
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: false
        },
        {
          label: 'Net Cash Flow',
          data: netData,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += currency(context.parsed.y, { symbol: '$' }).format();
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return currency(value as number, { symbol: '$' }).format();
            }
          }
        }
      }
    }
  })
}

// Update chart when time period changes
watch(timePeriod, () => {
  initChart()
})

// Initialize chart on mount
onMounted(() => {
  initChart()
  
  // Fetch transactions if they haven't been loaded yet
  if (transactionStore.transactions.length === 0) {
    console.log('No transactions found, fetching from API...');
    transactionStore.fetchTransactions();
  } else {
    console.log('Transactions already loaded:', transactionStore.transactions.length);
  }
})
</script>

<style scoped>
.cash-flow-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
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

h4 {
  font-size: 1rem;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 0.75rem;
}

.time-period-selector {
  display: flex;
  background: #f3f4f6;
  border-radius: 6px;
  overflow: hidden;
}

.time-period-selector button {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s ease;
}

.time-period-selector button.active {
  background: #3b82f6;
  color: white;
}

.cash-flow-summary {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  margin-bottom: 1.5rem;
}

.cash-flow-item {
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

.trend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
}

.trend-label {
  color: #6b7280;
}

.trend-value {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.trend-value.positive {
  color: #059669;
}

.trend-value.negative {
  color: #dc2626;
}

.trend-icon {
  width: 0.875rem;
  height: 0.875rem;
  margin-left: 0.25rem;
}

.chart-container {
  height: 250px;
  margin-top: 1.5rem;
}

@media (max-width: 640px) {
  .cash-flow-summary {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .chart-container {
    height: 200px;
  }
}
</style> 