// Database package for the multichain faucet
// Export database connection
export { db, client } from './connection';

// Export environment configuration
export { env, type Env } from './env';

// Export all schema tables and types
export * from './schema';

// Version
export const DB_VERSION = '0.0.1';
