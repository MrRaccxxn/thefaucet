// Authentication types and utilities for the faucet application

export * from './types';
export * from './validation';
export * from './utils';

// Authentication constants
export const AUTH_CONFIG = {
  GITHUB_SCOPES: ['user:email', 'read:user'] as const,
  MIN_ACCOUNT_AGE_DAYS: 30,
  MIN_FOLLOWERS_COUNT: 5,
  MIN_REPOSITORY_COUNT: 1,
} as const;
