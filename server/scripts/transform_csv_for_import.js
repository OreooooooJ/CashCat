#!/usr/bin/env node

/**
 * This script transforms CSV files from the resources directory
 * to match the Transaction table schema for direct upload to Supabase.
 * 
 * Run: node transform_csv_for_import.js
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// You'll need to install these packages:
// npm install csv-parser csv-writer uuid

// Check if the packages are installed
try {
  require.resolve('csv-parser');
  require.resolve('csv-writer');
  require.resolve('uuid');
} catch (e) {
  console.error('Missing dependencies. Please run:');
  console.error('npm install csv-parser csv-writer uuid');
  process.exit(1);
}

const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

// Directory paths
const resourcesDir = path.join(__dirname, '../../resources');
const outputDir = path.join(__dirname, '../../transformed-csv');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Configuration - REPLACE THESE WITH YOUR ACTUAL IDs
const CONFIG = {
  userId: 'your-user-id', // Replace with actual user ID from your database
  accountMappings: {
    '-71002': {
      accountId: 'your-credit-card-id', // Replace with actual credit card account ID
      type: 'credit',
      bankName: 'American Express'
    },
    'default-checking': {
      accountId: 'your-checking-account-id', // Replace with actual checking account ID
      type: 'checking',
      bankName: 'Chase'
    }
  }
};

// Helper functions
function determineTransactionType(amount, accountType) {
  const numericAmount = parseFloat(amount);
  
  if (accountType === 'credit') {
    // For credit cards: positive = expense, negative = income/payment
    return numericAmount > 0 ? 'expense' : 'income';
  } else {
    // For checking accounts: positive = income, negative = expense
    return numericAmount > 0 ? 'income' : 'expense';
  }
}

function formatDate(dateString) {
  // Convert MM/DD/YYYY to YYYY-MM-DD
  const [month, day, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function getAccountMapping(accountNumber) {
  return CONFIG.accountMappings[accountNumber] || CONFIG.accountMappings['default-checking'];
}

// Process each CSV file
async function processFiles() {
  const files = fs.readdirSync(resourcesDir);
  let totalRows = 0;
  
  console.log('Starting CSV transformation...');
  
  for (const file of files) {
    if (!file.endsWith('.csv')) continue;
    
    const inputPath = path.join(resourcesDir, file);
    const outputPath = path.join(outputDir, `transformed_${file}`);
    const rows = [];
    
    console.log(`\nProcessing ${file}...`);
    
    // Read and parse CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(inputPath)
        .pipe(csv())
        .on('data', (row) => {
          // Get account mapping based on Account #
          const accountMapping = getAccountMapping(row['Account #']);
          
          // Determine transaction type
          const transactionType = determineTransactionType(row.Amount, accountMapping.type);
          
          // Format date
          const formattedDate = formatDate(row.Date);
          
          // Create transformed row that matches Transaction table
          const transformedRow = {
            id: uuidv4(),
            amount: Math.abs(parseFloat(row.Amount)),
            type: transactionType,
            category: row.Category || (transactionType === 'income' ? 'Income' : 'Uncategorized'),
            description: row.Description,
            originalDescription: row.Description,
            vendor: row['Card Member'],
            accountNumber: row['Account #'],
            date: formattedDate,
            userId: CONFIG.userId,
            accountId: accountMapping.accountId,
            source: 'csv',
            bankName: accountMapping.bankName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          rows.push(transformedRow);
        })
        .on('end', () => {
          console.log(`Read ${rows.length} rows from ${file}`);
          resolve();
        })
        .on('error', (error) => {
          console.error(`Error reading ${file}:`, error);
          reject(error);
        });
    });
    
    // Write transformed CSV
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: [
        { id: 'id', title: 'id' },
        { id: 'amount', title: 'amount' },
        { id: 'type', title: 'type' },
        { id: 'category', title: 'category' },
        { id: 'description', title: 'description' },
        { id: 'originalDescription', title: 'originalDescription' },
        { id: 'vendor', title: 'vendor' },
        { id: 'accountNumber', title: 'accountNumber' },
        { id: 'date', title: 'date' },
        { id: 'userId', title: 'userId' },
        { id: 'accountId', title: 'accountId' },
        { id: 'source', title: 'source' },
        { id: 'bankName', title: 'bankName' },
        { id: 'createdAt', title: 'createdAt' },
        { id: 'updatedAt', title: 'updatedAt' }
      ]
    });
    
    await csvWriter.writeRecords(rows);
    console.log(`Wrote ${rows.length} transformed rows to ${outputPath}`);
    totalRows += rows.length;
  }
  
  console.log(`\n=== TRANSFORMATION COMPLETE ===`);
  console.log(`Total rows transformed: ${totalRows}`);
  console.log(`Output directory: ${outputDir}`);
  console.log(`\nIMPORTANT: Before uploading to Supabase, update these values:`);
  console.log(`1. userId: "${CONFIG.userId}" → Your actual user ID`);
  console.log(`2. accountId: Update the account IDs in CONFIG.accountMappings`);
}

// Run the process
processFiles().catch(error => {
  console.error('Error processing CSV files:', error);
  process.exit(1);
}); 