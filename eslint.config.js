module.exports = [
  {
    ignores: [
      'node_modules/**', 
      'dist/**', 
      '.git/**', 
      '.yarn/**',
      '**/*.vue',
      '**/*.d.ts', 
      '**/types/**/*.ts',
      '**/services/**/*.ts',
      '**/middleware/**/*.ts',
      '**/middlewares/**/*.ts',
      '**/__tests__/**/*.ts',
      '**/test/**/*.ts'
    ],
  },
  {
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        module: 'readonly',
        process: 'readonly',
        console: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      'no-console': 'warn',
      'no-debugger': 'warn',
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
    },
  },
  {
    files: ['server/**/*.js', 'server/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
]; 