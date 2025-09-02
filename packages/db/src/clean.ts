#!/usr/bin/env ts-node

import { db } from "./connection";
import { sql } from "drizzle-orm";
import { env } from "./env";

async function cleanDatabase() {
  console.log("🗑️  Starting database cleanup...");

  // Ensure we're not accidentally running in production
  if (env.NODE_ENV === "production") {
    console.error("❌ Cannot clean database in production!");
    process.exit(1);
  }

  try {
    console.log("⏳ Disabling foreign key constraints...");
    await db.execute(sql`SET session_replication_role = replica`);

    console.log("🗑️  Truncating user-related tables...");
    const tables = [
      "sessions",
      "accounts",
      "verification_tokens",
      "user_profiles",
      "users",
      "user_wallets",
      "claims",
      "code_redemptions",
      "rate_limits",
      "api_rate_limits",
    ];

    for (const table of tables) {
      try {
        await db.execute(sql.raw(`TRUNCATE TABLE ${table} CASCADE`));
        console.log(`  ✅ Cleared ${table}`);
      } catch (error: any) {
        // Some tables might not exist, that's okay
        if (error.message.includes("does not exist")) {
          console.log(`  ⚠️  Table ${table} does not exist (skipping)`);
        } else {
          console.error(`  ❌ Failed to clear ${table}:`, error.message);
        }
      }
    }

    console.log("✅ Re-enabling foreign key constraints...");
    await db.execute(sql`SET session_replication_role = DEFAULT`);

    console.log("🔍 Verifying cleanup...");
    const result = await db.execute(sql`
      SELECT 
        'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 
        'user_profiles' as table_name, COUNT(*) as count FROM user_profiles
      UNION ALL
      SELECT 
        'accounts' as table_name, COUNT(*) as count FROM accounts
      UNION ALL
      SELECT 
        'sessions' as table_name, COUNT(*) as count FROM sessions
      UNION ALL
      SELECT 
        'claims' as table_name, COUNT(*) as count FROM claims
      UNION ALL
      SELECT 
        'user_wallets' as table_name, COUNT(*) as count FROM user_wallets
    `);

    console.table(result);

    console.log("\n✅ Database cleanup completed!");
    console.log("📝 Next steps:");
    console.log("  1. Sign out from the web app");
    console.log("  2. Clear browser cookies/cache for localhost");
    console.log("  3. Sign back in with GitHub");
  } catch (error) {
    console.error("❌ Database cleanup failed:", error);
    process.exit(1);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  cleanDatabase();
}

export { cleanDatabase };
