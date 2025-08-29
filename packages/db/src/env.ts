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

// Lazy environment validation
let _env: Env | null = null;

function validateEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // During build time, provide default values for required fields
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      console.error("❌ Environment validation failed:");
      console.error(result.error.format());
      throw new Error("Invalid environment configuration");
    }
    
    // For development/build, use defaults
    console.warn("⚠️ Environment validation failed, using defaults for build:");
    console.warn(result.error.format());
    
    _env = {
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://localhost:5432/thefaucet",
      NODE_ENV: "development",
      ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY || "dummy-key",
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NATIVE_TOKEN_AMOUNT: 0.02,
      ERC20_TOKEN_AMOUNT: 100,
      NFT_MINT_LIMIT: 5,
      COOLDOWN_PERIOD_HOURS: 24,
    };
  } else {
    _env = result.data;
  }

  return _env;
}

export const env = validateEnv();

// Export schema for external use
export { envSchema };
