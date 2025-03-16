<template>
  <div class="accounts-view">
    <div class="page-header">
      <h1>Accounts</h1>
      <button class="add-account-btn" @click="showAddAccountModal = true">
        <PlusIcon class="w-5 h-5 mr-2" />
        Add Account
      </button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading accounts...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <ExclamationCircleIcon class="w-8 h-8 text-red-500" />
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchAccounts">Retry</button>
    </div>

    <div v-else-if="accounts.length === 0" class="empty-state">
      <CreditCardIcon class="w-16 h-16 text-gray-300" />
      <h2>No Accounts Yet</h2>
      <p>Add your first account to start tracking your finances</p>
      <button class="add-account-btn" @click="showAddAccountModal = true">
        <PlusIcon class="w-5 h-5 mr-2" />
        Add Account
      </button>
      
      <!-- Debug button to create a test account -->
      <div class="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">Debug Tools</h3>
        <button 
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2" 
          :disabled="isCreatingTest"
          @click="createTestAccount"
        >
          {{ isCreatingTest ? 'Creating...' : 'Create Test Account' }}
        </button>
        <button 
          class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600" 
          @click="checkAccounts"
        >
          Check Accounts
        </button>
        <div v-if="testAccountResult" class="mt-2 text-sm">
          {{ testAccountResult }}
        </div>
      </div>
    </div>

    <div v-else class="accounts-container">
      <div class="net-worth-card">
        <h2>Net Worth</h2>
        <p :class="{ 'text-red-500': totalBalance < 0 }">
          {{ formatCurrency(totalBalance) }}
        </p>
      </div>

      <!-- Debit Accounts Section -->
      <div class="account-section">
        <h2>Cash & Debit</h2>
        <div class="account-cards">
          <div 
            v-for="account in debitAccounts" 
            :key="account.id" 
            class="account-card"
            @click="viewAccountDetails(account.id)"
          >
            <div class="account-color-bar" :style="{ backgroundColor: account.color }"></div>
            <div class="account-details">
              <div class="account-name-balance">
                <h3>{{ account.name }}</h3>
                <p class="account-balance">{{ formatCurrency(account.balance) }}</p>
              </div>
              <div class="account-meta">
                <span class="account-institution">{{ account.institution || 'No institution' }}</span>
                <span v-if="account.lastFour" class="account-number">•••• {{ account.lastFour }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Credit Accounts Section -->
      <div class="account-section">
        <h2>Credit Cards</h2>
        <div class="account-cards">
          <div 
            v-for="account in creditAccounts" 
            :key="account.id" 
            class="account-card"
            @click="viewAccountDetails(account.id)"
          >
            <div class="account-color-bar" :style="{ backgroundColor: account.color }"></div>
            <div class="account-details">
              <div class="account-name-balance">
                <h3>{{ account.name }}</h3>
                <p class="account-balance negative">{{ formatCurrency(account.balance) }}</p>
              </div>
              <div class="account-meta">
                <span class="account-institution">{{ account.institution || 'No institution' }}</span>
                <span v-if="account.lastFour" class="account-number">•••• {{ account.lastFour }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Investment Accounts Section -->
      <div class="account-section">
        <h2>Investments</h2>
        <div class="account-cards">
          <div 
            v-for="account in investmentAccounts" 
            :key="account.id" 
            class="account-card"
            @click="viewAccountDetails(account.id)"
          >
            <div class="account-color-bar" :style="{ backgroundColor: account.color }"></div>
            <div class="account-details">
              <div class="account-name-balance">
                <h3>{{ account.name }}</h3>
                <p class="account-balance">{{ formatCurrency(account.balance) }}</p>
              </div>
              <div class="account-meta">
                <span class="account-institution">{{ account.institution || 'No institution' }}</span>
                <span v-if="account.lastFour" class="account-number">•••• {{ account.lastFour }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Account Modal -->
    <div v-if="showAddAccountModal" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h2>Add New Account</h2>
          <button class="close-btn" @click="showAddAccountModal = false">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
        <form class="account-form" @submit.prevent="submitNewAccount">
          <div class="form-group">
            <label for="account-name">Account Name</label>
            <input 
              id="account-name" 
              v-model="newAccount.name" 
              type="text" 
              required 
              placeholder="e.g. Checking Account"
            />
          </div>
          
          <div class="form-group">
            <label for="account-type">Account Type</label>
            <select id="account-type" v-model="newAccount.type" required>
              <option value="debit">Cash/Debit</option>
              <option value="credit">Credit Card</option>
              <option value="investment">Investment</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="account-balance">Current Balance</label>
            <div class="balance-input">
              <span class="currency-symbol">$</span>
              <input 
                id="account-balance" 
                v-model="newAccount.balance" 
                type="text" 
                required 
                placeholder="0.00"
                @input="formatBalance"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="account-institution">Institution (Optional)</label>
            <input 
              id="account-institution" 
              v-model="newAccount.institution" 
              type="text" 
              placeholder="e.g. Chase Bank"
            />
          </div>
          
          <div class="form-group">
            <label for="account-last-four">Last 4 Digits (Optional)</label>
            <input 
              id="account-last-four" 
              v-model="newAccount.lastFour" 
              type="text" 
              maxlength="4" 
              placeholder="1234"
              pattern="[0-9]{4}"
            />
          </div>
          
          <div class="form-group">
            <label for="account-color">Color</label>
            <div class="color-options">
              <button 
                v-for="color in accountColors" 
                :key="color" 
                type="button"
                class="color-option" 
                :class="{ selected: newAccount.color === color }"
                :style="{ backgroundColor: color }"
                @click="newAccount.color = color"
              ></button>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showAddAccountModal = false">
              Cancel
            </button>
            <button type="submit" class="submit-btn" :disabled="isSubmitting">
              <span v-if="isSubmitting">Adding...</span>
              <span v-else>Add Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/account';
import { 
  PlusIcon, 
  ExclamationCircleIcon, 
  CreditCardIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline';
import currency from 'currency.js';
import type { Account } from '@/types/account';

const router = useRouter();
const accountStore = useAccountStore();

const accounts = computed(() => accountStore.accounts);
const isLoading = computed(() => accountStore.isLoading);
const error = computed(() => accountStore.error);
const totalBalance = computed(() => accountStore.totalBalance());

const debitAccounts = computed(() => 
  accounts.value.filter(account => account.type === 'debit')
);

const creditAccounts = computed(() => 
  accounts.value.filter(account => account.type === 'credit')
);

const investmentAccounts = computed(() => 
  accounts.value.filter(account => account.type === 'investment')
);

const showAddAccountModal = ref(false);
const isSubmitting = ref(false);

const accountColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6B7280'  // Gray
];

const newAccount = ref({
  name: '',
  type: 'debit',
  balance: '',
  institution: '',
  lastFour: '',
  color: accountColors[0]
});

const formatCurrency = (amount: number) => {
  return currency(amount, { symbol: '$' }).format();
};

const formatBalance = (event: Event) => {
  const input = (event.target as HTMLInputElement).value.replace(/[^\d.-]/g, '');
  if (input) {
    newAccount.value.balance = currency(input, { symbol: '' }).format();
  } else {
    newAccount.value.balance = '';
  }
};

const resetNewAccountForm = () => {
  newAccount.value = {
    name: '',
    type: 'debit',
    balance: '',
    institution: '',
    lastFour: '',
    color: accountColors[0]
  };
};

const submitNewAccount = async () => {
  try {
    isSubmitting.value = true;
    
    // Convert balance string to number
    const balanceValue = parseFloat(newAccount.value.balance.replace(/,/g, ''));
    
    // For credit accounts, make the balance negative if it's positive
    const adjustedBalance = newAccount.value.type === 'credit' && balanceValue > 0 
      ? -balanceValue 
      : balanceValue;
    
    await accountStore.addAccount({
      name: newAccount.value.name,
      type: newAccount.value.type as 'debit' | 'credit' | 'investment',
      balance: adjustedBalance,
      institution: newAccount.value.institution || undefined,
      lastFour: newAccount.value.lastFour || undefined,
      color: newAccount.value.color
    });
    
    showAddAccountModal.value = false;
    resetNewAccountForm();
  } catch (err) {
    console.error('Error adding account:', err);
  } finally {
    isSubmitting.value = false;
  }
};

const viewAccountDetails = (accountId: string) => {
  router.push(`/accounts/${accountId}`);
};

const fetchAccounts = async () => {
  await accountStore.fetchAccounts();
};

// Debug state
const isCreatingTest = ref(false);
const testAccountResult = ref('');

// Debug function to create a test account
const createTestAccount = async () => {
  isCreatingTest.value = true;
  testAccountResult.value = '';
  
  try {
    const testAccount = {
      name: 'Test Account',
      type: 'debit' as 'debit' | 'credit' | 'investment',
      balance: 1000,
      institution: 'Test Bank',
      lastFour: '1234',
      color: '#10B981'
    };
    
    const result = await accountStore.addAccount(testAccount);
    await fetchAccounts();
    testAccountResult.value = `Success! Account created with ID: ${result.id}`;
  } catch (err) {
    console.error('Error creating test account:', err);
    testAccountResult.value = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
  } finally {
    isCreatingTest.value = false;
  }
};

// Debug function to check accounts
const checkAccounts = () => {
  console.log('All accounts:', accounts.value);
  console.log('Debit accounts:', debitAccounts.value);
  console.log('Credit accounts:', creditAccounts.value);
  console.log('Investment accounts:', investmentAccounts.value);
  testAccountResult.value = `Accounts checked. See console for details. Found ${accounts.value.length} total accounts, ${investmentAccounts.value.length} investment accounts.`;
};

onMounted(() => {
  fetchAccounts();
});
</script>

<style scoped>
.accounts-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h1 {
  font-size: 1.875rem;
  font-weight: 600;
  color: #1f2937;
}

.add-account-btn {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #10b981;
  color: white;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.add-account-btn:hover {
  background-color: #059669;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid rgba(16, 185, 129, 0.2);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  color: #4b5563;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background-color: #e5e7eb;
}

.empty-state h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 1rem 0 0.5rem;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.accounts-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.net-worth-card {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.net-worth-card h2 {
  font-size: 1.25rem;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.net-worth-card p {
  font-size: 2rem;
  font-weight: 600;
  color: #10b981;
}

.account-section {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.account-section h2 {
  font-size: 1.25rem;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 1rem;
}

.account-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.account-card {
  display: flex;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.account-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.account-color-bar {
  width: 0.5rem;
  flex-shrink: 0;
}

.account-details {
  flex: 1;
  padding: 1rem;
}

.account-name-balance {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.account-name-balance h3 {
  font-weight: 500;
  color: #1f2937;
}

.account-balance {
  font-weight: 600;
  color: #10b981;
}

.account-balance.negative {
  color: #ef4444;
}

.account-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-container {
  background-color: white;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  color: #6b7280;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #1f2937;
}

.account-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
}

.balance-input {
  position: relative;
}

.currency-symbol {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.balance-input input {
  padding-left: 1.5rem;
}

.color-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.color-option {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.color-option.selected {
  border-color: #1f2937;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-btn {
  padding: 0.625rem 1.25rem;
  background-color: #f3f4f6;
  color: #4b5563;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background-color: #e5e7eb;
}

.submit-btn {
  padding: 0.625rem 1.25rem;
  background-color: #10b981;
  color: white;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background-color: #059669;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .accounts-view {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .account-cards {
    grid-template-columns: 1fr;
  }
}
</style> 