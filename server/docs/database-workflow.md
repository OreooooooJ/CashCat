# Database Workflow with Supabase and Prisma

This document outlines the recommended workflow for working with the Supabase database in the CashCat application.

## Overview

CashCat uses Supabase as the PostgreSQL database provider and Prisma as the ORM. The database is configured to persist data between development restarts, ensuring a consistent development experience.

## Connection Configuration

The database connection is configured in the `.env` file with the following variables:

```
DATABASE_URL="postgres://postgres:[PASSWORD]@db.ynstjlopxglqephaqhlc.supabase.co:6543/postgres?pgbouncer=true"
```

This connection string uses the Supabase connection pooler (port 6543) with pgbouncer enabled.

## Schema Management

### Non-Destructive Schema Updates

To apply schema changes without dropping existing data, use:

```bash
yarn prisma db push
```

This command applies any changes in your `schema.prisma` file to the database without creating migrations or dropping data.

### When to Use Migrations

In production environments or when you need to track schema changes, use:

```bash
yarn prisma migrate dev --name [migration-name]
```

**Note:** Be cautious with migrations as they can reset data in development. Prefer `db push` for development work.

## Data Seeding

### Main Seed Script

The main seed script creates test users, accounts, transactions, and budgets:

```bash
yarn seed
```

**Warning:** This script clears existing data before seeding. Use with caution.

### Staging Transaction Seed Script

For testing the CSV import functionality, a separate seed script is available that populates only the staging transactions table:

```bash
yarn seed:staging
```

This script depends on the main seed script having been run first, as it requires users and accounts to exist.

## Development Guidelines

1. **Avoid Automatic Resets:**
   - Do not include database reset commands in your development workflow
   - Use `prisma db push` instead of `prisma migrate dev` during development

2. **Manual Seeding Only:**
   - Only run seed scripts manually when needed
   - Do not configure automatic seeding on every restart

3. **Data Persistence:**
   - The database should maintain data between development restarts
   - Verify data persistence using Prisma Studio: `yarn prisma studio`

4. **GitHub Actions:**
   - CI/CD pipelines should use a separate test database
   - Avoid commands that reset the production or development database

## Troubleshooting

If you encounter issues with the database connection:

1. Verify your `.env` file has the correct connection string
2. Ensure your IP address is allowed in the Supabase dashboard
3. Check that the database server is running
4. Try using the direct connection (port 5432) instead of the connection pooler

## Testing

When running tests:

1. Use a separate test database or in-memory database
2. Ensure tests clean up after themselves
3. Do not use the production or development database for automated tests 