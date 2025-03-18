<template>
  <div class="accounts-overview">
    <div class="header">
      <h2 class="title">Bank Accounts</h2>
      <button class="add-button" @click="$router.push('/accounts/add')">
        <PlusIcon class="icon" />
        <span>Add</span>
      </button>
    </div>
    
    <div class="debug-info">
      <p>Total accounts: {{ accounts.length }}</p>
      <p>Debit accounts: {{ debitAccounts.length }}</p>
      <p>Credit accounts: {{ creditAccounts.length }}</p>
      <p>Account types: {{ accounts.map(a => a.type).join(', ') }}</p>
      <div v-for="(account, index) in accounts" :key="account.id" class="account-debug">
        <p>Account {{ index + 1 }}: {{ account.name }} ({{ account.type }}) - ${{ account.balance }}</p>
      </div>
    </div>

    <div v-if="accounts.length === 0" class="no-accounts">
      <p>You don't have any bank accounts yet.</p>
      <button class="add-account-button" @click="$router.push('/accounts/add')">
        Add Bank Account
      </button>
    </div>
    
    <div v-else class="accounts-container">
      <div class="accounts-section">
        <h3 class="section-title">Checking & Savings</h3>
        <div v-if="debitAccounts.length === 0" class="no-accounts-in-section">
          <p>No checking or savings accounts</p>
        </div>
        <div v-else class="accounts-list">
          <AccountCard 
            v-for="account in debitAccounts" 
            :key="account.id" 
            :account="account"
            @click="$router.push(`/accounts/${account.id}`)"
          />
        </div>
      </div>
      
      <div class="accounts-section">
        <h3 class="section-title">Credit Cards</h3>
        <div v-if="creditAccounts.length === 0" class="no-accounts-in-section">
          <p>No credit cards</p>
        </div>
        <div v-else class="accounts-list">
          <AccountCard 
            v-for="account in creditAccounts" 
            :key="account.id" 
            :account="account"
            @click="$router.push(`/accounts/${account.id}`)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { PlusIcon } from '@heroicons/vue/24/outline';
import AccountCard from '../accounts/AccountCard.vue';
import type { Account } from '@/types/account';

// Props
const props = defineProps<{
  accounts: Account[];
}>();

// Log accounts on mount for debugging
onMounted(() => {
  console.log('AccountsOverview mounted with accounts:', props.accounts);
  console.log('Account types:', props.accounts.map(a => a.type));
  console.log('Account details:');
  props.accounts.forEach((account, index) => {
    console.log(`Account ${index + 1}: ${account.name} (${account.type}) - Balance: $${account.balance}`);
  });
});

// Watch for changes in accounts
watch(() => props.accounts, (newAccounts) => {
  console.log('Accounts changed:', newAccounts);
  console.log('New account types:', newAccounts.map(a => a.type));
}, { deep: true });

// Computed properties
const debitAccounts = computed(() => {
  console.log('Computing debit accounts...');
  return props.accounts.filter(account => {
    const isDebit = account.type === 'checking' || account.type === 'savings';
    console.log(`Account ${account.name} (${account.type}) is debit? ${isDebit}`);
    return isDebit;
  });
});

const creditAccounts = computed(() => {
  console.log('Computing credit accounts...');
  return props.accounts.filter(account => {
    const isCredit = account.type === 'credit';
    console.log(`Account ${account.name} (${account.type}) is credit? ${isCredit}`);
    return isCredit;
  });
});
</script>

<style scoped>
.accounts-overview {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.add-button {
  display: flex;
  align-items: center;
  background-color: #f3f4f6;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-button:hover {
  background-color: #e5e7eb;
}

.icon {
  width: 1rem;
  height: 1rem;
  margin-right: 0.25rem;
}

.accounts-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.accounts-section {
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.75rem;
}

.accounts-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.no-accounts {
  text-align: center;
  padding: 2rem 0;
}

.no-accounts p {
  color: #6b7280;
  margin-bottom: 1rem;
}

.add-account-button {
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-account-button:hover {
  background-color: #2563eb;
}

.no-accounts-in-section {
  color: #9ca3af;
  font-size: 0.875rem;
  padding: 0.5rem 0;
}

.debug-info {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.debug-info p {
  margin: 0.25rem 0;
}

.account-debug {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #f3f4f6;
  border-radius: 0.25rem;
}
</style>
