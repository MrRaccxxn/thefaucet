import { NextRequest, NextResponse } from 'next/server';
import { db, users, userProfiles, accounts, sessions } from '@thefaucet/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    // Get all table counts
    const tableStats = await db.execute(sql`
      SELECT 'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 'user_profiles' as table_name, COUNT(*) as count FROM user_profiles
      UNION ALL
      SELECT 'accounts' as table_name, COUNT(*) as count FROM accounts
      UNION ALL
      SELECT 'sessions' as table_name, COUNT(*) as count FROM sessions
    `);

    // Get actual data
    const usersData = await db.select().from(users);
    const profilesData = await db.select().from(userProfiles);
    const accountsData = await db.select().from(accounts);
    const sessionsData = await db.select().from(sessions);

    return NextResponse.json({
      tableStats,
      data: {
        users: usersData,
        profiles: profilesData,
        accounts: accountsData,
        sessions: sessionsData.map(s => ({ ...s, expires: s.expires?.toISOString(), sessionToken: 'HIDDEN' }))
      }
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}