<template>
  <div class="csv-import-container">
    <h3 class="text-lg font-medium mb-4">Import Transactions from CSV</h3>
    
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p>{{ error }}</p>
    </div>
    
    <div v-if="success" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
      <p>{{ success }}</p>
    </div>
    
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Account Selection -->
      <div>
        <label for="account" class="block text-sm font-medium text-gray-700">Account</label>
        <select 
          id="account" 
          v-model="selectedAccountId" 
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          required
        >
          <option value="" disabled>Select an account</option>
          <option v-for="account in accounts" :key="account.id" :value="account.id">
            {{ account.name }} ({{ account.type }})
          </option>
        </select>
      </div>
      
      <!-- File Upload -->
      <div>
        <label for="csvFile" class="block text-sm font-medium text-gray-700">CSV File</label>
        <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div class="space-y-1 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div class="flex text-sm text-gray-600">
              <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                <span>Upload a file</span>
                <input 
                  id="file-upload" 
                  name="file-upload" 
                  type="file" 
                  class="sr-only" 
                  accept=".csv"
                  @change="handleFileChange"
                  required
                >
              </label>
              <p class="pl-1">or drag and drop</p>
            </div>
            <p class="text-xs text-gray-500">CSV files only</p>
          </div>
        </div>
        <p v-if="selectedFile" class="mt-2 text-sm text-gray-500">
          Selected file: {{ selectedFile.name }}
        </p>
      </div>
      
      <!-- Bank Format Selection -->
      <div v-if="supportedFormats.length > 0">
        <label for="format" class="block text-sm font-medium text-gray-700">Bank Format (Optional)</label>
        <select 
          id="format" 
          v-model="selectedFormat" 
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">Auto-detect</option>
          <option v-for="format in supportedFormats" :key="format" :value="format">
            {{ format }}
          </option>
        </select>
        <p class="mt-1 text-sm text-gray-500">
          If your bank format is not detected automatically, select it here.
        </p>
      </div>
      
      <!-- Submit Button -->
      <div class="flex justify-end space-x-3">
        <button 
          type="button" 
          class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          @click="$emit('close')"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Importing...</span>
          <span v-else>Import</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/utils/api';
import { useAccountStore } from '../stores/account';
import { useTransactionStore } from '../stores/transaction';

// Emits
const emit = defineEmits(['close', 'imported']);

// Stores
const accountStore = useAccountStore();
const transactionStore = useTransactionStore();

// State
const selectedAccountId = ref('');
const selectedFile = ref<File | null>(null);
const selectedFormat = ref('');
const supportedFormats = ref<string[]>([]);
const isLoading = ref(false);
const error = ref('');
const success = ref('');

// Computed
const accounts = accountStore.accounts;

// Methods
const fetchSupportedFormats = async () => {
  try {
    const response = await api.get('/api/transactions/import/formats');
    supportedFormats.value = response.data;
  } catch (err) {
    console.error('Error fetching supported formats:', err);
    error.value = 'Failed to fetch supported formats';
  }
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0];
  }
};

const handleSubmit = async () => {
  if (!selectedFile.value || !selectedAccountId.value) {
    error.value = 'Please select a file and an account';
    return;
  }
  
  isLoading.value = true;
  error.value = '';
  success.value = '';
  
  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    formData.append('accountId', selectedAccountId.value);
    
    if (selectedFormat.value) {
      formData.append('formatName', selectedFormat.value);
    }
    
    const response = await api.post('/api/transactions/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    success.value = response.data.message;
    
    // Refresh transactions
    await transactionStore.fetchTransactions();
    
    // Emit event
    emit('imported');
    
    // Reset form after successful import
    selectedFile.value = null;
    
    // Close modal after a delay
    setTimeout(() => {
      emit('close');
    }, 2000);
  } catch (err) {
    console.error('Error importing transactions:', err);
    error.value = err instanceof Error ? err.message : 'Failed to import transactions';
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle hooks
onMounted(async () => {
  await fetchSupportedFormats();
  
  // Set default account if available
  if (accounts.length > 0) {
    // Prefer credit card accounts for statement imports
    const creditAccount = accounts.find(a => a.type.toLowerCase() === 'credit');
    if (creditAccount) {
      selectedAccountId.value = creditAccount.id;
    } else {
      selectedAccountId.value = accounts[0].id;
    }
  }
});
</script>

<style scoped>
.csv-import-container {
  padding: 1.5rem;
}
</style> 