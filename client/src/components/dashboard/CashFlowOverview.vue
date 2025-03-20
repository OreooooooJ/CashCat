<template>
  <div class="cash-flow-component">
    <div class="card-header">
      <h3>Cash Flow Overview</h3>
      <div class="time-period-selector">
        <div class="buttons-wrapper">
          <button 
            class="time-btn" 
            :class="{ active: timePeriod === 'monthly' }"
            @click="timePeriod = 'monthly'"
          >
            Monthly
          </button>
          <button 
            class="time-btn" 
            :class="{ active: timePeriod === 'yearly' }"
            @click="timePeriod = 'yearly'"
          >
            Yearly
          </button>
        </div>
      </div>
    </div>

    <div class="cash-flow-summary">
      <div class="cash-flow-card income">
        <span class="label">Income</span>
        <span class="amount">{{ formatCurrency(totalIncome) }}</span>
        <div class="trend-indicator">
          <span class="trend-label">{{ timePeriod === 'monthly' ? 'vs Last Month' : 'vs Last Year' }}</span>
          <span class="trend-value" :class="{ 'positive': incomeTrend >= 0, 'negative': incomeTrend < 0 }">
            {{ incomeTrend > 0 ? '+' : '' }}{{ incomeTrend.toFixed(1) }}%
            <i v-if="incomeTrend >= 0" class="pi pi-arrow-up trend-icon"></i>
            <i v-else class="pi pi-arrow-down trend-icon"></i>
          </span>
        </div>
      </div>
      
      <div class="cash-flow-card expenses">
        <span class="label">Expenses</span>
        <span class="amount">{{ formatCurrency(totalExpenses) }}</span>
        <div class="trend-indicator">
          <span class="trend-label">{{ timePeriod === 'monthly' ? 'vs Last Month' : 'vs Last Year' }}</span>
          <span class="trend-value" :class="{ 'positive': expensesTrend < 0, 'negative': expensesTrend >= 0 }">
            {{ expensesTrend > 0 ? '+' : '' }}{{ expensesTrend.toFixed(1) }}%
            <i v-if="expensesTrend < 0" class="pi pi-arrow-up trend-icon"></i>
            <i v-else class="pi pi-arrow-down trend-icon"></i>
          </span>
        </div>
      </div>
      
      <div class="cash-flow-card net">
        <span class="label">Net Cash Flow</span>
        <span class="amount" :class="{ negative: netCashFlow < 0 }">{{ formatCurrency(netCashFlow) }}</span>
        <div class="trend-indicator">
          <span class="trend-label">{{ timePeriod === 'monthly' ? 'vs Last Month' : 'vs Last Year' }}</span>
          <span class="trend-value" :class="{ 'positive': netCashFlowTrend >= 0, 'negative': netCashFlowTrend < 0 }">
            {{ netCashFlowTrend > 0 ? '+' : '' }}{{ netCashFlowTrend.toFixed(1) }}%
            <i v-if="netCashFlowTrend >= 0" class="pi pi-arrow-up trend-icon"></i>
            <i v-else class="pi pi-arrow-down trend-icon"></i>
          </span>
        </div>
      </div>
    </div>

    <div class="chart-container">
      <div class="chart-header">
        <h4>{{ timePeriod === 'monthly' ? '6-Month' : '12-Month' }} Trend</h4>
        <select v-model="chartType" class="chart-type-select">
          <option value="line">Line Chart</option>
          <option value="bar">Bar Chart</option>
        </select>
      </div>
      <div v-if="isChartLoading" class="chart-loading">
        <div class="loading-spinner"></div>
        <span>Loading chart...</span>
      </div>
      <div v-else-if="chartError" class="chart-error">
        <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: #EF4444;"></i>
        <p>{{ chartError }}</p>
        <button class="retry-btn" @click="initChart">Retry</button>
      </div>
      <canvas ref="chartCanvas" aria-label="Cash flow chart" role="img"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import currency from 'currency.js'
import Chart from 'chart.js/auto'
import type { Transaction } from '@/types/transaction'
import { useTransactionStore } from '@/stores/transaction'
import CashFlowCard from '@/components/ui/CashFlowCard.vue'
import TrendIndicator from '@/components/ui/TrendIndicator.vue'
import SelectButton from 'primevue/selectbutton'
import Dropdown from 'primevue/dropdown'

const transactionStore = useTransactionStore()

const chartCanvas = ref<HTMLCanvasElement | null>(null)
const timePeriod = ref<'monthly' | 'yearly'>('monthly')
const chartType = ref<'line' | 'bar'>('line')
const isChartLoading = ref<boolean>(false)
const chartError = ref<string | null>(null)
let chart: Chart | null = null

// Options for SelectButton and Dropdown
const periodOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' }
]

const chartOptions = [
  { label: 'Line Chart', value: 'line' },
  { label: 'Bar Chart', value: 'bar' }
]

// Helper function to group transactions by period
const groupTransactionsByPeriod = (transactions: Transaction[], isPreviousPeriod = false) => {
  const result = {
    income: 0,
    expenses: 0
  }

  if (transactions.length === 0) {
    return result;
  }

  // Get the current date from the system
  const now = new Date();
  const targetYear = now.getFullYear();
  const targetMonth = now.getMonth(); // 0-indexed
  
  // Filter transactions by period
  const filteredTransactions = transactions.filter(transaction => {
    if (!transaction.date) {
      return false;
    }
    
    // Ensure transaction.date is a Date object
    let transactionDate: Date;
    if (transaction.date instanceof Date) {
      transactionDate = transaction.date;
    } else {
      // Handle the case where date might be a string or other format
      transactionDate = new Date(transaction.date);
    }
    
    const transactionMonth = transactionDate.getMonth();
    const transactionYear = transactionDate.getFullYear();
    
    let include = false;
    
    if (timePeriod.value === 'monthly') {
      if (isPreviousPeriod) {
        // Previous month (calculate from current date)
        const prevMonth = targetMonth === 0 ? 11 : targetMonth - 1;
        const prevYear = targetMonth === 0 ? targetYear - 1 : targetYear;
        include = transactionMonth === prevMonth && transactionYear === prevYear;
      } else {
        // Current month
        include = transactionMonth === targetMonth && transactionYear === targetYear;
      }
    } else {
      // For yearly view
      if (isPreviousPeriod) {
        // Previous year
        include = transactionYear === targetYear - 1;
      } else {
        // Current year
        include = transactionYear === targetYear;
      }
    }
    
    return include;
  });
  
  // Process the filtered transactions
  filteredTransactions.forEach(transaction => {
    // Use transaction type to determine income or expense
    const type = transaction.type?.toLowerCase();
    if (type === 'income') {
      result.income += Math.abs(transaction.amount);
    } else if (type === 'expense') {
      result.expenses += Math.abs(transaction.amount);
    }
  });
  
  return result;
}

// Calculate current period totals
const currentPeriodData = computed(() => {
  return groupTransactionsByPeriod(transactionStore.transactions, false);
})

// Calculate previous period totals
const previousPeriodData = computed(() => {
  return groupTransactionsByPeriod(transactionStore.transactions, true);
})

// Current period values
const totalIncome = computed(() => {
  return currentPeriodData.value.income;
})

const totalExpenses = computed(() => {
  return currentPeriodData.value.expenses;
})

const netCashFlow = computed(() => {
  return totalIncome.value - totalExpenses.value;
})

// Calculate trends (percentage change from previous period)
const calculateTrend = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

const incomeTrend = computed(() => {
  return calculateTrend(currentPeriodData.value.income, previousPeriodData.value.income);
})

const expensesTrend = computed(() => {
  return calculateTrend(currentPeriodData.value.expenses, previousPeriodData.value.expenses);
})

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

// Format transaction details for chart tooltip
const formatTransactions = (transactions: Transaction[]) => {
  // Sort transactions by amount (largest first)
  const sortedTransactions = [...transactions].sort((a, b) => b.amount - a.amount);
  
  // Show at most 3 transactions
  return sortedTransactions.slice(0, 3).map(t => {
    return `${t.description || 'Transaction'}: ${currency(t.amount, { symbol: '$' }).format()}`;
  }).join('\n');
};

// Get historical data for chart based on time period
const getHistoricalData = () => {
  // Fixed data for demo purposes
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const now = new Date();
  const currentYear = now.getFullYear(); // Use system year (2025)
  const currentMonth = now.getMonth(); // Use system month (2 for March, 0-indexed)
  
  const labels: string[] = [];
  const incomeData: number[] = [];
  const expenseData: number[] = [];
  const netData: number[] = [];
  const transactionsByPeriod: Record<string, Transaction[]> = {};
  
  if (timePeriod.value === 'monthly') {
    // For monthly view, show last 6 months, but only up to current month
    // This ensures we don't show future months with no data
    const monthsToShow = Math.min(6, currentMonth + 1);
    
    // Changed: Now processing months in chronological order (oldest to newest)
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const m = currentMonth - i;
      const year = currentYear - (m < 0 ? 1 : 0);
      const month = (m + 12) % 12;
      
      // Only include months up to the current month
      const label = `${months[month]}${year !== currentYear ? ' ' + year : ''}`;
      
      // Using push to maintain chronological order
      labels.push(label);
      
      // Filter transactions for this month/year
      const filteredTransactions = transactionStore.transactions.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === year && date.getMonth() === month;
      });
      
      // Process transactions
      let income = 0;
      let expense = 0;
      
      filteredTransactions.forEach(t => {
        const type = t.type?.toLowerCase();
        if (type === 'income') {
          income += t.amount;
        } else if (type === 'expense') {
          expense += t.amount;
        }
      });
      
      // Using push to maintain chronological order
      incomeData.push(parseFloat(income.toFixed(2)));
      expenseData.push(parseFloat(expense.toFixed(2)));
      netData.push(parseFloat((income - expense).toFixed(2)));
      transactionsByPeriod[label] = filteredTransactions;
    }
  } else {
    // For yearly view, show quarterly data instead of monthly
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const currentQuarter = Math.floor(currentMonth / 3);
    
    // Show data for current year by quarters
    for (let q = 0; q <= currentQuarter; q++) {
      const quarterLabel = `${quarters[q]} ${currentYear}`;
      labels.push(quarterLabel);
      
      const startMonth = q * 3;
      const endMonth = Math.min((q + 1) * 3 - 1, currentMonth);
      
      // Filter transactions for this quarter
      const filteredTransactions = transactionStore.transactions.filter(t => {
        const date = new Date(t.date);
        const month = date.getMonth();
        return date.getFullYear() === currentYear && 
               month >= startMonth && 
               month <= endMonth;
      });
      
      // Process transactions
      let income = 0;
      let expense = 0;
      
      filteredTransactions.forEach(t => {
        const type = t.type?.toLowerCase();
        if (type === 'income') {
          income += t.amount;
        } else if (type === 'expense') {
          expense += t.amount;
        }
      });
      
      incomeData.push(parseFloat(income.toFixed(2)));
      expenseData.push(parseFloat(expense.toFixed(2)));
      netData.push(parseFloat((income - expense).toFixed(2)));
      transactionsByPeriod[quarterLabel] = filteredTransactions;
    }
  }
  
  return { labels, incomeData, expenseData, netData, transactionsByPeriod };
}

// Initialize and update chart
const initChart = async () => {
  try {
    isChartLoading.value = true;
    chartError.value = null;
    
    if (!chartCanvas.value) {
      chartError.value = 'Chart canvas not found';
      isChartLoading.value = false;
      return;
    }
    
    const ctx = chartCanvas.value.getContext('2d');
    if (!ctx) {
      chartError.value = 'Cannot initialize chart context';
      isChartLoading.value = false;
      return;
    }
    
    // Clear previous chart
    if (chart) {
      chart.destroy();
    }
    
    // Simulate loading for demo purposes (remove in production)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Use placeholder data if no transactions available
    if (transactionStore.transactions.length === 0) {
      // Create placeholder chart with dummy data
      chart = new Chart(ctx, {
        type: chartType.value,
        data: {
          labels: ['No Data'],
          datasets: [{
            label: 'No data available',
            data: [1],
            backgroundColor: ['#e0e0e0'],
            borderColor: ['#cccccc'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'No data available'
            }
          }
        }
      });
      
      isChartLoading.value = false;
      return;
    }
    
    // Regular chart types (line, bar)
    const { labels, incomeData, expenseData, netData, transactionsByPeriod } = getHistoricalData();
    
    const chartData = {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          tension: 0.4,
          fill: false
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          tension: 0.4,
          fill: false
        },
        {
          label: 'Net Cash Flow',
          data: netData,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          tension: 0.4,
          fill: false
        }
      ]
    };
    
    // Create chart with proper TypeScript typing
    chart = new Chart(ctx, {
      type: chartType.value,
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index' as const,
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top' as const,
            labels: {
              usePointStyle: true,
              boxWidth: 10,
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: 'rgba(33, 37, 41, 0.95)',
            padding: 12,
            bodySpacing: 6,
            callbacks: {
              label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += currency(context.parsed.y, { symbol: '$' }).format();
                }
                return label;
              },
              afterBody: function(context: any) {
                if (context.length === 0) return [];
                
                // Get the period label from the first context item
                const periodLabel = context[0].label;
                
                // Get transactions for this period
                const transactions = transactionsByPeriod[periodLabel] || [];
                
                // Return top transaction details
                if (transactions.length > 0) {
                  return [
                    '',
                    'Top Transactions:',
                    formatTransactions(transactions)
                  ];
                }
                return [];
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              callback: function(value: any) {
                return currency(value as number, { symbol: '$' }).format();
              },
              padding: 8
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              padding: 8
            }
          }
        }
      }
    });
    
    // Apply annotations after chart is created if we're in monthly view
    if (timePeriod.value === 'monthly' && chart) {
      try {
        // Add visual indicator for current month
        const currentMonthIndex = labels.length - 1;
        if (currentMonthIndex >= 0) {
          // This would typically use the annotation plugin, but we'll skip it for now
          // to avoid TypeScript errors while still highlighting the current month
          const meta = chart.getDatasetMeta(2); // Net cash flow dataset
          if (meta && meta.data && meta.data[currentMonthIndex]) {
            meta.data[currentMonthIndex].options = {
              ...meta.data[currentMonthIndex].options,
              radius: 6,
              borderWidth: 3
            };
          }
        }
      } catch (error) {
        console.warn('Failed to add current month indicator', error);
      }
    }
    
    isChartLoading.value = false;
  } catch (error) {
    chartError.value = 'Failed to load chart data. Please try again.';
    isChartLoading.value = false;
  }
}

// Update chart when time period or chart type changes
watch([timePeriod, chartType], () => {
  initChart();
})

// Initialize chart on mount
onMounted(() => {
  initChart();
  
  // Fetch transactions if they haven't been loaded yet
  if (transactionStore.transactions.length === 0) {
    transactionStore.fetchTransactions().then(() => {
      initChart();
    }).catch(error => {
      chartError.value = 'Error loading transactions';
    });
  }
})

// Helper method to format trend percentages 
const formatTrendPercentage = (value: number) => {
  if (value === Infinity || isNaN(value)) return '';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${Math.abs(value).toFixed(1)}%`;
};

// Helper method to get CSS class for trend indicators
const getStyleForTrend = (value: number) => {
  if (value === Infinity || isNaN(value) || Math.abs(value) < 0.1) return 'text-gray-500';
  return value > 0 ? 'text-green-500' : 'text-red-500';
};
</script>

<style scoped>
/* Changed class name from .cash-flow-card to .cash-flow-component */
.cash-flow-component {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: 100%;
  height: 100%;
  display: block;
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
  margin-top: 0;
}

.time-period-selector {
  display: flex;
}

/* Custom buttons for time period selection */
.buttons-wrapper {
  display: flex;
  border-radius: 0.375rem;
  overflow: hidden;
}

.time-btn {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #374151;
  font-weight: 500;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.time-btn:first-child {
  border-right: none;
  border-radius: 0.375rem 0 0 0.375rem;
}

.time-btn:last-child {
  border-left: none;
  border-radius: 0 0.375rem 0.375rem 0;
}

.time-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
}

/* Custom select styling */
.chart-type-select {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #374151;
  min-width: 150px;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.5em 1.5em;
  padding-right: 2rem;
}

/* Custom retry button */
.retry-btn {
  background: #6b7280;
  border: 1px solid #6b7280;
  color: #ffffff;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #4b5563;
}

/* Custom loading spinner */
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.cash-flow-summary {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  margin-bottom: 1.5rem;
}

.chart-container {
  height: 250px;
  margin-top: 1.5rem;
  position: relative;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-loading, .chart-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
}

.chart-error {
  color: #EF4444;
  text-align: center;
  gap: 0.5rem;
}

.chart-notes {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
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

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

/* Add styles for inline cash flow cards */
.cash-flow-card {
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cash-flow-card.income {
  background: #ecfdf5;
  color: #065f46;
}

.cash-flow-card.expenses {
  background: #fef2f2;
  color: #991b1b;
}

.cash-flow-card.net {
  background: #eff6ff;
  color: #1e40af;
}

.cash-flow-card .label {
  font-size: 0.875rem;
  font-weight: 500;
}

.cash-flow-card .amount {
  font-size: 1.5rem;
  font-weight: 600;
}

.cash-flow-card .amount.negative {
  color: #991b1b;
}

.trend-indicator {
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
  margin-left: 0.25rem;
  font-size: 0.875rem;
}
</style> 