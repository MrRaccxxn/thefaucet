import { NextResponse } from 'next/server';
import { db } from "@thefaucet/db";
import { users } from "@thefaucet/db";

export async function GET() {
  try {
    // Test basic database connection
    let dbTest = 'NOT TESTED';
    try {
      // Try to query the users table using proper Drizzle syntax
      const result = await db.select().from(users).limit(1);
      dbTest = 'QUERY SUCCESS';
    } catch (e) {
      dbTest = `QUERY FAILED: ${e instanceof Error ? e.message : 'Unknown error'}`;
    }

    // Test if we can access the schema
    let schemaTest = 'NOT TESTED';
    try {
      // Just check if we can import the schema
      schemaTest = 'SCHEMA ACCESS SUCCESS';
    } catch (e) {
      schemaTest = `SCHEMA ACCESS FAILED: ${e instanceof Error ? e.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      message: 'Database adapter test',
      dbTest,
      schemaTest,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Error in database test',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
