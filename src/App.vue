<template>
  <div class="app">
    <header>
      <h1>💰 CashCat</h1>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: #f9fafb;
}

header {
  background: #1a237e;
  color: white;
  padding: 1rem;
  text-align: center;
  margin-bottom: 2rem;
}

h1 {
  margin: 0;
  font-size: 2rem;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}
</style>
