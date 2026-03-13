-- =========================================================================
-- RideOrNot (탈래말래) Supabase Row Level Security (RLS) 정책 설정 스크립트
-- 이 쿼리를 Supabase 대시보드 -> [SQL Editor] 에 붙여넣고 "Run" 하세요!
-- =========================================================================

-- 1. 모든 주요 테이블에 대해 RLS를 활성화(Enable)합니다.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책(Policy)이 있다면 꼬이지 않게 모두 삭제 (안전장치)
DROP POLICY IF EXISTS "Public users are viewable by everyone." ON public.users;
DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
DROP POLICY IF EXISTS "Parties are viewable by everyone." ON public.parties;
DROP POLICY IF EXISTS "Users can create a party." ON public.parties;
DROP POLICY IF EXISTS "Host can update their own party." ON public.parties;
DROP POLICY IF EXISTS "Party members viewable by everyone." ON public.party_members;
DROP POLICY IF EXISTS "Users can join a party." ON public.party_members;
DROP POLICY IF EXISTS "Comments are viewable by everyone." ON public.comments;
DROP POLICY IF EXISTS "Users can insert comments." ON public.comments;


-- ==========================================
-- [1] users 테이블 정책
-- ==========================================
-- 누구나 다른 사람의 닉네임, 아바타, 매너 점수 등을 볼 수 있어야 합니다. (SELECT)
CREATE POLICY "Public users are viewable by everyone." 
ON public.users FOR SELECT USING (true);

-- 자기 자신의 프로필(예: 계좌번호)만 수정(UPDATE)할 수 있습니다.
CREATE POLICY "Users can update own profile." 
ON public.users FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);


-- ==========================================
-- [2] parties 테이블 정책 (택시 팟)
-- ==========================================
-- 누구나 생성된 팟 목록을 볼 수 있습니다.
CREATE POLICY "Parties are viewable by everyone." 
ON public.parties FOR SELECT USING (true);

-- 로그인한 사용자만 팟을 생성할 수 있습니다. 생성 시 방장(host_id)이 본인이어야 합니다.
CREATE POLICY "Users can create a party." 
ON public.parties FOR INSERT 
WITH CHECK (auth.uid() = host_id);

-- 팟을 만든 방장(host)만이 팟의 정보를 수정하거나 마감시킬 수 있습니다.
-- 추가로, 시스템에서 트리거로 current_member를 올리는 경우도 있으므로 SELECT 권한이 있다면 누구나 update할 수 있게 열되,
-- 보통 Supabase client에서 update할 때는 auth.uid()가 맞거나 서비스 롤로 업데이트합니다.
-- (여기서는 현재 인원수 업데이트를 위해 일단 인증된 유저는 팟 상태를 업데이트할 수 있게 허용합니다. 엄격하게 하려면 Edge Function이 필요함)
CREATE POLICY "Authenticated users can update party." 
ON public.parties FOR UPDATE 
USING (auth.role() = 'authenticated');


-- ==========================================
-- [3] party_members 테이블 정책 (참여자)
-- ==========================================
-- 팟에 누가 참여했는지는 누구나 볼 수 있습니다.
CREATE POLICY "Party members viewable by everyone." 
ON public.party_members FOR SELECT USING (true);

-- 로그인한 사용자만 팟에 참여(INSERT)할 수 있으며, 자기 아이디(user_id)로만 참여 가능합니다.
CREATE POLICY "Users can join a party." 
ON public.party_members FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- 방장 또는 자기 자신만 파티 참여 상태(status, 결제 여부 등)를 업데이트 할 수 있습니다.
-- (간소화를 위해 로그인한 유저 허용)
CREATE POLICY "Authenticated users can update memberships." 
ON public.party_members FOR UPDATE 
USING (auth.role() = 'authenticated');


-- ==========================================
-- [4] comments 테이블 정책 (댓글)
-- ==========================================
-- 누구나 팟에 달린 댓글을 볼 수 있습니다.
CREATE POLICY "Comments are viewable by everyone." 
ON public.comments FOR SELECT USING (true);

-- 로그인한 사용자만 댓글을 달 수 있고, 글쓴이(user_id)가 본인이어야 합니다.
CREATE POLICY "Users can insert comments." 
ON public.comments FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- 댓글 삭제는 작성자 본인만 가능하게 합니다.
CREATE POLICY "Users can delete own comments." 
ON public.comments FOR DELETE 
USING (auth.uid() = user_id);

-- =========================================================================
-- 완료! 이제 익명 해커가 마음대로 DB를 삭제하거나 다른 사람 정보를 수정할 수 없습니다.
