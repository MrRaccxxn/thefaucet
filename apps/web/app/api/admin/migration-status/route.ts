import { NextRequest, NextResponse } from 'next/server';
import { db } from '@thefaucet/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Check for admin secret in query params or header
    const authHeader = request.headers.get('authorization');
    const searchParams = request.nextUrl.searchParams;
    const tokenFromQuery = searchParams.get('token');
    const adminSecret = process.env.ADMIN_SECRET || 'your-admin-secret';
    
    const isAuthorized = authHeader === `Bearer ${adminSecret}` || 
                         tokenFromQuery === adminSecret;
    
    if (!isAuthorized) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Provide admin token via Authorization header or ?token= query parameter' 
      }, { status: 401 });
    }

    // Get all tables in the database
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    // Get migration files count
    const migrationsDir = path.join(process.cwd(), '../../packages/db/migrations');
    let migrationFiles: string[] = [];
    
    try {
      if (fs.existsSync(migrationsDir)) {
        migrationFiles = fs.readdirSync(migrationsDir)
          .filter(file => file.endsWith('.sql'))
          .sort();
      }
    } catch (error) {
      console.warn('Could not read migrations directory:', error);
    }

    // Check if essential tables exist
    const essentialTables = ['users', 'accounts', 'sessions', 'claims', 'supported_chains'];
    const existingTables = (tablesResult as any[]).map(r => r.table_name as string);
    const missingTables = essentialTables.filter(table => !existingTables.includes(table));

    // Get row counts for main tables
    const rowCounts: Record<string, number> = {};
    for (const table of existingTables) {
      if (essentialTables.includes(table)) {
        try {
          const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM "${table}"`));
          rowCounts[table] = parseInt((countResult as any[])[0]?.count as string || '0');
        } catch (error) {
          rowCounts[table] = -1; // Error getting count
        }
      }
    }

    // Determine migration status
    const status = missingTables.length === 0 ? 'up-to-date' : 'pending';
    
    return NextResponse.json({ 
      success: true,
      status,
      database: {
        connected: true,
        tables: {
          total: existingTables.length,
          list: existingTables,
          missing: missingTables,
          rowCounts
        }
      },
      migrations: {
        filesFound: migrationFiles.length,
        files: migrationFiles
      },
      message: missingTables.length === 0 
        ? '✅ Database schema is up to date' 
        : `⚠️ Missing tables: ${missingTables.join(', ')}`
    });
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    return NextResponse.json({ 
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to check database status'
    }, { status: 500 });
  }
}