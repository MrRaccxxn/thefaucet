CREATE TABLE IF NOT EXISTS "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" integer NOT NULL,
	"type" text NOT NULL,
	"address" text,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"decimals" integer DEFAULT 18 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "claim_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"standard_amount" numeric(20, 18) NOT NULL,
	"cooldown_period" integer NOT NULL,
	"max_claims_per_period" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"chain_id" integer NOT NULL,
	"rpc_url" text NOT NULL,
	"block_explorer_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chains_chain_id_unique" UNIQUE("chain_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"wallet_address" text NOT NULL,
	"amount" numeric(20, 18),
	"token_id" text,
	"tx_hash" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "code_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "redeem_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"boosted_amounts" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "redeem_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asset_type" text NOT NULL,
	"chain_id" integer NOT NULL,
	"last_claim_at" timestamp NOT NULL,
	"claim_count" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"address" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_github_id_unique" UNIQUE("github_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assets" ADD CONSTRAINT "assets_chain_id_chains_chain_id_fk" FOREIGN KEY ("chain_id") REFERENCES "public"."chains"("chain_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "claim_limits" ADD CONSTRAINT "claim_limits_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "claims" ADD CONSTRAINT "claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "claims" ADD CONSTRAINT "claims_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "code_redemptions" ADD CONSTRAINT "code_redemptions_code_id_redeem_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."redeem_codes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "code_redemptions" ADD CONSTRAINT "code_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "code_redemptions" ADD CONSTRAINT "code_redemptions_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_chain_id_idx" ON "assets" USING btree ("chain_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_type_idx" ON "assets" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_address_idx" ON "assets" USING btree ("address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_is_active_idx" ON "assets" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "claim_limits_asset_id_idx" ON "claim_limits" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chains_chain_id_idx" ON "chains" USING btree ("chain_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chains_is_active_idx" ON "chains" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "claims_user_id_idx" ON "claims" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "claims_asset_id_idx" ON "claims" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "claims_status_idx" ON "claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "claims_created_at_idx" ON "claims" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "claims_tx_hash_idx" ON "claims" USING btree ("tx_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "code_redemptions_code_id_idx" ON "code_redemptions" USING btree ("code_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "code_redemptions_user_id_idx" ON "code_redemptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "code_redemptions_claim_id_idx" ON "code_redemptions" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "redeem_codes_code_idx" ON "redeem_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "redeem_codes_is_active_idx" ON "redeem_codes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "redeem_codes_expires_at_idx" ON "redeem_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limits_user_id_idx" ON "rate_limits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limits_asset_type_idx" ON "rate_limits" USING btree ("asset_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limits_chain_id_idx" ON "rate_limits" USING btree ("chain_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limits_last_claim_at_idx" ON "rate_limits" USING btree ("last_claim_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_wallets_user_id_idx" ON "user_wallets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_wallets_address_idx" ON "user_wallets" USING btree ("address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_wallets_is_primary_idx" ON "user_wallets" USING btree ("is_primary");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_github_id_idx" ON "users" USING btree ("github_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");