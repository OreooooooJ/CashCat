/**
 * DEVELOPMENT/TESTING ONLY
 * 
 * This file contains mock account and transaction data for development and testing purposes.
 * It should not be imported in production code.
 */

import type { Transaction } from '@/types/transaction'

export interface Account {
  id: string
  name: string
  type: 'debit' | 'credit'
  balance: number
  institution: string
  lastFour: string
  color: string
}

export const categoryColors = {
  Income: '#10B981',
  'Bills & Utilities': '#3B82F6',
  'Food & Dining': '#F59E0B',
  Transportation: '#8B5CF6',
  Shopping: '#EC4899',
  Entertainment: '#6366F1',
  'Health & Fitness': '#14B8A6',
  Travel: '#F97316',
  Other: '#6B7280'
} as const

export const subcategoryIcons = {
  Groceries: '🛒',
  Restaurants: '🍽️',
  'Coffee Shops': '☕',
  'Fast Food': '🍔',
  Utilities: '💡',
  Internet: '🌐',
  'Phone Bill': '📱',
  'Public Transit': '🚌',
  'Gas & Fuel': '⛽',
  Parking: '🅿️',
  Clothing: '👕',
  Electronics: '📱',
  'Home Decor': '🏠',
  Movies: '🎬',
  'Video Games': '🎮',
  Concerts: '🎵',
  Gym: '💪',
  'Doctor Visits': '👨‍⚕️',
  Pharmacy: '💊',
  Hotels: '🏨',
  Flights: '✈️',
  'Car Rental': '🚗'
} as const

const mockAccounts: Account[] = [
  {
    id: 'acc1',
    name: 'Main Checking',
    type: 'debit',
    balance: 5432.10,
    institution: 'Big Bank',
    lastFour: '1234',
    color: '#3B82F6'
  },
  {
    id: 'acc2',
    name: 'Savings',
    type: 'debit',
    balance: 12543.87,
    institution: 'Big Bank',
    lastFour: '5678',
    color: '#10B981'
  },
  {
    id: 'acc3',
    name: 'Credit Card',
    type: 'credit',
    balance: -1234.56,
    institution: 'Credit Corp',
    lastFour: '9012',
    color: '#EF4444'
  }
]

export const mockTransactions: Transaction[] = [
  {
    id: 't1',
    amount: 3500,
    vendor: 'Tech Corp',
    category: 'Income',
    subcategory: undefined,
    date: new Date('2024-03-01'),
    accountId: 'acc1',
    originalDescription: 'TECH CORP PAYROLL',
    isAutoCategorized: true
  },
  {
    id: 't2',
    amount: -85.43,
    vendor: 'Whole Foods',
    category: 'Food & Dining',
    subcategory: 'Groceries',
    date: new Date('2024-03-02'),
    accountId: 'acc1',
    originalDescription: 'WHOLE FOODS MARKET',
    isAutoCategorized: true
  },
  {
    id: 't3',
    amount: -45.99,
    vendor: 'Netflix',
    category: 'Entertainment',
    subcategory: undefined,
    date: new Date('2024-03-03'),
    accountId: 'acc3',
    originalDescription: 'NETFLIX.COM',
    isAutoCategorized: true
  },
  {
    id: 't4',
    amount: -32.50,
    vendor: 'Shell',
    category: 'Transportation',
    subcategory: 'Gas & Fuel',
    date: new Date('2024-03-04'),
    accountId: 'acc3',
    originalDescription: 'SHELL OIL',
    isAutoCategorized: true
  },
  {
    id: 't5',
    amount: -125.00,
    vendor: 'Power & Light Co',
    category: 'Bills & Utilities',
    subcategory: 'Utilities',
    date: new Date('2024-03-05'),
    accountId: 'acc1',
    originalDescription: 'POWER & LIGHT AUTOPAY',
    isAutoCategorized: true
  }
]

export const getMockData = () => {
  return {
    accounts: mockAccounts,
    transactions: mockTransactions
  }
} 