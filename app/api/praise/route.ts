import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server config missing' }, { status: 500 });
    }

    // 인증 검증
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { targetId, partyId } = await request.json();
    if (!targetId || !partyId) return NextResponse.json({ error: 'targetId, partyId required' }, { status: 400 });

    // UUID 형식 검증
    if (!isValidUUID(targetId) || !isValidUUID(partyId)) {
      return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
    }

    // 자기 자신 칭찬 방지
    if (authUser.id === targetId) return NextResponse.json({ error: 'Cannot praise yourself' }, { status: 400 });

    // 해당 파티가 completed 상태인지 확인
    const { data: party } = await supabaseAdmin
      .from('parties')
      .select('id, status')
      .eq('id', partyId)
      .single();
    if (!party) return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    if (party.status !== 'completed') {
      return NextResponse.json({ error: 'Party is not completed' }, { status: 400 });
    }

    // 칭찬하는 사람과 받는 사람 모두 해당 파티의 멤버인지 확인
    const { data: members } = await supabaseAdmin
      .from('party_members')
      .select('user_id')
      .eq('party_id', partyId)
      .in('status', ['joined', 'paid']);

    const memberIds = (members || []).map(m => m.user_id);

    // 방장도 포함 (party_members에 없을 수 있으므로)
    const { data: partyHost } = await supabaseAdmin
      .from('parties')
      .select('host_id')
      .eq('id', partyId)
      .single();
    if (partyHost?.host_id && !memberIds.includes(partyHost.host_id)) {
      memberIds.push(partyHost.host_id);
    }

    if (!memberIds.includes(authUser.id)) {
      return NextResponse.json({ error: 'You are not a member of this party' }, { status: 403 });
    }
    if (!memberIds.includes(targetId)) {
      return NextResponse.json({ error: 'Target is not a member of this party' }, { status: 403 });
    }

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
