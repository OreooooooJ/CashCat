
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';

const prisma = new PrismaClient();

async function confirmDeleteDuplicates() {
  try {
    // Read IDs from file
    const data = await fs.readFile('./scripts/duplicate-ids.json', 'utf8');
    const idsToDelete = JSON.parse(data);
    
    console.log(`Deleting ${idsToDelete.length} duplicate transactions...`);
    
    // Delete transactions in batches
    const batchSize = 10;
    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize);
      await prisma.transaction.deleteMany({
        where: {
          id: {
            in: batch
          }
        }
      });
      console.log(`Deleted batch ${i/batchSize + 1} of ${Math.ceil(idsToDelete.length/batchSize)}`);
    }
    
    console.log('Duplicate transactions deleted successfully.');
    
    // Clean up the temporary file
    await fs.unlink('./scripts/duplicate-ids.json');
    
  } catch (error) {
    console.error('Error deleting duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

confirmDeleteDuplicates();
      