import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSession();
    
    return NextResponse.json({
      authenticated: !!session,
      user: session?.user ? {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        id: (session.user as any).id
      } : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}