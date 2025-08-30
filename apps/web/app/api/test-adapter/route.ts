import { NextResponse } from 'next/server';
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@thefaucet/db";
import { users, accounts, sessions, verificationTokens } from "@thefaucet/db";

export async function GET() {
  try {
    // Test if we can import DrizzleAdapter
    let adapterImportTest = 'NOT TESTED';
    try {
      adapterImportTest = 'IMPORT SUCCESS';
    } catch (e) {
      adapterImportTest = `IMPORT FAILED: ${e instanceof Error ? e.message : 'Unknown error'}`;
    }

    // Test if we can initialize the adapter
    let adapterInitTest = 'NOT TESTED';
    try {
      const adapter = DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      });
      adapterInitTest = 'INIT SUCCESS';
    } catch (e) {
      adapterInitTest = `INIT FAILED: ${e instanceof Error ? e.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      message: 'DrizzleAdapter test',
      adapterImportTest,
      adapterInitTest,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Error in adapter test',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

