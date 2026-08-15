import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // 1. Global ignores for build artifacts and generated files
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/generated/**',
      '**/.agents/**',
    ],
  },

  // 2. Base JavaScript rules & Node globals
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // 3. Recommended TypeScript rules
  ...tseslint.configs.recommended,

  // 4. Custom Node.js & TypeScript developer experience rules
  {
    rules: {
      // Allow unused variables/parameters if prefixed with _ (standard for Express handlers)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Enforce explicit type-only imports for cleaner code
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Flag console statements as warnings (favoring structured loggers like Pino)
      'no-console': 'warn',
    },
  },

  // 5. Disable all rules conflicting with Prettier (must always be LAST)
  eslintConfigPrettier,
]);
