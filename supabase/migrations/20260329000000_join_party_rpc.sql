-- ============================================================
-- join_party RPC: 팟 참여를 트랜잭션 내에서 원자적으로 처리
-- 클라이언트의 SELECT → INSERT 사이 레이스 컨디션 방지
-- ============================================================

CREATE OR REPLACE FUNCTION join_party(
  p_party_id UUID,
  p_user_id UUID,
  p_member_status TEXT DEFAULT 'joined'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current INT;
  v_max     INT;
  v_status  TEXT;
  v_existing_status TEXT;
BEGIN
  -- 1. 파티 정보를 FOR UPDATE로 잠금 (동시 요청 직렬화)
  SELECT current_member, max_member, status
    INTO v_current, v_max, v_status
    FROM parties
   WHERE id = p_party_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'party_not_found');
  END IF;

  -- 취소/완료된 팟에는 참여 불가
  IF v_status NOT IN ('recruiting', 'full') THEN
    RETURN jsonb_build_object('error', 'party_not_active');
  END IF;

  -- 2. 기존 참여 기록 확인
  SELECT status INTO v_existing_status
    FROM party_members
   WHERE party_id = p_party_id AND user_id = p_user_id;

  IF FOUND THEN
    -- rejected 상태면 재신청 (status 업데이트)
    IF v_existing_status = 'rejected' THEN
      -- 재신청도 정원 체크 (pending은 정원에 포함 안 됨, joined/paid만 포함)
      IF p_member_status != 'pending' AND v_current >= v_max THEN
        RETURN jsonb_build_object('error', 'full');
      END IF;
      UPDATE party_members SET status = p_member_status
       WHERE party_id = p_party_id AND user_id = p_user_id;
      RETURN jsonb_build_object('success', true, 'rejoin', true);
    ELSE
      RETURN jsonb_build_object('error', 'already_joined');
    END IF;
  END IF;

  -- 3. 정원 확인 (pending은 정원에 포함 안 됨)
  IF p_member_status != 'pending' AND v_current >= v_max THEN
    RETURN jsonb_build_object('error', 'full');
  END IF;

  -- 4. 참여 삽입
  INSERT INTO party_members (party_id, user_id, status)
  VALUES (p_party_id, p_user_id, p_member_status);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- authenticated 유저가 호출 가능
GRANT EXECUTE ON FUNCTION join_party(UUID, UUID, TEXT) TO authenticated;
