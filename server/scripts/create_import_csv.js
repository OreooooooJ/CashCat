#!/usr/bin/env node

/**
 * CSV Transformation Script for Supabase Import
 * 
 * This script transforms CSV files from the resources folder to match
 * the Transaction table schema, allowing for direct import in Supabase.
 * 
 * Usage:
 * 1. Update the userId and accountIds variables with your actual values
 * 2. Run: node create_import_csv.js
 * 3. Find generated CSV files in the transformed-csv directory
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const { v4: uuidv4 } = require('uuid');

// Utility functions
function formatDescription(description) {
  return description ? description.trim() : '';
}

function formatCategory(category) {
  return category ? category.trim() : 'Uncategorized';
}

// IMPORTANT: Update these values with your actual IDs from the database
const userId = 'your-user-id'; // Replace with your actual user ID
const checkingAccountId = 'your-checking-account-id'; // Replace with your checking account ID
const creditAccountId = 'your-credit-account-id'; // Replace with your credit account ID

// File mapping configuration
const fileMapping = [
  { 
    pattern: 'Chase_checking1', 
    accountId: checkingAccountId, 
    accountType: 'checking'
  },
  { 
    pattern: 'Chase_checking2', 
    accountId: checkingAccountId, 
    accountType: 'checking'
  },
  { 
    pattern: 'amexMonthlyStatement', 
    accountId: creditAccountId, 
    accountType: 'credit'
  }
];

// Create output directory
const outputDir = path.join(__dirname, '../../transformed-csv');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Process each file in resources directory
const resourcesDir = path.join(__dirname, '../../resources');
const files = fs.readdirSync(resourcesDir);

let totalTransformed = 0;

files.forEach(filename => {
  if (!filename.endsWith('.csv')) return;
  
  // Find matching account configuration
  const mapping = fileMapping.find(m => filename.includes(m.pattern));
  if (!mapping) {
    console.log(`Skipping ${filename} - no matching account configuration`);
    return;
  }
  
  console.log(`Processing ${filename}...`);
  
  // Read and parse CSV file
  const filePath = path.join(resourcesDir, filename);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const records = parse(fileContent, { 
    columns: true,
    skip_empty_lines: true
  });
  
  console.log(`Found ${records.length} records in ${filename}`);
  
  // Transform records to match Transaction table schema
  const now = new Date().toISOString();
  const transformedRecords = records.map(record => {
    // Parse date
    const [month, day, year] = record.Date.split('/');
    const date = new Date(`${year}-${month}-${day}`).toISOString();
    
    // Parse amount
    const amount = parseFloat(record.Amount);
    const absAmount = Math.abs(amount);
    
    // Determine transaction type based on account type
    let type;
    if (mapping.accountType === 'credit') {
      // For credit cards: positive = expense, negative = income/payment
      type = amount > 0 ? 'expense' : 'income';
    } else {
      // For checking accounts: positive = income, negative = expense
      type = amount > 0 ? 'income' : 'expense';
    }
    
    // Create transformed record matching Transaction table structure
    return {
      id: uuidv4(),
      amount: absAmount,
      type,
      category: formatCategory(record.Category),
      description: formatDescription(record.Description),
      date,
      userId,
      accountId: mapping.accountId,
      createdAt: now,
      updatedAt: now
    };
  });
  
  // Write transformed records to output CSV
  const outputPath = path.join(outputDir, `transformed_${filename}`);
  const outputContent = stringify(transformedRecords, { header: true });
  fs.writeFileSync(outputPath, outputContent);
  
  console.log(`Transformed ${transformedRecords.length} records and saved to ${outputPath}`);
  totalTransformed += transformedRecords.length;
});

console.log(`\n=== TRANSFORMATION COMPLETE ===`);
console.log(`Total records transformed: ${totalTransformed}`);
console.log(`Output files are in: ${outputDir}`);
console.log(`\nIMPORTANT: Before importing, update the values in the script with your actual IDs:`);
console.log(`1. userId: "${userId}" -> Your actual user ID`);
console.log(`2. accountId: Update checking and credit account IDs`);
console.log(`\nYou can now import these CSV files directly through Supabase Table Editor.`); 