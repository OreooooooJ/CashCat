<template>
  <div class="trend-indicator">
    <span class="trend-label">{{ label }}</span>
    <span class="trend-value" :class="{ 'positive': isPositive, 'negative': !isPositive }">
      {{ formattedValue }}
      <i v-if="isPositive" class="pi pi-arrow-up trend-icon"></i>
      <i v-else class="pi pi-arrow-down trend-icon"></i>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  value: number;
  label?: string;
  inverseColor?: boolean; // If true, negative values are green (good), positive values are red (bad)
  decimals?: number;
}

const props = withDefaults(defineProps<Props>(), {
  label: 'vs Last Period',
  inverseColor: false,
  decimals: 1
});

const isPositive = computed(() => {
  if (props.inverseColor) {
    return props.value < 0;
  }
  return props.value >= 0;
});

const formattedValue = computed(() => {
  return `${props.value > 0 ? '+' : ''}${props.value.toFixed(props.decimals)}%`;
});
</script>

<style scoped>
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