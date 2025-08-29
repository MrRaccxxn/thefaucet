-- Connect to main database
\c faucet_db;

-- Enable commonly needed PostgreSQL extensions for the faucet application

-- UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension for working with cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Extension for case-insensitive text matching
CREATE EXTENSION IF NOT EXISTS "citext";

-- Extension for trigram similarity matching (useful for search)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Extension for additional text search functions
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Extension for working with JSON data more efficiently
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Extension for working with arrays more efficiently
CREATE EXTENSION IF NOT EXISTS "intarray";

-- Connect to test database and enable the same extensions
\c faucet_test_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "intarray";
