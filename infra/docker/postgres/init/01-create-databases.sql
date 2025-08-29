-- Create main application database
CREATE DATABASE faucet_db;

-- Create test database for running tests
CREATE DATABASE faucet_test_db;

-- Grant permissions to the main user
GRANT ALL PRIVILEGES ON DATABASE faucet_db TO faucet_user;
GRANT ALL PRIVILEGES ON DATABASE faucet_test_db TO faucet_user;

-- Note: Database schema and tables will be created by Drizzle ORM migrations
-- This script only sets up the basic database structure needed for Drizzle to work
