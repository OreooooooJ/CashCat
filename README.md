# CashCat - Personal Finance Management Application

CashCat is a modern, full-stack personal finance management application built with Vue.js and Express.js. It helps users track expenses, manage budgets, and gain insights into their financial habits through intuitive visualizations.

## Features

- **User Authentication**: Secure login and registration system
- **Transaction Tracking**: Record and categorize income and expenses
- **Budget Management**: Create and monitor category-based budgets
- **Financial Dashboard**: Visualize spending patterns and financial health
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **CSV Import**: Import transactions from bank and credit card statements

## Tech Stack

### Frontend
- **Vue 3**: Progressive JavaScript framework with Composition API
- **TypeScript**: Type-safe JavaScript
- **Pinia**: State management
- **Vue Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Chart.js**: Data visualization
- **Vee-Validate**: Form validation

### Server
- **Express.js**: Node.js web application framework
- **TypeScript**: Type-safe JavaScript
- **Prisma**: ORM for database access
- **SQLite**: Development database (PostgreSQL in production)
- **JWT**: Authentication
- **Zod**: Schema validation

### Testing & Quality
- **Vitest**: Unit and integration testing
- **ESLint**: Code linting
- **TypeScript**: Static type checking

## Project Structure

```
/
├── client/                  # Frontend code (Vue.js)
│   ├── src/
│   │   ├── assets/         # Static assets
│   │   ├── components/     # Vue components
│   │   ├── layouts/        # Layout components
│   │   ├── router/         # Vue Router configuration
│   │   ├── stores/         # Pinia stores
│   │   ├── types/          # Frontend-specific types
│   │   ├── views/          # Vue views/pages
│   │   ├── App.vue         # Root component
│   │   └── main.ts         # Frontend entry point
│   ├── public/             # Public static files
│   ├── vitest.setup.ts     # Test setup
│   └── vite.config.ts      # Vite configuration
│
├── server/                  # Server code (Express.js)
│   ├── src/
│   │   ├── routes/         # Route definitions
│   │   ├── middlewares/    # Express middlewares
│   │   ├── services/       # Service layer
│   │   └── app.ts          # Express app
│   ├── tests/              # Server tests
│   └── prisma/             # Prisma schema and migrations
│
└── shared/                 # Shared code
    └── types/             # Shared type definitions
```

## How to Run

This project uses Yarn Workspaces to manage multiple packages in a monorepo structure.

### Project Structure
- `client/`: Vue.js frontend application
- `server/`: Express.js backend API
- `shared-types/`: Shared TypeScript types

### Installation
```bash
# Install all dependencies for all workspaces
yarn install
```

### Development
```bash
# Run both client and server in development mode
yarn dev

# Run only the client
yarn workspace client dev
# Or using the shorthand
yarn dev:client

# Run only the server
yarn workspace server dev
# Or using the shorthand
yarn dev:server
```

### Building
```bash
# Build all workspaces
yarn build

# Build individual workspaces
yarn workspace client build
yarn workspace server build
yarn workspace shared-types build

# Or using the shorthands
yarn build:client
yarn build:server
yarn build:shared
```

## Development Setup

### Prerequisites
- Node.js (v20 or higher)
- Yarn (v4.1.1 or higher)
- PostgreSQL (for production)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/OreooooooJ/CashCat.git
   cd CashCat
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit the `.env` file with your configuration.

4. Set up the database:
   ```bash
   cd server && yarn prisma:migrate
   ```

5. Start development servers:
   ```bash
   yarn dev
   ```

   This will start both the frontend and server:
   - Frontend: http://localhost:5173
   - Server: http://localhost:3000

## Testing

Run all tests:
```bash
yarn test
```

Watch mode for frontend tests:
```bash
yarn test:watch
```

Generate coverage report:
```bash
yarn test:coverage
```

## Database Management

Generate Prisma client:
```bash
cd server && yarn prisma:generate
```

Run migrations:
```bash
cd server && yarn prisma:migrate
```

Open Prisma Studio (database GUI):
```bash
cd server && yarn prisma:studio
```

## CSV Transaction Import

CashCat supports importing transactions from CSV files exported from banks and credit card providers.

### Import from CSV

To import transactions from CSV files:

1. Place your CSV files in the `resources` directory with the following naming conventions:
   - `Chase_checking1.csv` or `Chase_checking2.csv` for checking accounts
   - `amexMonthlyStatement.csv` for credit card statements

2. Run the import script:
```bash
cd server && yarn seed:transactions:csv
```

The script will:
- Automatically detect the appropriate account type based on the filename
- Parse dates, amounts, and categories
- Format transaction data consistently
- Insert transactions into the database

### Testing CSV Processing

To test CSV parsing without database connections:

```bash
cd server && yarn test:csv-parser
```

To test the full pre-processing pipeline that prepares transactions for staging:

```bash
cd server && yarn test:csv-staging
```

These test scripts will:
- Process the CSV files in the `resources` directory
- Show detailed transaction breakdowns by category and type
- Display sample transactions with formatted data
- Verify that amounts, dates, and categories are correctly processed

### CSV Format Support

Currently supported CSV formats:
- Chase Bank checking accounts
- American Express credit card statements

All CSV files should have the following columns:
- `Date`: Transaction date in MM/DD/YYYY format
- `Description`: Transaction description
- `Card Member`: Card member or account holder name
- `Account #`: Account number (masked)
- `Amount`: Transaction amount (positive for income/expenses depending on account type)
- `Category`: Transaction category (optional)

### Staging Transaction Process

The CSV import follows a two-step process:
1. **Import to Staging**: CSV data is parsed and imported to a staging area where it can be reviewed
2. **Process from Staging**: Approved transactions are moved from staging to the main transaction table

This approach allows for data verification before final import and helps prevent duplicate transactions.

## Future Plans

- **Mobile App**: Develop a mobile application using React Native
- **Data Import/Export**: Support for importing and exporting financial data
- **Financial Goals**: Set and track financial goals
- **Recurring Transactions**: Support for recurring income and expenses
- **Multi-currency Support**: Handle multiple currencies and exchange rates
- **Reports and Analytics**: Advanced financial reports and insights
- **Dark Mode**: Support for dark mode UI
- **Notifications**: Reminders for bills and budget alerts

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
