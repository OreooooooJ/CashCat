<template>
  <aside
    class="flex flex-col h-full transition-all duration-300 ease-in-out"
    :class="[
      isCollapsed ? 'w-20' : 'w-72',
      isMobileOpen ? 'fixed inset-y-0 left-0 z-50' : '',
      isDarkMode 
        ? 'bg-gradient-to-b from-gray-800 to-gray-900 shadow-xl' 
        : 'bg-gradient-to-b from-mint-dark to-mint-primary shadow-xl'
    ]"
  >
    <!-- Sidebar Header -->
    <div class="flex items-center justify-between px-6 py-6">
      <router-link to="/" class="flex items-center gap-3">
        <div class="bg-white rounded-full p-2 shadow-md">
          <img src="@/assets/logo.svg" alt="CashCat" class="w-6 h-6" />
        </div>
        <transition name="fade">
          <span v-if="!isCollapsed" class="text-xl font-bold text-white">CashCat</span>
        </transition>
      </router-link>
      
      <button
        @click="toggleCollapse"
        class="p-2 rounded-full bg-opacity-20 hover:bg-opacity-30 transition-all duration-200"
        :class="isDarkMode ? 'bg-gray-600' : 'bg-mint-light'"
      >
        <ChevronLeftIcon v-if="!isCollapsed" class="w-5 h-5 text-white" />
        <ChevronRightIcon v-else class="w-5 h-5 text-white" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 space-y-2 overflow-y-auto px-4 py-6">
      <SidebarItem
        v-for="item in navigationItems"
        :key="item.path"
        v-bind="item"
      />
    </nav>

    <!-- User Profile Section -->
    <div class="px-4 py-4">
      <router-link 
        to="/settings"
        class="flex items-center p-3 rounded-xl transition-all duration-200"
        :class="[
          isCollapsed ? 'justify-center' : 'justify-between', 
          isDarkMode 
            ? 'bg-gray-700 bg-opacity-40 hover:bg-opacity-60' 
            : 'bg-mint-light bg-opacity-10 hover:bg-opacity-20'
        ]"
      >
        <div class="flex items-center gap-3">
          <div 
            class="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold shadow-md"
            :class="isDarkMode ? 'text-gray-800' : 'text-mint-primary'"
          >
            {{ userInitials }}
          </div>
          <transition name="fade">
            <div v-if="!isCollapsed" class="flex flex-col">
              <span class="text-sm font-medium text-white">{{ userName }}</span>
              <span 
                class="text-xs"
                :class="isDarkMode ? 'text-gray-400' : 'text-mint-light'"
              >
                View Profile
              </span>
            </div>
          </transition>
        </div>
        <transition name="fade">
          <button 
            v-if="!isCollapsed" 
            @click.stop="logout" 
            class="hover:text-white transition-colors"
            :class="isDarkMode ? 'text-gray-400' : 'text-mint-light'"
          >
            <ArrowRightOnRectangleIcon class="w-5 h-5" />
          </button>
        </transition>
      </router-link>
    </div>

    <!-- Footer -->
    <div class="px-4 pb-6 pt-2">
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
    class="fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300"
    @click="closeMobile"
  />
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'
import { useSidebarStore } from '@/stores/sidebar'
import { useRouter } from 'vue-router'
import SidebarItem from './SidebarItem.vue'
import type { NavItem } from '@/types/navigation'

const sidebarStore = useSidebarStore()
const router = useRouter()

const isCollapsed = computed(() => sidebarStore.isCollapsed)
const isMobileOpen = computed(() => sidebarStore.isMobileOpen)

const { toggleCollapse, closeMobile } = sidebarStore

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

// User information
const userName = ref('')
const userInitials = computed(() => {
  if (!userName.value) return 'U'
  return userName.value
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
})

// Get user info from localStorage on mount
onMounted(() => {
  try {
    const userJson = localStorage.getItem('user')
    if (userJson) {
      const user = JSON.parse(userJson)
      userName.value = user.name || 'User'
    } else {
      userName.value = 'User'
    }
  } catch (error) {
    console.error('Error parsing user data:', error)
    userName.value = 'User'
  }
})

// Navigation items
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

// Logout function
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
aside {
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 40;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Mint-inspired color variables */
:root {
  --mint-primary: #2eb886;
  --mint-dark: #0d7a5f;
  --mint-light: #a3e4c9;
}
</style> 