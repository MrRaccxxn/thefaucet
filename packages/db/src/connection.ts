import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './env';

// Create the connection
const client = postgres(env.DATABASE_URL, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close connections after 20 seconds of inactivity
  connect_timeout: 10, // Connection timeout in seconds
});

// Create the Drizzle database instance
export const db = drizzle(client);

// Export the client for direct SQL queries if needed
export { client };
