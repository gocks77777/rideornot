-- Add bank_account column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account TEXT;
