import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env } from './env';

// Create the connection
const client = postgres(env.DATABASE_URL, {
  max: 1, // Use only one connection for migrations
});

// Create the Drizzle database instance
const db = drizzle(client);

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    await migrate(db, { migrationsFolder: './migrations' });
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
