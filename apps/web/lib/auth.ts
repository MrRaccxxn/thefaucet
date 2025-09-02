import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@thefaucet/db";
import { users, accounts, sessions, verificationTokens } from "@thefaucet/db";
import { randomUUID } from "crypto";

export const authOptions: NextAuthOptions = {
  // @ts-expect-error - DrizzleAdapter types might not match exactly
  adapter: {
    ...DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    createUser: async (data) => {
      const id = randomUUID();
      const result = await db.insert(users).values({
        ...data,
        id,
      }).returning();
      return result[0];
    },
    linkAccount: async (data) => {
      const id = randomUUID();
      await db.insert(accounts).values({
        ...data,
        id,
      });
    },
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
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
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Allow sign in
      return true;
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
