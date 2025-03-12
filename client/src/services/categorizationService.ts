import type { Transaction } from '@/types/transaction'
import type { AutoCategorizationResult } from '@/types/categorization'

// Simple in-memory storage for learned categorizations
const vendorMap = new Map<string, string>()
const categoryMap = new Map<string, { category: string; subcategory?: string }>()

const normalizeDescription = (description: string) => {
  return description.toLowerCase().trim()
}

const calculateConfidence = (matches: number): number => {
  // Simple confidence calculation based on number of matches
  return Math.min(matches / 2, 1)
}

export const categorizationService = {
  categorizeTransaction(input: { originalDescription: string }): AutoCategorizationResult {
    const normalizedDesc = normalizeDescription(input.originalDescription)
    const words = normalizedDesc.split(/\s+/)
    
    const result: AutoCategorizationResult = {
      vendor: [],
      categories: []
    }

    // Check for vendor matches
    vendorMap.forEach((vendor, pattern) => {
      if (normalizedDesc.includes(pattern)) {
        result.vendor.push({
          vendor,
          confidence: calculateConfidence(1)
        })
      }
    })

    // Check for category matches
    categoryMap.forEach((categorization, pattern) => {
      if (normalizedDesc.includes(pattern)) {
        result.categories.push({
          category: categorization.category,
          subcategory: categorization.subcategory,
          confidence: calculateConfidence(1)
        })
      }
    })

    return result
  },

  learnFromTransaction(transaction: Transaction) {
    if (!transaction.originalDescription) return

    const normalizedDesc = normalizeDescription(transaction.originalDescription)
    
    // Learn vendor mapping
    vendorMap.set(normalizedDesc, transaction.vendor)

    // Learn category mapping
    categoryMap.set(normalizedDesc, {
      category: transaction.category,
      subcategory: transaction.subcategory
    })
  }
} 