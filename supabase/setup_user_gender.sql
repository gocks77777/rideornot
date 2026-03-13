-- =========================================================================
-- [1단계] users 테이블에 gender(성별) 컬럼 추가 스크립트
-- Supabase SQL Editor에 복사 후 "Run" 하세요!
-- =========================================================================

-- 1. users 테이블에 gender 컬럼이 없다면 추가합니다. (기본값은 null)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', null));

-- 2. 기존의 RLS 정책 중 프로필 업데이트 부분에서 gender 업데이트도 허용되어 있는지 확인/보강
-- (이전에 설정한 "Users can update own profile." 정책이 있으므로, 별도의 추가 정책 없이 
--  자신의 id와 일치하면 gender 값도 업데이트가 가능합니다.)

-- 잘 적용되었는지 확인하는 용도 (결과에 gender 컬럼이 보여야 합니다)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'gender';
