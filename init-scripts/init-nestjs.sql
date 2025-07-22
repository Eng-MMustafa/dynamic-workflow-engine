-- Initialize NestJS Database
-- This script ensures the database is properly set up for NestJS application

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set proper encoding and collation
ALTER DATABASE workflow_app SET timezone TO 'UTC';

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE workflow_app TO nestjs;
GRANT ALL PRIVILEGES ON SCHEMA public TO nestjs;

-- Create initial admin user (will be handled by NestJS, but we prepare the structure)
-- The actual tables will be created by TypeORM synchronization

-- Log initialization
SELECT 'NestJS Database initialized successfully' as status;
