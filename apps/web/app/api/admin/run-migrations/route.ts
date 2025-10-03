import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check for admin secret
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET || 'your-admin-secret';
    
    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json({ 
        error: 'DATABASE_URL not configured' 
      }, { status: 500 });
    }

    console.log('🚀 Starting database migration...');
    
    // Create a separate connection for migrations
    const migrationClient = postgres(databaseUrl, { 
      max: 1,
      ssl: databaseUrl.includes('render.com') ? 'require' : undefined
    });
    
    const migrationDb = drizzle(migrationClient);
    
    try {
      // Run migrations from the packages/db/migrations directory
      const migrationsPath = path.join(process.cwd(), '../../packages/db/migrations');
      console.log('📁 Looking for migrations in:', migrationsPath);
      
      await migrate(migrationDb, {
        migrationsFolder: migrationsPath,
      });
      
      console.log('✅ Migrations completed successfully!');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Migrations completed successfully',
        migrationsPath
      });
      
    } finally {
      await migrationClient.end();
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// GET method to check migration status
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'POST to this endpoint with proper authorization to run migrations',
    note: 'Set ADMIN_SECRET environment variable and use Authorization: Bearer <secret>'
  });
}