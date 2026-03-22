-- 신고 테이블
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN ('노쇼', '지각', '불쾌한 언행', '성희롱', '사기', '기타')),
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 같은 팟에서 동일 유저를 중복 신고 방지
CREATE UNIQUE INDEX IF NOT EXISTS reports_unique_per_party
  ON reports (reporter_id, reported_user_id, party_id);

-- 칭찬 테이블
CREATE TABLE IF NOT EXISTS praises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  praiser_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  praised_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 같은 팟에서 동일 유저를 중복 칭찬 방지
CREATE UNIQUE INDEX IF NOT EXISTS praises_unique_per_party
  ON praises (praiser_id, praised_user_id, party_id);

-- users 테이블에 manner_score가 없으면 추가 (이미 있을 수 있으므로 IF NOT EXISTS 불가 → DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'manner_score'
  ) THEN
    ALTER TABLE users ADD COLUMN manner_score NUMERIC(4,1) DEFAULT 36.5;
  END IF;
END $$;

-- is_admin 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- RLS 활성화
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE praises ENABLE ROW LEVEL SECURITY;

-- reports 정책
CREATE POLICY "Users can insert own reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can read own sent reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can read all reports" ON reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- praises 정책
CREATE POLICY "Users can insert own praises" ON praises
  FOR INSERT WITH CHECK (auth.uid() = praiser_id);

CREATE POLICY "Users can read praises" ON praises
  FOR SELECT USING (true);

-- 매너온도 증감 함수 (보안: SECURITY DEFINER로 RLS 우회)
CREATE OR REPLACE FUNCTION increment_manner_score(target_user_id UUID, delta NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET manner_score = GREATEST(0, LEAST(99, COALESCE(manner_score, 36.5) + delta))
  WHERE id = target_user_id;
END;
$$;
