CREATE TABLE IF NOT EXISTS "api_rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp NOT NULL,
	"window_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_rate_limits_identifier_idx" ON "api_rate_limits" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_rate_limits_window_end_idx" ON "api_rate_limits" USING btree ("window_end");