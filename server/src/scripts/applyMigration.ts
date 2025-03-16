import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';

async function applyMigration() {
  console.log('Applying database migration...');
  
  try {
    // Run Prisma migration
    const migrationName = 'add_category_change_log';
    const migrationCommand = `npx prisma migrate dev --name ${migrationName}`;
    
    console.log(`Running: ${migrationCommand}`);
    execSync(migrationCommand, { stdio: 'inherit' });
    
    console.log('Migration applied successfully!');
    
    // Generate Prisma client
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('Prisma client generated successfully!');
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration()
  .then(() => {
    console.log('Migration process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration process failed:', error);
    process.exit(1);
  }); 