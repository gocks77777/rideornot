-- =========================================================================
-- 웹 푸시 알림(Web Push) 구독 정보를 저장하는 테이블 생성 스크립트
-- Supabase SQL Editor에 복사 후 "Run" 하세요
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, endpoint)
);

-- RLS (Row Level Security) 설정
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 구독 정보만 저장하거나 조회할 수 있습니다.
CREATE POLICY "Users can manage own push subscriptions." 
ON public.push_subscriptions FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 알림을 보내는 서버(Service Role)에서는 모든 데이터를 읽을 수 있게 허용
-- (Supabase 관리자 키를 사용하면 기본적으로 무시되지만 명시적으로 추가 가능)
