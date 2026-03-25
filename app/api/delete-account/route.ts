import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    // Auth 계정 먼저 삭제 (실패 시 users 테이블은 그대로 유지 → 데이터 불일치 없음)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

    // Auth 삭제 성공 후 users 테이블 삭제 (CASCADE로 party_members, praises, reports 등 연쇄 삭제)
    const { error: dbError } = await supabaseAdmin.from('users').delete().eq('id', userId);
    if (dbError) {
      // Auth는 이미 삭제됐으므로 로그인 불가 상태 — 클라이언트엔 성공 반환
      console.error('[delete-account] users 테이블 삭제 실패 (고아 행 발생):', dbError.message);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
