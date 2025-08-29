// Authentication helper functions for the web application

import { getServerSession } from "next-auth/next";
import { authOptions } from './auth';
import type { Session } from 'next-auth';

// Extend the Session type to include user.id
interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

/**
 * Get the current session
 */
export async function getSession(): Promise<ExtendedSession | null> {
  return await getServerSession(authOptions) as ExtendedSession | null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Get user ID from session
 */
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id || null;
}

/**
 * Check if user has required permissions
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const session = await getSession();
  // For now, just check if user is authenticated
  // This can be extended with role-based permissions later
  return !!session?.user;
}

/**
 * Get authentication status for client components
 */
export function getAuthStatus() {
  return {
    isAuthenticated: false, // This will be set by client-side auth state
    user: null,
    isLoading: true,
  };
}
