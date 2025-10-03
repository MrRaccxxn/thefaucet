ALTER TABLE "claim_limits" ALTER COLUMN "standard_amount" SET DATA TYPE numeric(30, 18);--> statement-breakpoint
ALTER TABLE "claims" ALTER COLUMN "amount" SET DATA TYPE numeric(30, 18);