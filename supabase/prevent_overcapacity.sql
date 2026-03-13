-- =========================================================================
-- [1] 팟 정원 초과(동시성 문제) 방지 트리거
-- Supabase SQL Editor에 복사 후 "Run" 하세요!
-- 목적: 여러 명이 동시에 "참여하기"를 눌렀을 때, DB 레벨에서 정원을 초과하면 에러를 발생시킵니다.
-- =========================================================================

-- 1. 정원 검사 함수 생성
CREATE OR REPLACE FUNCTION public.check_party_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_current_member INT;
  v_max_member INT;
BEGIN
  -- 현재 참여하려는 팟의 정원 정보를 잠금(FOR UPDATE) 상태로 가져옵니다. 
  -- (동시에 여러 명이 접근해도 한 명씩 순서대로 처리되도록 만듦)
  SELECT current_member, max_member 
  INTO v_current_member, v_max_member
  FROM public.parties 
  WHERE id = NEW.party_id 
  FOR UPDATE;

  -- 만약 현재 멤버 수가 최대 멤버 수 이상이라면 튕겨냅니다.
  IF v_current_member >= v_max_member THEN
    RAISE EXCEPTION '이 팟은 이미 정원이 마감되었습니다.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 기존 트리거 삭제
DROP TRIGGER IF EXISTS ensure_party_capacity ON public.party_members;

-- 3. 참여(INSERT) 전(BEFORE)에 검사하는 트리거 부착
CREATE TRIGGER ensure_party_capacity
BEFORE INSERT ON public.party_members
FOR EACH ROW
EXECUTE FUNCTION public.check_party_capacity();
