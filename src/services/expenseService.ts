import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  DocumentData,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'
import type { Expense } from '../types/expense'

const COLLECTION_NAME = 'expenses'

export const expenseService = {
  async addExpense(expense: Expense, receiptFile?: File): Promise<string> {
    // Handle receipt upload if provided
    let receiptUrl = ''
    if (receiptFile) {
      const storageRef = ref(storage, `receipts/${Date.now()}-${receiptFile.name}`)
      await uploadBytes(storageRef, receiptFile)
      receiptUrl = await getDownloadURL(storageRef)
    }

    // Add expense to Firestore
    const expenseData = {
      ...expense,
      date: Timestamp.fromDate(expense.date),
      receipt: receiptUrl || null,
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), expenseData)
    return docRef.id
  },

  async getExpenses(): Promise<Expense[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as DocumentData
      return {
        id: doc.id,
        ...data,
        date: (data.date as Timestamp).toDate(),
      } as Expense
    })
  },
} 