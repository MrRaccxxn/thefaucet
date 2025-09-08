import { NextRequest, NextResponse } from 'next/server';
import { db } from '@thefaucet/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Check for admin secret
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET || 'your-admin-secret';
    
    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 Testing database connection...');
    
    // Test the connection and check if tables exist
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('✅ Database connection successful!');
    console.log('📊 Existing tables:', result.rows.map(r => r.table_name));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      tables: result.rows.map(r => r.table_name)
    });
    
  } catch (error) {
    console.error('❌ Database operation failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
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