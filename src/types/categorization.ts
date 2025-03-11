export interface CategorizationRule {
  id?: string
  pattern: string  // The pattern to match (e.g., "WM SUPERCENTER*")
  vendor: string   // The standardized vendor name (e.g., "Walmart")
  category: string // The category (e.g., "Groceries")
  subcategory?: string // Optional subcategory
  source?: string  // The bank/source that provided this transaction
  confidence: number // How confident we are in this match (0-1)
  userDefined: boolean // Whether this rule was created by the user
  lastUsed: Date  // When this rule was last applied
  useCount: number // How many times this rule has been used
}

export interface CategorySuggestion {
  category: string
  subcategory?: string
  confidence: number
  source: 'user' | 'pattern' | 'ml'
}

export interface VendorSuggestion {
  vendor: string
  confidence: number
  source: 'user' | 'pattern' | 'ml'
}

export interface AutoCategorizationResult {
  originalDescription: string
  vendor: VendorSuggestion[]
  categories: CategorySuggestion[]
  matchedRules: CategorizationRule[]
} 