<template>
  <div class="user-profile">
    <h2 class="profile-title">User Profile</h2>
    
    <div v-if="loading" class="loading">
      <p>Loading profile information...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button class="retry-button" @click="fetchProfile">Retry</button>
    </div>
    
    <div v-else class="profile-content">
      <div v-if="!isEditing" class="profile-view">
        <div class="profile-info">
          <div class="info-item">
            <span class="label">Name:</span>
            <span class="value">{{ profile.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">Email:</span>
            <span class="value">{{ profile.email }}</span>
          </div>
          <div class="info-item">
            <span class="label">Member Since:</span>
            <span class="value">{{ formatDate(profile.createdAt) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Transactions:</span>
            <span class="value">{{ profile.transactionCount }}</span>
          </div>
          <div class="info-item">
            <span class="label">Budgets:</span>
            <span class="value">{{ profile.budgetCount }}</span>
          </div>
        </div>
        <button class="edit-button" @click="startEditing">Edit Profile</button>
      </div>
      
      <form v-else class="profile-form" @submit.prevent="updateProfile">
        <div class="form-group">
          <label for="name">Name</label>
          <input 
            id="name" 
            v-model="editForm.name" 
            type="text" 
            required
          />
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            id="email" 
            v-model="editForm.email" 
            type="email" 
            required
          />
        </div>
        
        <div class="form-group">
          <label for="password">New Password (leave blank to keep current)</label>
          <input 
            id="password" 
            v-model="editForm.password" 
            type="password"
            placeholder="Enter new password"
          />
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Confirm New Password</label>
          <input 
            id="confirmPassword" 
            v-model="editForm.confirmPassword" 
            type="password"
            placeholder="Confirm new password"
            :disabled="!editForm.password"
          />
        </div>
        
        <div class="form-actions">
          <button type="submit" class="save-button" :disabled="updateLoading">
            {{ updateLoading ? 'Saving...' : 'Save Changes' }}
          </button>
          <button type="button" class="cancel-button" @click="cancelEditing">Cancel</button>
        </div>
        
        <div v-if="updateError" class="update-error">
          {{ updateError }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';

const API_URL = '/api/users';
const profile = ref({
  id: '',
  name: '',
  email: '',
  createdAt: '',
  transactionCount: 0,
  budgetCount: 0
});

const loading = ref(true);
const error = ref('');
const isEditing = ref(false);
const updateLoading = ref(false);
const updateError = ref('');

const editForm = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
});

onMounted(() => {
  fetchProfile();
});

async function fetchProfile() {
  loading.value = true;
  error.value = '';
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${API_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }
    
    const data = await response.json();
    profile.value = data;
  } catch (err) {
    console.error('Error fetching profile:', err);
    error.value = 'Failed to load profile information. Please try again.';
  } finally {
    loading.value = false;
  }
}

function startEditing() {
  editForm.name = profile.value.name;
  editForm.email = profile.value.email;
  editForm.password = '';
  editForm.confirmPassword = '';
  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
  updateError.value = '';
}

async function updateProfile() {
  // Validate password match if provided
  if (editForm.password && editForm.password !== editForm.confirmPassword) {
    updateError.value = 'Passwords do not match';
    return;
  }
  
  updateLoading.value = true;
  updateError.value = '';
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    // Prepare update data
    const updateData = {
      name: editForm.name,
      email: editForm.email
    };
    
    // Only include password if provided
    if (editForm.password) {
      updateData.password = editForm.password;
    }
    
    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update profile');
    }
    
    // Update was successful
    const data = await response.json();
    profile.value = data;
    isEditing.value = false;
  } catch (err) {
    console.error('Error updating profile:', err);
    updateError.value = err.message || 'Failed to update profile. Please try again.';
  } finally {
    updateLoading.value = false;
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}
</script>

<style scoped>
.user-profile {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 24px;
  max-width: 600px;
  margin: 0 auto;
}

.profile-title {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 24px;
  font-size: 1.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
}

.loading, .error {
  text-align: center;
  padding: 20px;
}

.error {
  color: #e74c3c;
}

.retry-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.profile-info {
  margin-bottom: 24px;
}

.info-item {
  margin-bottom: 12px;
  display: flex;
}

.label {
  font-weight: 600;
  width: 120px;
  color: #7f8c8d;
}

.value {
  flex: 1;
}

.edit-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.profile-form {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #7f8c8d;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 24px;
}

.save-button {
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.save-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.cancel-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.update-error {
  color: #e74c3c;
  margin-top: 16px;
  padding: 10px;
  background-color: #fadbd8;
  border-radius: 4px;
}
</style> 