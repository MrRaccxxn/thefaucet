import { NextRequest, NextResponse } from 'next/server';
import { db } from '@thefaucet/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  // Simple protection - only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    console.log('🗑️  Starting database cleanup...');
    
    // Disable foreign key constraints
    await db.execute(sql`SET session_replication_role = replica`);
    
    // Truncate all user-related tables
    const tables = [
      'sessions',
      'accounts', 
      'verification_tokens',
      'user_profiles',
      'users',
      'user_wallets',
      'claims',
      'code_redemptions', 
      'rate_limits',
      'api_rate_limits'
    ];
    
    for (const table of tables) {
      try {
        await db.execute(sql.raw(`TRUNCATE TABLE ${table} CASCADE`));
        console.log(`✅ Truncated ${table}`);
      } catch (error) {
        console.log(`⚠️  Failed to truncate ${table}:`, error);
      }
    }
    
    // Re-enable foreign key constraints
    await db.execute(sql`SET session_replication_role = DEFAULT`);
    
    // Verify cleanup
    const result = await db.execute(sql`
      SELECT 'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 'user_profiles' as table_name, COUNT(*) as count FROM user_profiles
      UNION ALL
      SELECT 'accounts' as table_name, COUNT(*) as count FROM accounts
      UNION ALL
      SELECT 'sessions' as table_name, COUNT(*) as count FROM sessions
      UNION ALL
      SELECT 'claims' as table_name, COUNT(*) as count FROM claims
      UNION ALL
      SELECT 'user_wallets' as table_name, COUNT(*) as count FROM user_wallets
    `);
    
    console.log('✅ Database cleanup completed!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database cleaned successfully',
      verification: result
    });
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}