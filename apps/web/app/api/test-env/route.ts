import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? '***SET***' : '***NOT SET***',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '***SET***' : '***NOT SET***',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  // Check if the values look like placeholders
  const isPlaceholder = {
    GITHUB_CLIENT_ID: envVars.GITHUB_CLIENT_ID === 'Iv23lidr8srvHvYctjs3' || envVars.GITHUB_CLIENT_ID === 'your-actual-github-client-id',
    GITHUB_CLIENT_SECRET: envVars.GITHUB_CLIENT_SECRET === 'secret' || envVars.GITHUB_CLIENT_SECRET === 'your-actual-github-client-secret',
    NEXTAUTH_SECRET: envVars.NEXTAUTH_SECRET === 'your-nextauth-secret-here',
  };

  return NextResponse.json({
    message: 'Environment variables check',
    envVars,
    isPlaceholder,
    timestamp: new Date().toISOString(),
  });
}
