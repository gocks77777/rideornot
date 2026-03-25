-- ============================================================
-- 이전 RLS 마이그레이션(20260325000000) 문제 수정
-- ============================================================

-- 1. 명시적 GRANT (RLS 적용 시 privilege도 있어야 함)
GRANT SELECT ON parties TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON party_members TO anon, authenticated;
GRANT SELECT ON users TO anon, authenticated;
GRANT SELECT, INSERT ON comments TO anon, authenticated;
GRANT DELETE ON comments TO authenticated;

-- 2. party_members SELECT 정책 수정: 누구나 조회 가능으로 변경
--    (party_members 내부 정보는 팟 참여자 목록 표시에 필요하므로 공개)
DROP POLICY IF EXISTS "party_members_select" ON party_members;
CREATE POLICY "party_members_select" ON party_members
  FOR SELECT USING (true);

-- 3. protect_admin_fields 트리거 함수 수정
--    current_setting('role')은 잘못된 GUC → current_role 사용
CREATE OR REPLACE FUNCTION protect_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- service_role(관리자 API)이 아닌 경우 admin 필드 변경 차단
  IF current_role <> 'service_role' THEN
    NEW.is_banned := OLD.is_banned;
    NEW.is_admin  := OLD.is_admin;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. push_subscriptions RLS (테이블이 있는 경우에만 적용)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_subscriptions' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'GRANT SELECT, INSERT, DELETE ON push_subscriptions TO authenticated';

    -- 기존 정책이 있으면 먼저 삭제
    EXECUTE 'DROP POLICY IF EXISTS "push_subscriptions_select" ON push_subscriptions';
    EXECUTE 'DROP POLICY IF EXISTS "push_subscriptions_insert" ON push_subscriptions';
    EXECUTE 'DROP POLICY IF EXISTS "push_subscriptions_delete" ON push_subscriptions';

    EXECUTE 'CREATE POLICY "push_subscriptions_select" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "push_subscriptions_insert" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "push_subscriptions_delete" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;
