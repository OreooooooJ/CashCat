import { describe, it, expect } from 'vitest';
import { 
  toTitleCase, 
  formatAmount, 
  formatDescription, 
  formatCategory,
  standardizeTransaction,
  standardizeStagingTransaction
} from '../src/utils/formatUtils';

describe('Format Utils', () => {
  describe('toTitleCase', () => {
    it('should convert a string to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
      expect(toTitleCase('HELLO WORLD')).toBe('Hello World');
      expect(toTitleCase('hello WORLD')).toBe('Hello World');
      expect(toTitleCase('hElLo WoRlD')).toBe('Hello World');
    });

    it('should handle empty strings', () => {
      expect(toTitleCase('')).toBe('');
      expect(toTitleCase(null as any)).toBe('');
      expect(toTitleCase(undefined as any)).toBe('');
    });
  });

  describe('formatAmount', () => {
    it('should format a number to have 2 decimal places', () => {
      expect(formatAmount(123.456)).toBe(123.46);
      expect(formatAmount(123.45)).toBe(123.45);
      expect(formatAmount(123.4)).toBe(123.40);
      expect(formatAmount(123)).toBe(123.00);
    });

    it('should handle negative numbers', () => {
      expect(formatAmount(-123.456)).toBe(-123.46);
      expect(formatAmount(-123.45)).toBe(-123.45);
      expect(formatAmount(-123.4)).toBe(-123.40);
      expect(formatAmount(-123)).toBe(-123.00);
    });

    it('should handle zero', () => {
      expect(formatAmount(0)).toBe(0.00);
    });
  });

  describe('formatDescription', () => {
    it('should format a description string', () => {
      expect(formatDescription('hello world')).toBe('Hello World');
      expect(formatDescription('HELLO WORLD')).toBe('Hello World');
      expect(formatDescription('  hello   world  ')).toBe('Hello World');
    });

    it('should handle empty strings', () => {
      expect(formatDescription('')).toBe('');
      expect(formatDescription(null as any)).toBe('');
      expect(formatDescription(undefined as any)).toBe('');
    });
  });

  describe('formatCategory', () => {
    it('should format a category string', () => {
      expect(formatCategory('food & dining')).toBe('Food & Dining');
      expect(formatCategory('FOOD & DINING')).toBe('Food & Dining');
      expect(formatCategory('Food & Dining')).toBe('Food & Dining');
    });

    it('should handle empty strings', () => {
      expect(formatCategory('')).toBe('');
      expect(formatCategory(null as any)).toBe('');
      expect(formatCategory(undefined as any)).toBe('');
    });
  });

  describe('standardizeTransaction', () => {
    it('should standardize a transaction object', () => {
      const transaction = {
        amount: 123.456,
        type: 'EXPENSE',
        category: 'food & dining',
        description: 'GROCERY SHOPPING',
        date: new Date('2023-01-01'),
        userId: 'user-1',
        accountId: 'account-1',
      };

      const standardized = standardizeTransaction(transaction);

      expect(standardized).toEqual({
        amount: 123.46,
        type: 'expense',
        category: 'Food & Dining',
        description: 'Grocery Shopping',
        date: transaction.date,
        userId: 'user-1',
        accountId: 'account-1',
      });
    });

    it('should handle missing fields', () => {
      const transaction = {
        amount: 123.456,
        type: 'EXPENSE',
        userId: 'user-1',
        accountId: 'account-1',
      };

      const standardized = standardizeTransaction(transaction);

      expect(standardized).toEqual({
        amount: 123.46,
        type: 'expense',
        category: '',
        description: '',
        userId: 'user-1',
        accountId: 'account-1',
      });
    });
  });

  describe('standardizeStagingTransaction', () => {
    it('should standardize a staging transaction object', () => {
      const transaction = {
        amount: 123.456,
        type: 'EXPENSE',
        category: 'food & dining',
        description: 'GROCERY SHOPPING',
        date: new Date('2023-01-01'),
        bankName: 'BANK OF AMERICA',
        source: 'CSV',
        userId: 'user-1',
        accountId: 'account-1',
        rawData: '{"date":"2023-01-01","amount":"123.456","description":"GROCERY SHOPPING"}',
      };

      const standardized = standardizeStagingTransaction(transaction);

      expect(standardized).toEqual({
        amount: 123.46,
        type: 'expense',
        category: 'Food & Dining',
        description: 'Grocery Shopping',
        date: transaction.date,
        bankName: 'Bank Of America',
        source: 'csv',
        userId: 'user-1',
        accountId: 'account-1',
        rawData: '{"date":"2023-01-01","amount":"123.456","description":"GROCERY SHOPPING"}',
      });
    });

    it('should handle missing fields', () => {
      const transaction = {
        amount: 123.456,
        type: 'EXPENSE',
        userId: 'user-1',
        accountId: 'account-1',
        rawData: '{"date":"2023-01-01","amount":"123.456"}',
      };

      const standardized = standardizeStagingTransaction(transaction);

      expect(standardized).toEqual({
        amount: 123.46,
        type: 'expense',
        category: '',
        description: '',
        userId: 'user-1',
        accountId: 'account-1',
        source: '',
        rawData: '{"date":"2023-01-01","amount":"123.456"}',
      });
    });
  });
}); 