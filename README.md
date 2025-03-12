# CashCat

A personal finance management application built with Vue.js and Express.js.

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
│   └── public/             # Public static files
│
├── server/                  # Backend code (Express.js)
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # Route definitions
│   │   ├── middlewares/    # Express middlewares
│   │   ├── services/       # Service layer
│   │   ├── types/          # Backend-specific types
│   │   └── app.ts          # Express app
│   └── tests/              # Backend tests
│
├── database/               # Database-related code
│   └── prisma/            # Prisma schema and migrations
│
└── shared/                # Shared code
    └── types/            # Shared type definitions
```

## Development Setup

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start development servers:
   ```bash
   yarn dev
   ```

   This will start both the frontend and backend servers:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

## Testing

Run tests:
```bash
yarn test
```

Watch mode:
```bash
yarn test:watch
```

Coverage report:
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

Open Prisma Studio:
```bash
cd server && yarn prisma:studio
```
