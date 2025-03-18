#!/bin/bash

# Stop execution on error
set -e

echo "Starting database update and import process..."

# Apply database migrations
echo "Applying migrations..."
npx prisma migrate deploy

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  yarn install
fi

# Build TypeScript files
echo "Building TypeScript files..."
yarn build

# Run the import script
echo "Importing CSV data..."
yarn ts-node scripts/importCsvToTransactions.ts

echo "Process completed successfully!" 