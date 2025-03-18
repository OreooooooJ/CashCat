<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSidebarStore } from '@/stores/sidebar'

const sidebarStore = useSidebarStore()

onMounted(() => {
  // Close mobile sidebar when route changes
  window.addEventListener('popstate', () => {
    sidebarStore.closeMobile()
  })
})
</script>

<style>
@import './assets/main.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Global PrimeVue component fixes */
.p-component {
  font-family: inherit;
}

.p-dropdown {
  display: inline-flex;
  min-width: 150px !important;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.p-dropdown .p-dropdown-label {
  padding: 0.5rem 0.75rem;
}

.p-selectbutton {
  display: inline-flex;
}

.p-selectbutton .p-button {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #374151;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
  font-weight: 500;
  padding: 0.5rem 1rem;
  margin: 0;
}

.p-selectbutton .p-button:first-child {
  border-top-left-radius: 0.375rem;
  border-bottom-left-radius: 0.375rem;
}

.p-selectbutton .p-button:last-child {
  border-top-right-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
}

.p-selectbutton .p-button.p-highlight {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
}

.p-button {
  background: #3b82f6;
  border: 1px solid #3b82f6;
  color: #ffffff;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.p-button:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.p-button.p-button-secondary {
  background: #6b7280;
  border-color: #6b7280;
}

.p-button.p-button-secondary:hover {
  background: #4b5563;
  border-color: #4b5563;
}
</style>
