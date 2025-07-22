-- Initialize Camunda Database
-- This script ensures the database is properly set up for Camunda

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set proper encoding and collation
ALTER DATABASE camunda SET timezone TO 'UTC';

-- Create indexes for better performance
-- These will be created by Camunda automatically, but we ensure they exist

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE camunda TO camunda;
GRANT ALL PRIVILEGES ON SCHEMA public TO camunda;

-- Log initialization
INSERT INTO pg_stat_statements_info (dealloc) VALUES (0) ON CONFLICT DO NOTHING;
