import { pgTable, text, timestamp, boolean, integer, uuid, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// NextAuth Users table
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  role: text('role').default('user').notNull(), // 'user', 'admin', 'moderator'
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
}));

// NextAuth Accounts table
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  userIdIdx: index('accounts_user_id_idx').on(table.userId),
  providerAccountIdIdx: index('accounts_provider_account_id_idx').on(table.providerAccountId),
}));

// NextAuth Sessions table
export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
}));

// NextAuth Verification Tokens table
export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (table) => ({
  identifierTokenIdx: index('verification_tokens_identifier_token_idx').on(table.identifier, table.token),
}));

// Extended user profile for GitHub-specific data
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  githubId: text('github_id').unique(),
  githubUsername: text('github_username'),
  accountAge: integer('account_age'), // in days
  followersCount: integer('followers_count'),
  repositoryCount: integer('repository_count'),
  isVerified: boolean('is_verified').default(false),
  lastValidationAt: timestamp('last_validation_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_profiles_user_id_idx').on(table.userId),
  githubIdIdx: index('user_profiles_github_id_idx').on(table.githubId),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertAccountSchema = createInsertSchema(accounts);
export const selectAccountSchema = createSelectSchema(accounts);
export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);
export const insertVerificationTokenSchema = createInsertSchema(verificationTokens);
export const selectVerificationTokenSchema = createSelectSchema(verificationTokens);
export const insertUserProfileSchema = createInsertSchema(userProfiles);
export const selectUserProfileSchema = createSelectSchema(userProfiles);

// Types
export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
export type Account = z.infer<typeof selectAccountSchema>;
export type NewAccount = z.infer<typeof insertAccountSchema>;
export type Session = z.infer<typeof selectSessionSchema>;
export type NewSession = z.infer<typeof insertSessionSchema>;
export type VerificationToken = z.infer<typeof selectVerificationTokenSchema>;
export type NewVerificationToken = z.infer<typeof insertVerificationTokenSchema>;
export type UserProfile = z.infer<typeof selectUserProfileSchema>;
export type NewUserProfile = z.infer<typeof insertUserProfileSchema>;
