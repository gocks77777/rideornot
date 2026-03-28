import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// VAPID 키 설정 (서버 환경 변수에서 가져옴)
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY!;

// 이메일은 푸시 서비스 제공자(구글/애플 등)가 연락할 수 있는 용도로 사용됨
if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(
    'mailto:gocks77777@naver.com',
    publicVapidKey,
    privateVapidKey
  );
} else {
  console.warn('VAPID keys are missing. Push notifications will not work.');
}

// 관리자 권한이 있는 Supabase 클라이언트 (서비스 롤 키 필요)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// UUID v4 형식 검증
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function POST(req: Request) {
  try {
    // 로그인한 사용자만 푸시 발송 가능
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });
    }

    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId, title, body, url } = await req.json();

    if (!userId || typeof userId !== 'string' || !isValidUUID(userId)) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }
    if (!title || typeof title !== 'string' || title.length > 200) {
      return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
    }
    if (body && (typeof body !== 'string' || body.length > 500)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    // 발신자-수신자 관계 검증: 같은 파티에 속해있는 경우만 허용
    // (자기 자신에게 보내는 것도 차단)
    if (authUser.id === userId) {
      return NextResponse.json({ error: 'Cannot send push to yourself' }, { status: 400 });
    }

    // 발신자가 참여 중인 파티 목록
    const { data: senderParties } = await supabaseAdmin
      .from('party_members')
      .select('party_id')
      .eq('user_id', authUser.id);

    // 발신자가 방장인 파티 목록
    const { data: senderHostParties } = await supabaseAdmin
      .from('parties')
      .select('id')
      .eq('host_id', authUser.id);

    const senderPartyIds = new Set([
      ...(senderParties || []).map(p => p.party_id),
      ...(senderHostParties || []).map(p => p.id),
    ]);

    // 수신자가 참여 중인 파티 목록
    const { data: receiverParties } = await supabaseAdmin
      .from('party_members')
      .select('party_id')
      .eq('user_id', userId);

    // 수신자가 방장인 파티 목록
    const { data: receiverHostParties } = await supabaseAdmin
      .from('parties')
      .select('id')
      .eq('host_id', userId);

    const receiverPartyIds = new Set([
      ...(receiverParties || []).map(p => p.party_id),
      ...(receiverHostParties || []).map(p => p.id),
    ]);

    // 교집합 확인 — 최소 하나의 공통 파티가 있어야 함
    const hasCommonParty = Array.from(senderPartyIds).some(id => receiverPartyIds.has(id));
    if (!hasCommonParty) {
      return NextResponse.json({ error: 'No common party with target user' }, { status: 403 });
    }

    // 1. 해당 유저의 푸시 구독 정보를 DB에서 가져옴
    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to fetch subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'User has no push subscriptions' }, { status: 200 });
    }

    // 2. 알림 내용 구성
    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
    });

    // 3. 사용자의 모든 기기(구독)에 푸시 알림 발송
    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err: any) {
        console.error('Error sending push to endpoint', sub.endpoint, err);
        if ((err.statusCode === 404 || err.statusCode === 410) && supabaseAdmin) {
          await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, message: 'Push notifications sent' });
  } catch (error) {
    console.error('Push API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
