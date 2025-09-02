import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { db, userProfiles } from "@thefaucet/db";
import { eq } from "drizzle-orm";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function getSession() {
  const session = await getServerSession(authOptions);
  return session;
}

/**
 * Get current user with profile data
 */
export async function getCurrentUserWithProfile() {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  // Use email as user ID if id is not available
  const userId = (session.user as any).id || session.user.email;
  if (!userId) {
    return null;
  }

  // Get user profile data
  const userProfile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  return {
    ...session.user,
    id: userId,
    profile: userProfile[0] ?? null,
  };
}

/**
 * Require authentication and return user with profile
 */
export async function requireAuthWithProfile() {
  const user = await getCurrentUserWithProfile();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

/**
 * Check if user meets GitHub requirements
 */
export async function userMeetsRequirements(userId: string) {
  try {
    const userProfile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    const profile = userProfile[0];
    return !!(profile?.isVerified && profile?.githubId);
  } catch (error) {
    console.error('Error checking user requirements:', error);
    return false;
  }
}