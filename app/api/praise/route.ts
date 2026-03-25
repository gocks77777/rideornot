import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 인증 검증
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { targetId, partyId } = await request.json();
    if (!targetId || !partyId) return NextResponse.json({ error: 'targetId, partyId required' }, { status: 400 });

    // 자기 자신 칭찬 방지
    if (authUser.id === targetId) return NextResponse.json({ error: 'Cannot praise yourself' }, { status: 400 });

    // praises 삽입 (중복은 unique 제약으로 막힘)
    const { error: insertError } = await supabaseAdmin.from('praises').insert({
      praiser_id: authUser.id,
      praised_user_id: targetId,
      party_id: partyId,
    });

    if (insertError) {
      if (insertError.code === '23505') return NextResponse.json({ alreadyPraised: true });
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // delta는 서버에서 고정 (클라이언트 조작 불가)
    await supabaseAdmin.rpc('increment_manner_score', { target_user_id: targetId, delta: 0.5 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
