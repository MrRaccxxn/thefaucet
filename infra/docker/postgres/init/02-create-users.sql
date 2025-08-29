-- Create application user with limited privileges for production-like setup
-- Note: The main faucet_user is already created in docker-compose.yml

-- Create read-only user for analytics/reporting
CREATE USER faucet_readonly WITH PASSWORD 'readonly_password';

-- Create backup user for database maintenance
CREATE USER faucet_backup WITH PASSWORD 'backup_password';

-- Grant appropriate permissions to readonly user
GRANT CONNECT ON DATABASE faucet_db TO faucet_readonly;
GRANT CONNECT ON DATABASE faucet_test_db TO faucet_readonly;

-- Grant appropriate permissions to backup user
GRANT CONNECT ON DATABASE faucet_db TO faucet_backup;
GRANT CONNECT ON DATABASE faucet_test_db TO faucet_backup;

-- Switch to main database to grant schema-level permissions
\c faucet_db;

-- Grant read-only access to readonly user (public schema for now, Drizzle will handle app schema)
GRANT USAGE ON SCHEMA public TO faucet_readonly;

-- Grant backup permissions (public schema for now, Drizzle will handle app schema)
GRANT USAGE ON SCHEMA public TO faucet_backup;

-- Note: Additional table-level permissions will be granted after Drizzle ORM creates the tables
-- Drizzle will manage the schema creation and table structure
