import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/vue'
import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(),
}

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date }),
  },
}))

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}))

beforeAll(() => {
  global.localStorage = localStorageMock
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  localStorage.clear()
})

afterAll(() => {
  vi.resetAllMocks()
}) 