<template>
  <div class="settings-container">
    <h1 class="settings-title">Settings</h1>
    
    <div class="settings-tabs">
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'profile' }"
        @click="activeTab = 'profile'"
      >
        Profile
      </button>
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'preferences' }"
        @click="activeTab = 'preferences'"
      >
        Preferences
      </button>
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'security' }"
        @click="activeTab = 'security'"
      >
        Security
      </button>
    </div>
    
    <div class="tab-content">
      <div v-if="activeTab === 'profile'" class="tab-pane">
        <UserProfile />
      </div>
      
      <div v-if="activeTab === 'preferences'" class="tab-pane">
        <div class="coming-soon">
          <h3>Preferences</h3>
          <p>Customize your CashCat experience. Coming soon!</p>
        </div>
      </div>
      
      <div v-if="activeTab === 'security'" class="tab-pane">
        <div class="coming-soon">
          <h3>Security Settings</h3>
          <p>Manage your account security. Coming soon!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import UserProfile from '../components/UserProfile.vue';

const activeTab = ref('profile');
</script>

<style scoped>
.settings-container {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.settings-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 2rem;
}

.settings-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 2rem;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 1rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #4b5563;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-content {
  min-height: 400px;
}

.tab-pane {
  animation: fadeIn 0.3s ease-in-out;
}

.coming-soon {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.coming-soon h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.coming-soon p {
  color: #6b7280;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .settings-container {
    padding: 1rem;
  }
  
  .settings-tabs {
    overflow-x: auto;
    white-space: nowrap;
    padding-bottom: 0.5rem;
  }
  
  .tab-button {
    padding: 0.75rem 1rem;
  }
}
</style> 