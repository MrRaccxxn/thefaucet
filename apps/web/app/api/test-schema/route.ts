import { NextResponse } from 'next/server';
import { users, accounts, sessions, verificationTokens } from "@thefaucet/db";

export async function GET() {
  try {
    // Test if we can access the schema objects
    const schemaTest = {
      users: !!users,
      accounts: !!accounts,
      sessions: !!sessions,
      verificationTokens: !!verificationTokens,
    };

    return NextResponse.json({
      message: 'Schema import test',
      schemaTest,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Error in schema test',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

