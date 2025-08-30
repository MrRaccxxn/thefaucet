import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test basic environment variables
    const envTest = {
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? 'SET' : 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    };

    // Test if we can import NextAuth
    let nextAuthTest = 'NOT TESTED';
    try {
      const NextAuth = require('next-auth');
      nextAuthTest = 'IMPORT SUCCESS';
    } catch (e) {
      nextAuthTest = `IMPORT FAILED: ${e instanceof Error ? e.message : 'Unknown error'}`;
    }

    // Test if we can import GitHub provider
    let githubProviderTest = 'NOT TESTED';
    try {
      const GitHubProvider = require('next-auth/providers/github');
      githubProviderTest = 'IMPORT SUCCESS';
    } catch (e) {
      githubProviderTest = `IMPORT FAILED: ${e instanceof Error ? e.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      message: 'Simple NextAuth test',
      envTest,
      nextAuthTest,
      githubProviderTest,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Error in simple test',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

