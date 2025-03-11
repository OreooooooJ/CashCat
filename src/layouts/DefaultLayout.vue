<template>
  <div class="flex min-h-screen bg-gray-50 dark:bg-gray-900">
    <AppSidebar class="fixed inset-y-0 left-0" />
    
    <div class="flex-1 flex flex-col ml-64">
      <main class="flex-1 overflow-y-auto p-4">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from '@/components/layout/AppSidebar/index.vue'
</script> 