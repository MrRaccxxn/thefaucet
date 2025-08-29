// Export database connection
export { db, client } from './connection';

// Export environment configuration
export { env, envSchema } from './env';

// Export all schema types and tables
export * from './schema';

// Export all query helpers
export * from './queries';

// Export migration function
export { runMigrations } from './migrate';

// Version
export const DB_VERSION = '0.0.1';
