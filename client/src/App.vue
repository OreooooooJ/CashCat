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
</style>
