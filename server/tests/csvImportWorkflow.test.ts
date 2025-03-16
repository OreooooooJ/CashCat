import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';

// This test requires a running server and database
// It's designed to be run in a CI/CD environment or locally with the server running

const API_URL = 'http://localhost:3000/api';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'password123';
const CSV_TEST_FILE = path.join(__dirname, '../test-data/amex-test.csv');

describe('CSV Import Workflow E2E Test', () => {
  let prisma: PrismaClient;
  let authToken: string;
  let testAccountId: string;
  let initialTransactionCount: number;
  
  // Create a test CSV file
  beforeAll(async () => {
    // Ensure the test-data directory exists
    const testDataDir = path.join(__dirname, '../test-data');
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    
    // Create a test CSV file with Amex format
    const csvContent = `Date,Description,Card Member,Account #,Amount,Category
02/26/2025,WALMART.COM W+ AMEX BENTONVILLE AR,Test User,-71002,12.95,Retail
02/24/2025,OPENAI *CHATGPT SUBSSAN FRANCISCO CA,Test User,-71002,20.00,Subscription
02/23/2025,AMAZON MARKEPLACE NA PA,Test User,-71002,84.99,Online Shopping`;
    
    fs.writeFileSync(CSV_TEST_FILE, csvContent);
    
    // Initialize Prisma client
    prisma = new PrismaClient();
    
    // Login to get auth token
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });
      
      authToken = loginResponse.data.token;
      
      // Get a test account ID
      const accountsResponse = await axios.get(`${API_URL}/accounts`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (accountsResponse.data.length === 0) {
        throw new Error('No test accounts found. Please run addTestAccounts.ts first.');
      }
      
      // Prefer a credit account for the test
      const creditAccount = accountsResponse.data.find((acc: any) => acc.type === 'credit');
      testAccountId = creditAccount ? creditAccount.id : accountsResponse.data[0].id;
      
      // Get initial transaction count
      const transactionsResponse = await axios.get(`${API_URL}/transactions`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      initialTransactionCount = transactionsResponse.data.length;
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });
  
  afterAll(async () => {
    // Clean up the test CSV file
    if (fs.existsSync(CSV_TEST_FILE)) {
      fs.unlinkSync(CSV_TEST_FILE);
    }
    
    await prisma.$disconnect();
  });
  
  it('should import transactions from a CSV file', async () => {
    // Skip if no auth token or account ID
    if (!authToken || !testAccountId) {
      console.warn('Skipping test due to missing auth token or account ID');
      return;
    }
    
    // Create form data with the CSV file
    const formData = new FormData();
    formData.append('file', fs.createReadStream(CSV_TEST_FILE));
    formData.append('accountId', testAccountId);
    
    // Import the CSV file
    const importResponse = await axios.post(
      `${API_URL}/transactions/import`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          ...formData.getHeaders()
        }
      }
    );
    
    // Check the response
    expect(importResponse.status).toBe(201);
    expect(importResponse.data.message).toContain('Successfully imported');
    expect(importResponse.data.transactions).toHaveLength(3);
    
    // Verify the transactions were created in the database
    const transactionsResponse = await axios.get(`${API_URL}/transactions`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    // Should have 3 more transactions than before
    expect(transactionsResponse.data.length).toBe(initialTransactionCount + 3);
    
    // Check that the imported transactions exist
    const importedTransactions = transactionsResponse.data.filter(
      (t: any) => t.description.includes('WALMART') || 
                 t.description.includes('OPENAI') || 
                 t.description.includes('AMAZON')
    );
    
    expect(importedTransactions.length).toBeGreaterThanOrEqual(3);
    
    // Check specific transaction details
    const walmartTransaction = transactionsResponse.data.find(
      (t: any) => t.description.includes('WALMART')
    );
    
    if (walmartTransaction) {
      expect(walmartTransaction.amount).toBe(12.95);
      expect(walmartTransaction.type).toBe('EXPENSE');
      expect(walmartTransaction.category).toBe('Retail');
      expect(walmartTransaction.accountId).toBe(testAccountId);
    }
  });
}); 