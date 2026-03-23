-- 출발 시간이 1시간 이상 지난 recruiting/full/departed 팟을 자동으로 completed 처리
-- Supabase 대시보드 → SQL Editor에서 실행하거나, pg_cron 익스텐션이 활성화된 경우 자동 스케줄로 실행

-- 1. 자동 완료 함수
CREATE OR REPLACE FUNCTION auto_complete_parties()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE parties
  SET status = 'completed'
  WHERE status IN ('recruiting', 'full', 'departed')
    AND departure_time < NOW() - INTERVAL '1 hour';
END;
$$;

-- 2. pg_cron 스케줄 등록 (매 10분마다 실행)
-- Supabase에서 pg_cron 익스텐션이 활성화되어 있어야 합니다.
-- 대시보드 → Database → Extensions → pg_cron 활성화 후 실행하세요.
SELECT cron.schedule(
  'auto-complete-parties',   -- job 이름
  '*/10 * * * *',            -- 매 10분마다
  $$SELECT auto_complete_parties();$$
);
