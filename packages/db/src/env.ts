import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Database Environment Schema
const envSchema = z.object({
  // Database Configuration
  DATABASE_URL: z.string().url().describe("PostgreSQL connection URL"),

  // Application Environment
  NODE_ENV: z
    .enum(["development", "staging", "production"])
    .default("development"),

  // API Keys
  ALCHEMY_API_KEY: z.string().min(1),

  // GitHub OAuth (for authentication)
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // NextAuth Configuration
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().optional(),

  // Faucet Configuration
  NATIVE_TOKEN_AMOUNT: z.coerce.number().default(0.02),
  ERC20_TOKEN_AMOUNT: z.coerce.number().default(100),
  NFT_MINT_LIMIT: z.coerce.number().default(5),
  COOLDOWN_PERIOD_HOURS: z.coerce.number().default(24),
});

// Type inference
export type Env = z.infer<typeof envSchema>;

// Validate and export environment
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Environment validation failed:");
    console.error(result.error.format());
    throw new Error("Invalid environment configuration");
  }

  return result.data;
}

export const env = validateEnv();

// Export schema for external use
export { envSchema };
