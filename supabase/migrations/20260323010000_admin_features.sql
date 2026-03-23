-- 사용자 정지 컬럼
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_banned'
  ) THEN
    ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 신고 처리 결과 컬럼
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'resolved'
  ) THEN
    ALTER TABLE reports ADD COLUMN resolved BOOLEAN DEFAULT false;
    ALTER TABLE reports ADD COLUMN resolution TEXT CHECK (resolution IN ('confirmed', 'dismissed'));
  END IF;
END $$;

-- 정지된 사용자의 RLS: 팟 생성 불가 (선택적 - 현재는 클라이언트 체크로 대체 가능)
-- 정지 상태는 클라이언트에서 로그인 시 체크하여 처리
