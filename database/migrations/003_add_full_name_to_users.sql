-- Add full_name column to users table
-- This migration adds the full_name column that was missing from the simplified schema

ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) DEFAULT '';

-- Update existing admin user
UPDATE users SET full_name = 'Admin User' WHERE email = 'admin@workzen.com';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);

-- Success message
SELECT 'Added full_name column to users table' as status;
