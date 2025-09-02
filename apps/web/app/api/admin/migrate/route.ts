import { NextRequest, NextResponse } from 'next/server';
import { db } from '@thefaucet/db';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    console.log('🔄 Running database migrations...');
    
    // Run migrations using the web app's database connection
    await migrate(db, { migrationsFolder: '../../packages/db/migrations' });
    
    console.log('✅ Database migrations completed!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database migrations completed successfully' 
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}