CREATE TABLE IF NOT EXISTS "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"github_id" text,
	"github_username" text,
	"account_age" integer,
	"followers_count" integer,
	"repository_count" integer,
	"is_verified" boolean DEFAULT false,
	"last_validation_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_github_id_unique" UNIQUE("github_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "legacy_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "legacy_users_github_id_unique" UNIQUE("github_id")
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_github_id_unique";--> statement-breakpoint
ALTER TABLE "claims" DROP CONSTRAINT "claims_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "code_redemptions" DROP CONSTRAINT "code_redemptions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "rate_limits" DROP CONSTRAINT "rate_limits_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_wallets" DROP CONSTRAINT "user_wallets_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "users_github_id_idx";--> statement-breakpoint
ALTER TABLE "claims" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "code_redemptions" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "rate_limits" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_wallets" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "image" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accounts_provider_account_id_idx" ON "accounts" USING btree ("provider_account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_profiles_user_id_idx" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_profiles_github_id_idx" ON "user_profiles" USING btree ("github_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_tokens_identifier_token_idx" ON "verification_tokens" USING btree ("identifier","token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "legacy_users_github_id_idx" ON "legacy_users" USING btree ("github_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "legacy_users_email_idx" ON "legacy_users" USING btree ("email");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "github_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "updated_at";