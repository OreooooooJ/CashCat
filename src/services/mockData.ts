import type { Transaction } from '../types/transaction'

export interface Account {
  id: string
  name: string
  type: 'credit' | 'debit' | 'cash'
  institution: string
  lastFour: string
  balance: number
  color: string
}

// Vendor recognition patterns for auto-categorization
export interface VendorPattern {
  pattern: string
  vendor: string
  category: string
  subcategory?: string
}

export const vendorPatterns: VendorPattern[] = [
  { pattern: 'WM SUPERCENTER', vendor: 'Walmart', category: 'Shopping', subcategory: 'Groceries' },
  {
    pattern: 'APPLE.COM',
    vendor: 'Apple',
    category: 'Bills & Utilities',
    subcategory: 'Subscriptions',
  },
  {
    pattern: 'STARBUCKS',
    vendor: 'Starbucks',
    category: 'Food & Dining',
    subcategory: 'Coffee Shops',
  },
  { pattern: 'MTA*', vendor: 'MTA NYC', category: 'Transportation', subcategory: 'Public Transit' },
  { pattern: 'AMZN', vendor: 'Amazon', category: 'Shopping', subcategory: 'Online Shopping' },
  { pattern: 'VENMO', vendor: 'Venmo', category: 'Transfer', subcategory: 'Personal Transfer' },
  {
    pattern: 'NETFLIX',
    vendor: 'Netflix',
    category: 'Bills & Utilities',
    subcategory: 'Streaming Services',
  },
  {
    pattern: 'WHOLE FOODS',
    vendor: 'Whole Foods',
    category: 'Food & Dining',
    subcategory: 'Groceries',
  },
  {
    pattern: 'TRADER JOE',
    vendor: "Trader Joe's",
    category: 'Food & Dining',
    subcategory: 'Groceries',
  },
  { pattern: 'SHELL', vendor: 'Shell', category: 'Transportation', subcategory: 'Gas & Fuel' },
]

const accounts: Account[] = [
  {
    id: 'boa-checking',
    name: 'Bank of America Checking',
    type: 'debit',
    institution: 'Bank of America',
    lastFour: '4832',
    balance: 3250.45,
    color: '#E31837', // BofA red
  },
  {
    id: 'chase-checking',
    name: 'Chase Total Checking',
    type: 'debit',
    institution: 'Chase',
    lastFour: '7645',
    balance: 5670.82,
    color: '#117ACA', // Chase blue
  },
  {
    id: 'amex-plat',
    name: 'Amex Platinum',
    type: 'credit',
    institution: 'American Express',
    lastFour: '3456',
    balance: -2430.5,
    color: '#006FCF', // Amex blue
  },
  {
    id: 'chase-sapphire',
    name: 'Chase Sapphire Reserve',
    type: 'credit',
    institution: 'Chase',
    lastFour: '8832',
    balance: -1875.23,
    color: '#0B121F', // Sapphire dark blue
  },
]

const mockTransactions: Transaction[] = [
  // Groceries & Food
  {
    id: 't1',
    amount: -184.52,
    vendor: 'Whole Foods Market',
    originalDescription: 'WHOLE FOODS MKT #123',
    category: 'Food & Dining',
    subcategory: 'Groceries',
    date: new Date('2024-03-09'),
    accountId: 'chase-sapphire',
    description: 'Weekly grocery shopping',
    isAutoCategorized: true,
  },
  {
    id: 't2',
    amount: -95.67,
    vendor: "Trader Joe's",
    originalDescription: "TRADER JOE'S #234",
    category: 'Food & Dining',
    subcategory: 'Groceries',
    date: new Date('2024-03-07'),
    accountId: 'boa-checking',
    description: 'Organic produce and snacks',
    isAutoCategorized: true,
  },

  // Bills & Utilities
  {
    id: 't3',
    amount: -145.32,
    vendor: 'PG&E',
    originalDescription: 'PG&E PAYMENT',
    category: 'Bills & Utilities',
    subcategory: 'Utilities',
    date: new Date('2024-03-05'),
    accountId: 'chase-checking',
    description: 'Monthly electricity bill',
    isAutoCategorized: true,
  },
  {
    id: 't4',
    amount: -89.99,
    vendor: 'Netflix',
    originalDescription: 'NETFLIX.COM',
    category: 'Bills & Utilities',
    subcategory: 'Streaming Services',
    date: new Date('2024-03-04'),
    accountId: 'boa-checking',
    description: 'Monthly subscription',
    isAutoCategorized: true,
  },

  // Transportation
  {
    id: 't5',
    amount: -65.43,
    vendor: 'Shell',
    originalDescription: 'SHELL OIL 12345',
    category: 'Transportation',
    subcategory: 'Gas & Fuel',
    date: new Date('2024-03-08'),
    accountId: 'amex-plat',
    description: 'Gas',
    isAutoCategorized: true,
  },
  {
    id: 't6',
    amount: -125.0,
    vendor: 'MTA NYC',
    originalDescription: 'MTA*METROCARD NYC',
    category: 'Transportation',
    subcategory: 'Public Transit',
    date: new Date('2024-03-01'),
    accountId: 'chase-sapphire',
    description: 'Monthly transit pass',
    isAutoCategorized: true,
  },

  // Food & Dining
  {
    id: 't7',
    amount: -98.45,
    vendor: 'Cheesecake Factory',
    originalDescription: 'THE CHEESECAKE F',
    category: 'Food & Dining',
    subcategory: 'Restaurants',
    date: new Date('2024-03-08'),
    accountId: 'chase-sapphire',
    description: 'Family dinner',
    isAutoCategorized: true,
  },
  {
    id: 't8',
    amount: -12.5,
    vendor: 'Starbucks',
    originalDescription: 'STARBUCKS STORE #543',
    category: 'Food & Dining',
    subcategory: 'Coffee Shops',
    date: new Date('2024-03-09'),
    accountId: 'amex-plat',
    description: 'Coffee and pastry',
    isAutoCategorized: true,
  },

  // Shopping
  {
    id: 't9',
    amount: -189.99,
    vendor: 'Target',
    originalDescription: 'TARGET STORE 1234',
    category: 'Shopping',
    subcategory: 'Department Stores',
    date: new Date('2024-03-06'),
    accountId: 'chase-sapphire',
    description: 'Household items and clothes',
    isAutoCategorized: true,
  },
  {
    id: 't10',
    amount: -79.99,
    vendor: 'Amazon',
    originalDescription: 'AMZN Mktp US*1X2Y3Z',
    category: 'Shopping',
    subcategory: 'Online Shopping',
    date: new Date('2024-03-03'),
    accountId: 'amex-plat',
    description: 'Kids school supplies',
    isAutoCategorized: true,
  },

  // Income
  {
    id: 't11',
    amount: 3850.0,
    vendor: 'Tech Corp Inc',
    originalDescription: 'TECH CORP INC PAYROLL',
    category: 'Income',
    subcategory: 'Salary',
    date: new Date('2024-03-01'),
    accountId: 'chase-checking',
    description: 'Bi-weekly salary',
    isAutoCategorized: true,
  },
  {
    id: 't12',
    amount: 2950.0,
    vendor: 'Healthcare Ltd',
    originalDescription: 'HEALTHCARE LTD PAYROLL',
    category: 'Income',
    subcategory: 'Salary',
    date: new Date('2024-03-01'),
    accountId: 'boa-checking',
    description: 'Bi-weekly salary',
    isAutoCategorized: true,
  },
]

export const getMockData = () => {
  return {
    accounts,
    transactions: mockTransactions,
  }
}

export const categoryColors = {
  Income: '#2E7D32', // Dark green
  'Food & Dining': '#D81B60', // Pink
  'Bills & Utilities': '#FFA000', // Amber
  Transportation: '#5E35B1', // Deep Purple
  Shopping: '#00796B', // Teal
  Entertainment: '#F4511E', // Deep Orange
  Healthcare: '#0097A7', // Cyan
  Education: '#8D6E63', // Brown
  Transfer: '#757575', // Grey
  Other: '#9E9E9E', // Light Grey
}

export const subcategoryIcons = {
  Groceries: '🛒',
  Restaurants: '🍽️',
  'Coffee Shops': '☕',
  Utilities: '💡',
  'Streaming Services': '📺',
  Subscriptions: '📱',
  'Gas & Fuel': '⛽',
  'Public Transit': '🚇',
  'Online Shopping': '🛍️',
  'Department Stores': '🏬',
  Salary: '💰',
  'Personal Transfer': '↔️',
}
