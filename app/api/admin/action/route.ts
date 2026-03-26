import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyAdmin(token: string): Promise<boolean> {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return false;
  const { data } = await supabaseAdmin.from('users').select('is_admin').eq('id', user.id).single();
  return data?.is_admin === true;
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = await verifyAdmin(token);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { action, payload } = await request.json();

    switch (action) {
      case 'ping':
        return NextResponse.json({ isAdmin: true });
      case 'confirmReport': {
        const { reportId, reportedUserId } = payload;
        await supabaseAdmin.rpc('increment_manner_score', { target_user_id: reportedUserId, delta: -1 });
        await supabaseAdmin.from('reports').update({ resolved: true, resolution: 'confirmed' }).eq('id', reportId);
        return NextResponse.json({ success: true });
      }
      case 'dismissReport': {
        const { reportId, reporterId } = payload;
        await supabaseAdmin.rpc('increment_manner_score', { target_user_id: reporterId, delta: -0.5 });
        await supabaseAdmin.from('reports').update({ resolved: true, resolution: 'dismissed' }).eq('id', reportId);
        return NextResponse.json({ success: true });
      }
      case 'toggleBan': {
        const { userId, isBanned } = payload;
        const { error } = await supabaseAdmin.from('users').update({ is_banned: !isBanned }).eq('id', userId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }
      case 'deleteComment': {
        const { commentId } = payload;
        const { error } = await supabaseAdmin.from('comments').delete().eq('id', commentId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }
      case 'cancelPod': {
        const { podId } = payload;
        const { error } = await supabaseAdmin.from('parties').update({ status: 'cancelled' }).eq('id', podId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
