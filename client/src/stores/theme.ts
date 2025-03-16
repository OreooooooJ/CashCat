import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  // Initialize dark mode based on localStorage
  const isDarkMode = ref(false);
  
  // Initialize on client-side only
  if (typeof window !== 'undefined') {
    // Check localStorage first
    if (typeof localStorage !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        isDarkMode.value = storedTheme === 'dark';
      } else {
        // If no stored preference, check system preference
        isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    }
    
    // Apply initial theme
    applyTheme();
  }

  // Toggle dark mode
  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value;
    
    // Save preference to localStorage
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
      applyTheme();
    }
  }

  // Apply theme to document
  function applyTheme() {
    if (typeof document !== 'undefined') {
      if (isDarkMode.value) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  return {
    isDarkMode,
    toggleDarkMode
  };
}); 