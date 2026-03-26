-- is_admin 컬럼 추가 (protect_admin_fields 트리거가 이 컬럼을 참조하므로 필수)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
