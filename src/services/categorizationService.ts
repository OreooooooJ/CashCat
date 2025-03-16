import type {
  CategorizationRule,
  CategorySuggestion,
  VendorSuggestion,
  AutoCategorizationResult,
} from '../types/categorization'
import type { Transaction } from '../types/transaction'

class CategorizationService {
  private rules: CategorizationRule[] = []
  private readonly defaultConfidence = 0.8

  constructor() {
    // Load rules from storage
    this.loadRules()
  }

  private loadRules(): void {
    const savedRules = localStorage.getItem('categorizationRules')
    if (savedRules) {
      this.rules = JSON.parse(savedRules).map((rule: Partial<CategorizationRule>) => ({
        ...rule,
        lastUsed: new Date(rule.lastUsed || Date.now()),
      }))
    }
  }

  private saveRules(): void {
    localStorage.setItem('categorizationRules', JSON.stringify(this.rules))
  }

  private matchPattern(text: string, pattern: string): boolean {
    // Convert glob-style pattern to regex
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
    return new RegExp(regexPattern, 'i').test(text)
  }

  private findMatchingRules(description: string, source?: string): CategorizationRule[] {
    return this.rules
      .filter(rule => {
        const matches = this.matchPattern(description, rule.pattern)
        return matches && (!source || !rule.source || rule.source === source)
      })
      .sort((a, b) => {
        // Prioritize user-defined rules
        if (a.userDefined !== b.userDefined) {
          return a.userDefined ? -1 : 1
        }
        // Then by confidence
        if (a.confidence !== b.confidence) {
          return b.confidence - a.confidence
        }
        // Then by usage count
        if (a.useCount !== b.useCount) {
          return b.useCount - a.useCount
        }
        // Finally by how recently used
        return b.lastUsed.getTime() - a.lastUsed.getTime()
      })
  }

  addRule(
    pattern: string,
    vendor: string,
    category: string,
    subcategory?: string,
    source?: string
  ): CategorizationRule {
    const rule: CategorizationRule = {
      pattern,
      vendor,
      category,
      subcategory,
      source,
      confidence: this.defaultConfidence,
      userDefined: true,
      lastUsed: new Date(),
      useCount: 1,
    }

    this.rules.push(rule)
    this.saveRules()
    return rule
  }

  updateRule(ruleId: string, updates: Partial<CategorizationRule>): void {
    const index = this.rules.findIndex(r => r.id === ruleId)
    if (index !== -1) {
      this.rules[index] = {
        ...this.rules[index],
        ...updates,
        lastUsed: new Date(),
      }
      this.saveRules()
    }
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId)
    this.saveRules()
  }

  categorizeTransaction(transaction: Partial<Transaction>): AutoCategorizationResult {
    if (!transaction.originalDescription) {
      return {
        originalDescription: transaction.originalDescription || '',
        vendor: [],
        categories: [],
        matchedRules: [],
      }
    }

    const matchedRules = this.findMatchingRules(
      transaction.originalDescription,
      transaction.accountId
    )

    // Group suggestions by vendor and category
    const vendorMap = new Map<string, VendorSuggestion>()
    const categoryMap = new Map<string, CategorySuggestion>()

    matchedRules.forEach(rule => {
      // Update rule usage
      rule.useCount++
      rule.lastUsed = new Date()

      // Aggregate vendor suggestions
      const vendorKey = rule.vendor.toLowerCase()
      if (!vendorMap.has(vendorKey)) {
        vendorMap.set(vendorKey, {
          vendor: rule.vendor,
          confidence: rule.confidence,
          source: rule.userDefined ? 'user' : 'pattern',
        })
      }

      // Aggregate category suggestions
      const categoryKey = `${rule.category}|${rule.subcategory || ''}`
      if (!categoryMap.has(categoryKey)) {
        categoryMap.set(categoryKey, {
          category: rule.category,
          subcategory: rule.subcategory,
          confidence: rule.confidence,
          source: rule.userDefined ? 'user' : 'pattern',
        })
      }
    })

    this.saveRules() // Save updated usage stats

    return {
      originalDescription: transaction.originalDescription,
      vendor: Array.from(vendorMap.values()),
      categories: Array.from(categoryMap.values()),
      matchedRules,
    }
  }

  learnFromTransaction(transaction: Transaction): void {
    if (!transaction.originalDescription) return

    // Create a new rule from this transaction
    this.addRule(
      this.generatePattern(transaction.originalDescription),
      transaction.vendor,
      transaction.category,
      transaction.subcategory,
      transaction.accountId
    )
  }

  private generatePattern(description: string): string {
    // Convert the description into a pattern
    // This is a simplified version - you might want to make this smarter
    return description
      .replace(/[0-9]+/g, '*') // Replace numbers with wildcards
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  getRules(): CategorizationRule[] {
    return this.rules
  }
}

// Create a singleton instance
export const categorizationService = new CategorizationService()
