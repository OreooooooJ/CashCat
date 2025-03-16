import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CategoryChangePattern {
  description: string;
  originalCategory: string;
  newCategory: string;
  count: number;
}

async function analyzeCategoryChanges() {
  try {
    console.log('Analyzing category change patterns...');
    
    // Get all category change logs with transaction details
    const logs = await prisma.categoryChangeLog.findMany({
      include: {
        transaction: true,
      },
    });
    
    console.log(`Found ${logs.length} category change logs.`);
    
    if (logs.length === 0) {
      console.log('No category changes to analyze.');
      return;
    }
    
    // Group changes by description and count occurrences
    const patterns: Record<string, CategoryChangePattern> = {};
    
    for (const log of logs) {
      const description = log.transaction.description || '';
      const key = `${description}|${log.previousCategory}|${log.newCategory}`;
      
      if (!patterns[key]) {
        patterns[key] = {
          description,
          originalCategory: log.previousCategory,
          newCategory: log.newCategory,
          count: 0,
        };
      }
      
      patterns[key].count++;
    }
    
    // Sort patterns by count (most frequent first)
    const sortedPatterns = Object.values(patterns).sort((a, b) => b.count - a.count);
    
    console.log('\nMost common category changes:');
    console.log('-----------------------------');
    
    sortedPatterns.forEach((pattern, index) => {
      if (index < 20) { // Show top 20 patterns
        console.log(`${pattern.count} changes: "${pattern.description}" from "${pattern.originalCategory}" to "${pattern.newCategory}"`);
      }
    });
    
    // Generate keyword suggestions
    console.log('\nSuggested keyword mapping updates:');
    console.log('--------------------------------');
    
    const suggestions: Record<string, string[]> = {};
    
    for (const pattern of sortedPatterns) {
      if (pattern.count >= 3) { // Only consider patterns with at least 3 occurrences
        const words = pattern.description
          .toUpperCase()
          .split(/\s+/)
          .filter(word => word.length > 3); // Only consider words with more than 3 characters
        
        if (!suggestions[pattern.newCategory]) {
          suggestions[pattern.newCategory] = [];
        }
        
        for (const word of words) {
          if (!suggestions[pattern.newCategory].includes(word)) {
            suggestions[pattern.newCategory].push(word);
          }
        }
      }
    }
    
    for (const [category, keywords] of Object.entries(suggestions)) {
      console.log(`${category}: ${keywords.join(', ')}`);
    }
    
  } catch (error) {
    console.error('Error analyzing category changes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeCategoryChanges()
  .then(() => {
    console.log('\nAnalysis completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Analysis failed:', error);
    process.exit(1);
  }); 