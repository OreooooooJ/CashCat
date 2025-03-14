<template>
  <router-link
    :to="path"
    class="flex items-center px-4 py-3 text-white transition-all duration-200 transform rounded-xl"
    :class="[
      isActive 
        ? isDarkMode 
          ? 'bg-gray-700 bg-opacity-70 shadow-md' 
          : 'bg-white bg-opacity-20 shadow-md' 
        : isDarkMode
          ? 'hover:bg-gray-700 hover:bg-opacity-40'
          : 'hover:bg-white hover:bg-opacity-10',
      isCollapsed ? 'justify-center' : ''
    ]"
  >
    <div 
      class="flex items-center justify-center rounded-lg transition-all duration-200"
      :class="[
        isActive 
          ? 'text-white' 
          : isDarkMode ? 'text-gray-400' : 'text-mint-light',
        isCollapsed ? 'w-10 h-10' : 'w-9 h-9'
      ]"
    >
      <component
        v-if="icon"
        :is="icon"
        class="flex-shrink-0 transition-all duration-200"
        :class="[
          isActive ? 'w-6 h-6' : 'w-5 h-5',
        ]"
      />
    </div>
    
    <transition name="slide-fade">
      <span 
        v-if="!isCollapsed" 
        class="ml-3 text-sm font-medium transition-all duration-200"
        :class="{ 'font-semibold': isActive }"
      >
        {{ name }}
      </span>
    </transition>

    <transition name="fade">
      <div 
        v-if="isActive && !isCollapsed" 
        class="ml-auto w-1.5 h-8 bg-white rounded-full"
      ></div>
    </transition>
  </router-link>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
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

// Dark mode detection
const isDarkMode = ref(false)

onMounted(() => {
  // Check for dark mode class on document
  isDarkMode.value = document.documentElement.classList.contains('dark')
  
  // Watch for changes to dark mode
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        isDarkMode.value = document.documentElement.classList.contains('dark')
      }
    })
  })
  
  observer.observe(document.documentElement, { attributes: true })
})
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 