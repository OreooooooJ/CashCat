<template>
  <aside
    class="flex flex-col h-full bg-white border-r rtl:border-r-0 rtl:border-l dark:bg-gray-900 dark:border-gray-700"
    :class="[
      isCollapsed ? 'w-16' : 'w-64',
      isMobileOpen ? 'fixed inset-y-0 left-0 z-50' : ''
    ]"
  >
    <!-- Sidebar Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
      <router-link to="/" class="flex items-center gap-2">
        <img src="@/assets/logo.svg" alt="CashCat" class="w-4 h-4" />
        <span v-if="!isCollapsed" class="text-lg font-semibold text-gray-800 dark:text-white">CashCat</span>
      </router-link>
      
      <button
        @click="toggleCollapse"
        class="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        <ChevronLeftIcon v-if="!isCollapsed" class="w-3 h-3 text-gray-500 dark:text-gray-400" />
        <ChevronRightIcon v-else class="w-3 h-3 text-gray-500 dark:text-gray-400" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 space-y-1 overflow-y-auto p-4">
      <SidebarItem
        v-for="item in navigationItems"
        :key="item.path"
        v-bind="item"
      />
    </nav>

    <!-- Footer -->
    <div class="border-t dark:border-gray-700 p-4">
      <SidebarItem
        name="Settings"
        path="/settings"
        :icon="Cog6ToothIcon"
      />
    </div>
  </aside>

  <!-- Mobile Overlay -->
  <div
    v-if="isMobileOpen"
    class="fixed inset-0 z-40 bg-black bg-opacity-50"
    @click="closeMobile"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'
import { useSidebarStore } from '@/stores/sidebar'
import SidebarItem from './SidebarItem.vue'
import type { NavItem } from '@/types/navigation'

const sidebarStore = useSidebarStore()

const isCollapsed = computed(() => sidebarStore.isCollapsed)
const isMobileOpen = computed(() => sidebarStore.isMobileOpen)

const { toggleCollapse, closeMobile } = sidebarStore

const navigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: HomeIcon
  },
  {
    name: 'Transactions',
    path: '/transactions',
    icon: CurrencyDollarIcon
  },
  {
    name: 'Analytics',
    path: '/analytics',
    icon: ChartBarIcon
  }
]
</script>

<style scoped>
aside {
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 40;
}
</style> 