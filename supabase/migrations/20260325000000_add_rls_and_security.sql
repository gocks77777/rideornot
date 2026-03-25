-- ============================================================
-- 1. increment_manner_score: 클라이언트 직접 호출 차단
--    서비스 롤(API 라우트)만 호출 가능하도록 권한 제거
-- ============================================================
REVOKE EXECUTE ON FUNCTION increment_manner_score(UUID, NUMERIC) FROM anon, authenticated;

-- ============================================================
-- 2. parties 테이블 RLS
-- ============================================================
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;

-- 누구나 팟 목록 조회 가능
CREATE POLICY "parties_select" ON parties
  FOR SELECT USING (true);

-- 로그인한 유저만 생성, host_id = 본인
CREATE POLICY "parties_insert" ON parties
  FOR INSERT WITH CHECK (auth.uid() = host_id);

-- 방장만 수정 가능
CREATE POLICY "parties_update" ON parties
  FOR UPDATE USING (auth.uid() = host_id);

-- ============================================================
-- 3. party_members 테이블 RLS
-- ============================================================
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;

-- 로그인한 유저는 party_members 조회 가능
CREATE POLICY "party_members_select" ON party_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 본인만 참여 신청 가능
CREATE POLICY "party_members_insert" ON party_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인 또는 해당 팟의 방장만 수정 가능 (승인/거절/결제 처리)
CREATE POLICY "party_members_update" ON party_members
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM parties WHERE id = party_id AND host_id = auth.uid())
  );

-- 본인만 탈퇴 가능
CREATE POLICY "party_members_delete" ON party_members
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 4. comments 테이블 RLS
-- ============================================================
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 로그인한 유저는 댓글 조회 가능
CREATE POLICY "comments_select" ON comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 본인 댓글만 작성 가능
CREATE POLICY "comments_insert" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인 댓글 삭제 (관리자는 서비스 롤 API로 처리)
CREATE POLICY "comments_delete" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 5. users 테이블 RLS
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 모든 프로필 조회 가능
CREATE POLICY "users_select" ON users
  FOR SELECT USING (true);

-- 본인 행만 수정 가능
CREATE POLICY "users_update" ON users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- is_banned / is_admin 필드를 일반 유저가 직접 변경하지 못하도록 트리거로 보호
CREATE OR REPLACE FUNCTION protect_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 서비스 롤(API 라우트)은 bypass → 변경 허용
  -- authenticated 유저가 직접 호출 시 admin 필드는 old 값으로 강제 유지
  IF current_setting('role') = 'authenticated' THEN
    NEW.is_banned := OLD.is_banned;
    NEW.is_admin  := OLD.is_admin;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_admin_fields
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION protect_admin_fields();

-- ============================================================
-- 6. push_subscriptions 테이블 RLS (존재하는 경우)
-- ============================================================
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_select" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_insert" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_delete" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 7. reports / praises 테이블 — 서비스 롤만 모든 항목 접근
--    (기존 정책은 20260322010000에서 생성됨, admin 조회 정책 추가)
-- ============================================================
-- 관리자 전용 신고 조회는 서비스 롤 API 라우트가 처리하므로
-- anon/authenticated 의 전체 조회 정책은 추가하지 않음
