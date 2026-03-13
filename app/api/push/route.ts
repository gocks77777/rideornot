import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// VAPID 키 설정 (서버 환경 변수에서 가져옴)
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY!;

// 이메일은 푸시 서비스 제공자(구글/애플 등)가 연락할 수 있는 용도로 사용됨
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  publicVapidKey,
  privateVapidKey
);

// 관리자 권한이 있는 Supabase 클라이언트 (서비스 롤 키 필요)
// 사용자의 구독 정보를 읽어오기 위해 사용합니다.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // anon_key 대신 service_role_key 사용
);

export async function POST(req: Request) {
  try {
    const { userId, title, body, url } = await req.json();

    if (!userId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. 해당 유저의 푸시 구독 정보(Endpoint 등)를 DB에서 가져옵니다.
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
        // 구독이 만료되었거나 취소된 경우(HTTP 410, 404), DB에서 삭제 처리
        if (err.statusCode === 404 || err.statusCode === 410) {
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
