-- ============================================================
-- 1. party_members INSERT RLS: 성별 필터 검증 추가
-- ============================================================
DROP POLICY IF EXISTS "party_members_insert" ON party_members;

CREATE POLICY "party_members_insert" ON party_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      (SELECT gender_filter FROM parties WHERE id = party_id) = 'any'
      OR (SELECT gender_filter FROM parties WHERE id = party_id) IS NULL
      OR (SELECT gender FROM users WHERE id = auth.uid())
         IS NOT DISTINCT FROM (SELECT gender_filter FROM parties WHERE id = party_id)
    )
  );

-- ============================================================
-- 2. 정원 초과 방지 트리거 (동시 요청 안전)
-- ============================================================
CREATE OR REPLACE FUNCTION check_party_capacity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_current INT;
  v_max     INT;
BEGIN
  SELECT current_member, max_member
    INTO v_current, v_max
    FROM parties
   WHERE id = NEW.party_id
     FOR UPDATE;  -- 같은 파티에 대한 동시 INSERT 직렬화

  IF v_current >= v_max THEN
    RAISE EXCEPTION '정원이 초과되었습니다.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_party_capacity ON party_members;
CREATE TRIGGER trg_check_party_capacity
  BEFORE INSERT ON party_members
  FOR EACH ROW EXECUTE FUNCTION check_party_capacity();
