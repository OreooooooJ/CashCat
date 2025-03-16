<template>
  <div class="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <AppSidebar class="fixed inset-y-0 left-0" />
    
    <div
      class="flex-1 flex flex-col transition-all duration-300 ease-in-out"
      :class="[isCollapsed ? 'ml-20' : 'ml-72']"
    >
      <header class="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-between transition-colors duration-200">
        <h1 class="text-xl font-semibold text-gray-800 dark:text-white">{{ pageTitle }}</h1>
        
        <div class="flex items-center gap-4">
          <button class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <BellIcon class="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button 
            class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
            :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleDarkMode"
          >
            <SunIcon v-if="isDarkMode" class="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <MoonIcon v-else class="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </header>
      
      <main class="flex-1 overflow-y-auto p-6 dark:text-white">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebarStore } from '@/stores/sidebar'
import AppSidebar from '@/components/layout/AppSidebar/index.vue'
import { BellIcon, MoonIcon, SunIcon } from '@heroicons/vue/24/outline'

const sidebarStore = useSidebarStore()
const isCollapsed = computed(() => sidebarStore.isCollapsed)
const route = useRoute()

// Dynamic page title based on current route
const pageTitle = computed(() => {
  const routeName = route.name?.toString() || ''
  return routeName.charAt(0).toUpperCase() + routeName.slice(1)
})

// Dark mode implementation
const isDarkMode = ref(false)

// Initialize dark mode based on localStorage or system preference
onMounted(() => {
  // Check localStorage first
  const storedTheme = localStorage.getItem('theme')
  if (storedTheme) {
    isDarkMode.value = storedTheme === 'dark'
  } else {
    // If no stored preference, check system preference
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  
  // Apply initial theme
  applyTheme()
})

// Toggle dark mode
function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
  applyTheme()
}

// Apply theme to document
function applyTheme() {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}
</script>

<style>
body {
  font-family: 'Inter', sans-serif;
}
</style> 