-- Add 'pending' and 'rejected' to party_members status
ALTER TABLE party_members DROP CONSTRAINT IF EXISTS party_members_status_check;
ALTER TABLE party_members ADD CONSTRAINT party_members_status_check
  CHECK (status IN ('pending', 'joined', 'paid', 'rejected'));

-- Fix parties status to include all values used in the app
ALTER TABLE parties DROP CONSTRAINT IF EXISTS parties_status_check;
ALTER TABLE parties ADD CONSTRAINT parties_status_check
  CHECK (status IN ('recruiting', 'full', 'closed', 'departed', 'completed', 'cancelled'));
