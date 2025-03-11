<template>
  <div class="spending-chart">
    <h3>Spending Breakdown</h3>
    <div class="chart-container">
      <Doughnut
        v-if="chartData.datasets[0].data.length > 0"
        :data="chartData"
        :options="chartOptions"
      />
      <div v-else class="no-data">
        No spending data available
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
} from 'chart.js'
import currency from 'currency.js'

// Register ChartJS components
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

// Props
interface SpendingData {
  category: string
  amount: number
}

const props = defineProps<{
  spendingData: SpendingData[]
}>()

// Chart colors
const chartColors = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FFC107', // Yellow
  '#9C27B0', // Purple
  '#F44336', // Red
  '#FF9800', // Orange
  '#795548', // Brown
  '#607D8B', // Blue Grey
]

// Computed chart data
const chartData = computed(() => ({
  labels: props.spendingData.map(item => item.category),
  datasets: [{
    data: props.spendingData.map(item => item.amount),
    backgroundColor: chartColors.slice(0, props.spendingData.length),
    borderWidth: 0,
  }]
}))

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
      },
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const value = context.raw || 0
          return `${context.label}: ${currency(value, { symbol: '$' }).format()}`
        },
      },
    },
  },
}
</script>

<style scoped>
.spending-chart {
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

.chart-container {
  height: 300px;
  position: relative;
}

.no-data {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #6b7280;
  font-size: 0.875rem;
}
</style> 