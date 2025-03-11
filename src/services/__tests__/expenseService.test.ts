import { describe, it, expect, vi, beforeEach } from 'vitest'
import { expenseService } from '../expenseService'
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { Expense } from '../../types/expense'

// Mock Firebase config
vi.mock('../firebase/config', () => ({
  db: { type: 'firestore' },
  storage: { type: 'storage' },
  app: { name: 'test-app' }
}))

// Mock Firestore
vi.mock('firebase/firestore', () => {
  const mockCollection = vi.fn((db, name) => ({ type: 'collection', name }))
  const mockQuery = vi.fn((collection, ...args) => ({ type: 'query', collection, args }))
  const mockOrderBy = vi.fn((field, direction) => ({ type: 'orderBy', field, direction }))
  const mockAddDoc = vi.fn()
  const mockGetDocs = vi.fn()
  
  return {
    collection: mockCollection,
    addDoc: mockAddDoc,
    getDocs: mockGetDocs,
    query: mockQuery,
    orderBy: mockOrderBy,
    Timestamp: {
      fromDate: vi.fn((date: Date) => ({
        toDate: () => date
      }))
    },
    getFirestore: vi.fn(() => ({ type: 'firestore' }))
  }
})

// Mock Storage
vi.mock('firebase/storage', () => {
  const mockRef = vi.fn((storage, path) => ({ type: 'ref', path }))
  const mockUploadBytes = vi.fn()
  const mockGetDownloadURL = vi.fn()
  
  return {
    ref: mockRef,
    uploadBytes: mockUploadBytes,
    getDownloadURL: mockGetDownloadURL,
    getStorage: vi.fn(() => ({ type: 'storage' }))
  }
})

describe('ExpenseService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('addExpense', () => {
    it('should add expense without receipt', async () => {
      const mockExpense: Expense = {
        amount: 50.00,
        description: 'Test expense',
        category: 'food',
        date: new Date('2024-03-10')
      }

      const mockDocRef = { id: 'test-doc-id' }
      ;(addDoc as any).mockResolvedValueOnce(mockDocRef)

      const result = await expenseService.addExpense(mockExpense)

      expect(collection).toHaveBeenCalledWith({ type: 'firestore' }, 'expenses')
      expect(addDoc).toHaveBeenCalledWith(
        { type: 'collection', name: 'expenses' },
        expect.objectContaining({
          amount: 50.00,
          description: 'Test expense',
          category: 'food',
          receipt: null
        })
      )
      expect(result).toBe('test-doc-id')
    })

    it('should add expense with receipt', async () => {
      const mockExpense: Expense = {
        amount: 75.00,
        description: 'Test with receipt',
        category: 'food',
        date: new Date('2024-03-10')
      }

      const mockFile = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' })
      const mockStorageRef = { type: 'ref', path: 'receipts/test.jpg' }
      const mockDownloadURL = 'https://example.com/receipt.jpg'
      const mockDocRef = { id: 'test-doc-id' }

      ;(ref as any).mockReturnValueOnce(mockStorageRef)
      ;(uploadBytes as any).mockResolvedValueOnce({})
      ;(getDownloadURL as any).mockResolvedValueOnce(mockDownloadURL)
      ;(addDoc as any).mockResolvedValueOnce(mockDocRef)

      const result = await expenseService.addExpense(mockExpense, mockFile)

      expect(ref).toHaveBeenCalledWith({ type: 'storage' }, expect.stringContaining('receipts/'))
      expect(uploadBytes).toHaveBeenCalledWith(mockStorageRef, mockFile)
      expect(getDownloadURL).toHaveBeenCalledWith(mockStorageRef)
      expect(addDoc).toHaveBeenCalledWith(
        { type: 'collection', name: 'expenses' },
        expect.objectContaining({
          receipt: mockDownloadURL
        })
      )
      expect(result).toBe('test-doc-id')
    })
  })

  describe('getExpenses', () => {
    it('should retrieve and format expenses correctly', async () => {
      const mockDate = new Date('2024-03-10')
      const mockDocs = [
        {
          id: 'expense-1',
          data: () => ({
            amount: 50.00,
            description: 'Test expense 1',
            category: 'food',
            date: { toDate: () => mockDate },
            receipt: null
          })
        },
        {
          id: 'expense-2',
          data: () => ({
            amount: 75.00,
            description: 'Test expense 2',
            category: 'transport',
            date: { toDate: () => mockDate },
            receipt: 'https://example.com/receipt.jpg'
          })
        }
      ]

      const mockQuery = { type: 'query', collection: { type: 'collection', name: 'expenses' } }
      ;(query as any).mockReturnValueOnce(mockQuery)
      ;(getDocs as any).mockResolvedValueOnce({ docs: mockDocs })

      const result = await expenseService.getExpenses()

      expect(query).toHaveBeenCalledWith(
        { type: 'collection', name: 'expenses' },
        { type: 'orderBy', field: 'date', direction: 'desc' }
      )
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        id: 'expense-1',
        amount: 50.00,
        description: 'Test expense 1',
        category: 'food',
        date: mockDate
      })
      expect(result[1]).toMatchObject({
        id: 'expense-2',
        amount: 75.00,
        description: 'Test expense 2',
        category: 'transport',
        date: mockDate,
        receipt: 'https://example.com/receipt.jpg'
      })
    })

    it('should handle empty expense list', async () => {
      const mockQuery = { type: 'query', collection: { type: 'collection', name: 'expenses' } }
      ;(query as any).mockReturnValueOnce(mockQuery)
      ;(getDocs as any).mockResolvedValueOnce({ docs: [] })

      const result = await expenseService.getExpenses()

      expect(result).toHaveLength(0)
      expect(Array.isArray(result)).toBe(true)
    })
  })
}) 