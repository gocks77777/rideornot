-- Add deposit fields to parties table
ALTER TABLE parties ADD COLUMN IF NOT EXISTS has_deposit BOOLEAN DEFAULT false;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS deposit_amount INT;

-- Update status check constraint to allow 'completed' and 'cancelled'
ALTER TABLE parties DROP CONSTRAINT IF EXISTS parties_status_check;
ALTER TABLE parties ADD CONSTRAINT parties_status_check CHECK (status IN ('recruiting', 'closed', 'completed', 'cancelled'));
