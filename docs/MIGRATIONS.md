# Database Migration Guide

## Overview

This project uses Drizzle ORM for database migrations with a production-grade setup that includes:
- GitHub Actions for automated migrations
- Manual migration endpoints for emergency use
- Migration status monitoring

## Migration Workflow

### 1. Automatic Migrations (Recommended)

Migrations run automatically via GitHub Actions when:
- Changes are pushed to `main` branch
- Migration files or schema files are modified
- Manually triggered via GitHub Actions UI

**Setup Required:**
1. Add `DATABASE_URL` to GitHub Secrets
2. Enable GitHub Actions for your repository
3. Push to main branch

### 2. Manual Migration via API

For emergency or initial setup, use the admin endpoints:

```bash
# Run migrations
curl -X POST https://your-app.vercel.app/api/admin/run-migrations \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET"

# Check migration status
curl https://your-app.vercel.app/api/admin/migration-status \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET"
```

### 3. Local Migration (Development)

```bash
# Navigate to db package
cd packages/db

# Generate migration files
pnpm db:generate

# Run migrations
pnpm db:migrate

# Push schema directly (skips migration files)
pnpm db:push
```

## Environment Variables

Required for production:
- `DATABASE_URL`: PostgreSQL connection string
- `ADMIN_SECRET`: Secret key for admin endpoints (generate with `openssl rand -base64 32`)

## Migration Files

Migrations are stored in `packages/db/migrations/` and are automatically versioned by Drizzle Kit.

### Creating New Migrations

1. Modify schema in `packages/db/src/schema/`
2. Generate migration: `pnpm db:generate`
3. Review generated SQL in `migrations/` folder
4. Commit and push to trigger automatic migration

## Best Practices

1. **Always test migrations locally first**
   - Use a development database
   - Verify schema changes work as expected

2. **Review migration files before deploying**
   - Check the generated SQL
   - Ensure no data loss

3. **Use GitHub Actions for production**
   - Automated and tracked
   - Rollback capability via Git

4. **Monitor migration status**
   - Check `/api/admin/migration-status` after deployment
   - Verify all tables exist

## Troubleshooting

### Migration Failed in GitHub Actions
1. Check GitHub Actions logs
2. Verify `DATABASE_URL` secret is correct
3. Ensure database is accessible from GitHub Actions

### Tables Don't Exist in Production
1. Check migration status endpoint
2. Run manual migration via API endpoint
3. Or run locally: `DATABASE_URL=prod_url pnpm db:push`

### Connection Issues
- Render databases require SSL: `?sslmode=require`
- Ensure IP whitelist includes GitHub Actions IPs
- Check database credentials

## Security Notes

- Never commit `.env` files
- Use GitHub Secrets for sensitive data
- Rotate `ADMIN_SECRET` regularly
- Restrict database access to necessary IPs only

## Migration History

Track migration history by checking:
1. GitHub Actions run history
2. Git commits for `migrations/` folder
3. Database migration table (if using Drizzle migrations)