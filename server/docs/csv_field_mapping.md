# CSV to Transaction Table Field Mapping Guide

This document outlines how fields from the CSV testing files map to the Transaction table in the database.

## Field Mapping

| CSV Field      | Transaction Table Field | Data Type | Notes                                           |
|----------------|------------------------|-----------|------------------------------------------------|
| "Date"         | date                   | DateTime  | Format: MM/DD/YYYY → Convert to ISO format      |
| "Description"  | description            | String    | Can be cleaned or standardized                  |
| "Description"  | originalDescription    | String    | Store raw description for reference             |
| "Card Member"  | vendor                 | String    | Stores the card member/account holder           |
| "Account #"    | accountNumber          | String    | Bank account number (masked for security)       |
| "Amount"       | amount                 | Float     | Store as absolute value                         |
| N/A - Derived  | type                   | String    | Derive: "income" or "expense" based on amount and account type |
| "Category"     | category               | String    | Use provided category or default if not present |
| N/A - System   | id                     | UUID      | Generate new UUID for each transaction          |
| N/A - Required | userId                 | String    | User ID that owns the transaction               |
| N/A - Optional | accountId              | String    | Account ID in system (link to Account table)    |
| N/A - New      | source                 | String    | Set to "csv" for imported transactions          |
| N/A - New      | bankName               | String    | "American Express" or "Chase" based on Account # |
| N/A - System   | createdAt              | DateTime  | System timestamp at creation                    |
| N/A - System   | updatedAt              | DateTime  | System timestamp at last update                 |

## Type Determination Logic

The transaction **type** should be derived using this logic:

**For credit card accounts (Amex):**
- If Amount > 0: set type = "expense"
- If Amount < 0: set type = "income" (payment/refund)

**For checking accounts (Chase):**
- If Amount > 0: set type = "income"
- If Amount < 0: set type = "expense"

## Notes About Account Types

The CSV files contain these account types:
- Amex (American Express) - Account # = "-71002"
- Chase Checking - Various account numbers starting with "-"

## Field Transformation Examples

Example transformations:

```
CSV Record:
{
  "Date": "02/15/2025",
  "Description": "TRADER JOE S FRAMINGHAM",
  "Card Member": "testerFirstName testerLastName",
  "Account #": "-71002",
  "Amount": "80.43",
  "Category": "Groceries"
}

Transaction Record:
{
  "id": "[generated-uuid]",
  "amount": 80.43,
  "type": "expense",  // Expense because Amount > 0 and it's a credit card
  "category": "Groceries",
  "description": "TRADER JOE S FRAMINGHAM",
  "originalDescription": "TRADER JOE S FRAMINGHAM",
  "vendor": "testerFirstName testerLastName",
  "accountNumber": "-71002",
  "date": "2025-02-15T00:00:00.000Z",
  "userId": "[user-id]",
  "accountId": "[credit-account-id]",
  "source": "csv",
  "bankName": "American Express",
  "createdAt": "[current-timestamp]",
  "updatedAt": "[current-timestamp]"
} 