import { FlatCompat } from '@eslint/eslintrc';
import path from 'node:path';

const compat = new FlatCompat({
  baseDirectory: path.resolve(),
});

export default compat.config({
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
    jest: false,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  ignorePatterns: ['.next', 'node_modules', 'coverage', 'dist', '.turbo'],
});

