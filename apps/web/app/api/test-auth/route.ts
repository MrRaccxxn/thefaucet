import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // Check if authOptions is properly configured
    const config = {
      hasAdapter: !!authOptions.adapter,
      hasProviders: Array.isArray(authOptions.providers) && authOptions.providers.length > 0,
      providerCount: Array.isArray(authOptions.providers) ? authOptions.providers.length : 0,
      hasSecret: !!authOptions.secret,
      hasSessionStrategy: !!authOptions.session?.strategy,
      sessionStrategy: authOptions.session?.strategy,
      providers: Array.isArray(authOptions.providers) ? authOptions.providers.map(p => p.id) : [],
    };

    return NextResponse.json({
      message: 'NextAuth configuration check',
      config,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Error checking NextAuth configuration',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
