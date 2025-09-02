// Authenticated user type for tRPC context
// This represents a user that has been authenticated and has database records
export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role?: string;
}

// Type guard to check if user is authenticated
export function isAuthenticatedUser(user: unknown): user is AuthenticatedUser {
  return (
    user !== null &&
    typeof user === 'object' &&
    'id' in user &&
    'email' in user &&
    typeof (user as any).id === 'string' &&
    typeof (user as any).email === 'string'
  );
}