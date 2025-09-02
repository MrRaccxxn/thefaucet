import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@thefaucet/db";
import { users, accounts, sessions, verificationTokens, userProfiles } from "@thefaucet/db";
import { eq, and } from "drizzle-orm";
import { GitHubAccountValidator, calculateAccountAge } from "@thefaucet/core";
import type { GitHubUserProfile } from "@thefaucet/core";
import { randomUUID } from "crypto";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "user:email read:user",
        },
      },
    }),
  ],
  session: {
    strategy: "database", // Use database strategy when using an adapter
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development", // Enable debug mode
  callbacks: {
    async session({ session, user }) {
      // When using database sessions, user is available
      if (session.user && user) {
        (session.user as any).id = user.id;
        
        // Get GitHub username from accounts table (more reliable than user_profiles)
        try {
          // First, try to get GitHub account for this user
          const githubAccount = await db
            .select()
            .from(accounts)
            .where(
              and(
                eq(accounts.userId, user.id),
                eq(accounts.provider, "github")
              )
            )
            .limit(1);
          
          if (githubAccount[0]) {
            // Fetch GitHub profile data using the GitHub account ID
            // For now, let's try to get it from user_profiles
            const userProfile = await db
              .select({ githubUsername: userProfiles.githubUsername })
              .from(userProfiles)
              .where(eq(userProfiles.userId, user.id))
              .limit(1);
            
            if (userProfile[0]?.githubUsername) {
              (session.user as any).githubUsername = userProfile[0].githubUsername;
            } else {
              // If no username in user_profiles, we'll use the name as fallback
              // This handles cases where user_profiles wasn't created properly
              (session.user as any).githubUsername = session.user.name || "user";
            }
          }
        } catch (error) {
          console.error('Error in session callback:', error);
          // Fallback to name
          (session.user as any).githubUsername = session.user.name || "user";
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Only validate GitHub accounts
      if (account?.provider !== "github" || !profile) {
        return true;
      }

      try {
        // Cast profile to GitHub profile type
        const githubProfile = profile as unknown as GitHubUserProfile;
  
        // Validate GitHub account
        const validator = new GitHubAccountValidator();
        const validationResult = validator.validateProfile(githubProfile);

        if (!validationResult.isValid) {
          console.log("GitHub validation failed:", validationResult.errors);
          // Redirect to error page with validation errors
          throw new Error(`GitHub account validation failed: ${validationResult.errors.join(", ")}`);
        }

        // Store GitHub profile data in userProfiles table
        const userId = (user as any).id || user.email;
        if (userId) {
          try {
            // Try to insert new profile
            await db.insert(userProfiles).values({
              userId: userId,
              githubId: githubProfile.id.toString(),
              githubUsername: githubProfile.login,
              accountAge: calculateAccountAge(githubProfile.created_at),
              followersCount: githubProfile.followers,
              repositoryCount: githubProfile.public_repos,
              isVerified: true,
              lastValidationAt: new Date(),
            });
            console.log(`✅ Created user profile for ${userId} with username ${githubProfile.login}`);
          } catch (error) {
            // If user profile already exists, update it
            console.log("User profile exists, updating...");
            try {
              await db
                .update(userProfiles)
                .set({
                  githubUsername: githubProfile.login,
                  accountAge: calculateAccountAge(githubProfile.created_at),
                  followersCount: githubProfile.followers,
                  repositoryCount: githubProfile.public_repos,
                  lastValidationAt: new Date(),
                })
                .where(eq(userProfiles.userId, userId));
              console.log(`✅ Updated user profile for ${userId} with username ${githubProfile.login}`);
            } catch (updateError) {
              console.error("Failed to update user profile:", updateError);
            }
          }
        }

        return true;
      } catch (error) {
        console.error("GitHub validation error:", error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/", // Custom sign-in page (modal on homepage)
    error: "/auth/error", // Error code passed in query string as ?error=
  },
};

// Helper functions for authentication
import { getServerSession as nextAuthGetServerSession } from "next-auth";
export { getServerSession } from "next-auth";

/**
 * Get the current user session on the server side
 */
export async function getCurrentUser() {
  const session = await nextAuthGetServerSession(authOptions);
  return session?.user ?? null;
}

/**
 * Require authentication for server-side functions
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

/**
 * Check if the user is authenticated
 */
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}
