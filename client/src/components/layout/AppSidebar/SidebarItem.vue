<template>
  <router-link
    :to="path"
    class="flex items-center px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700"
    :class="{ 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white': isActive }"
  >
    <component
      v-if="icon"
      :is="icon"
      class="flex-shrink-0 w-3 h-3"
      :class="{ 'mr-2': !isCollapsed }"
    />
    
    <span v-if="!isCollapsed" class="text-sm font-medium truncate">
      {{ name }}
    </span>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebarStore } from '@/stores/sidebar'
import type { NavItem } from '@/types/navigation'

const props = defineProps<{
  name: string
  path: string
  icon?: NavItem['icon']
}>()

const route = useRoute()
const sidebarStore = useSidebarStore()

const isCollapsed = computed(() => sidebarStore.isCollapsed)
const isActive = computed(() => route.path === props.path)
</script>

<style scoped>
.router-link-active {
  @apply bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white;
}
</style> 