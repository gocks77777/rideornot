-- =========================================================================
-- 성별(gender) 수정 방지(Lock) 트리거
-- 이 쿼리를 Supabase 대시보드 -> [SQL Editor] 에 붙여넣고 "Run" 하세요!
-- 목적: 사용자가 최초 1회 성별을 선택하면, 이후에는 어떤 방식으로든 성별을 바꿀 수 없게 원천 차단합니다.
-- =========================================================================

-- 1. 성별 변경을 막는 함수 생성
CREATE OR REPLACE FUNCTION public.prevent_gender_update()
RETURNS TRIGGER AS $$
BEGIN
  -- 기존(OLD) 데이터의 gender가 null이 아니면서, 새로운(NEW) 데이터의 gender가 기존과 다를 경우 에러 발생
  IF OLD.gender IS NOT NULL AND NEW.gender IS DISTINCT FROM OLD.gender THEN
    RAISE EXCEPTION '성별(gender)은 최초 1회 설정 후 변경할 수 없습니다.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 기존에 트리거가 있다면 삭제 (중복 생성 방지)
DROP TRIGGER IF EXISTS ensure_gender_immutable ON public.users;

-- 3. users 테이블에 업데이트(UPDATE) 이벤트가 발생하기 전에 위 함수를 실행하는 트리거 부착
CREATE TRIGGER ensure_gender_immutable
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_gender_update();

-- =========================================================================
-- 완료! 이제 해커가 개발자 도구를 조작해 강제로 성별을 바꾸려고 시도해도 DB에서 에러를 내며 튕겨냅니다.
