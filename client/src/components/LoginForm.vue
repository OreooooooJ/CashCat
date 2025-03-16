<template>
  <div class="login-form">
    <h2>Login to CashCat</h2>
    
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">Email</label>
        <input 
          id="email"
          v-model="email" 
          type="email" 
          class="form-input"
          placeholder="Enter your email"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input 
          id="password"
          v-model="password" 
          type="password" 
          class="form-input"
          placeholder="Enter your password"
          required
        />
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <button type="submit" class="login-button" :disabled="isLoading">
        <span v-if="isLoading">Logging in...</span>
        <span v-else>Login</span>
      </button>
    </form>
    
    <div class="demo-login">
      <p>Demo Account:</p>
      <button class="demo-button" @click="fillDemoCredentials">
        Use Demo Credentials
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const emit = defineEmits(['login-success']);

const email = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  error.value = '';
  isLoading.value = true;
  
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/login`,
      {
        email: email.value,
        password: password.value
      }
    );
    
    // Store token and user info
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    // Emit success event
    emit('login-success', response.data.user);
  } catch (err: any) {
    if (err.response?.data?.error) {
      error.value = err.response.data.error;
    } else {
      error.value = 'Failed to login. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
};

const fillDemoCredentials = () => {
  email.value = 'test@example.com';
  password.value = 'password123';
};
</script>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.login-button:hover {
  background: #2563eb;
}

.login-button:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.error-message {
  background: #fef2f2;
  color: #991b1b;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.demo-login {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.demo-login p {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.demo-button {
  background: #f3f4f6;
  color: #4b5563;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.demo-button:hover {
  background: #e5e7eb;
}
</style> 