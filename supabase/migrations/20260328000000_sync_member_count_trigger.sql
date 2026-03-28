-- ============================================================
-- current_member 자동 동기화 트리거
-- party_members 테이블에 INSERT/UPDATE/DELETE 발생 시
-- 해당 파티의 current_member를 실제 승인된 멤버 수로 갱신
-- ============================================================

CREATE OR REPLACE FUNCTION sync_party_member_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_party_id UUID;
BEGIN
  -- DELETE 시에는 OLD, INSERT/UPDATE 시에는 NEW 사용
  target_party_id := COALESCE(NEW.party_id, OLD.party_id);

  UPDATE parties
  SET current_member = (
    SELECT count(*)
    FROM party_members
    WHERE party_id = target_party_id
      AND status IN ('joined', 'paid')
  )
  WHERE id = target_party_id;

  -- 정원이 다 찼으면 status를 full로, 아니면 recruiting으로 복원
  UPDATE parties
  SET status = CASE
    WHEN current_member >= max_member AND status = 'recruiting' THEN 'full'
    WHEN current_member < max_member AND status = 'full' THEN 'recruiting'
    ELSE status
  END
  WHERE id = target_party_id
    AND status IN ('recruiting', 'full');

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_party_member_count ON party_members;
CREATE TRIGGER trg_sync_party_member_count
  AFTER INSERT OR UPDATE OR DELETE ON party_members
  FOR EACH ROW EXECUTE FUNCTION sync_party_member_count();
