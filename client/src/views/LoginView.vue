<template>
  <div class="login-container">
    <div class="login-header">
      <h1>CashCat</h1>
      <p>Your personal finance tracker</p>
    </div>
    
    <LoginForm @login-success="handleLoginSuccess" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import LoginForm from '../components/LoginForm.vue';

const router = useRouter();

const handleLoginSuccess = () => {
  // Redirect to dashboard after successful login
  router.push('/dashboard');
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #f3f4f6;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 0.5rem;
}

.login-header p {
  font-size: 1.125rem;
  color: #6b7280;
}
</style> 