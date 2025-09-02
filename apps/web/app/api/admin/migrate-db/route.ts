import { NextRequest, NextResponse } from 'next/server';
import { db } from '@thefaucet/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  // Simple protection - only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    console.log('🚀 Running database migration to add foreign key constraints...');
    
    // Add foreign key constraints from migration 0006_clever_miracleman.sql
    const migrations = [
      {
        name: 'user_profiles_user_id_users_id_fk',
        sql: 'ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action'
      },
      {
        name: 'claims_user_id_users_id_fk', 
        sql: 'ALTER TABLE "claims" ADD CONSTRAINT "claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action'
      },
      {
        name: 'code_redemptions_user_id_users_id_fk',
        sql: 'ALTER TABLE "code_redemptions" ADD CONSTRAINT "code_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action'
      },
      {
        name: 'rate_limits_user_id_users_id_fk',
        sql: 'ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action'
      },
      {
        name: 'user_wallets_user_id_users_id_fk',
        sql: 'ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action'
      }
    ];
    
    const results = [];
    
    for (const migration of migrations) {
      try {
        await db.execute(sql.raw(migration.sql));
        console.log(`✅ Added foreign key: ${migration.name}`);
        results.push({ constraint: migration.name, status: 'success' });
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Foreign key already exists: ${migration.name}`);
          results.push({ constraint: migration.name, status: 'already_exists' });
        } else {
          console.error(`❌ Failed to add foreign key: ${migration.name}`, error);
          results.push({ constraint: migration.name, status: 'failed', error: error.message });
        }
      }
    }
    
    console.log('✅ Migration completed!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Foreign key constraints added successfully',
      results
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}