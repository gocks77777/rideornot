import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// UUID v4 형식 검증
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function verifyAdmin(token: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return false;
  const { data } = await supabaseAdmin.from('users').select('is_admin').eq('id', user.id).single();
  return data?.is_admin === true;
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server config missing' }, { status: 500 });
    }

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = await verifyAdmin(token);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { action, payload } = body;

    if (!action || typeof action !== 'string') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    if (action !== 'ping' && (!payload || typeof payload !== 'object')) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    switch (action) {
      case 'ping':
        return NextResponse.json({ isAdmin: true });

      case 'confirmReport': {
        const { reportId, reportedUserId } = payload;
        if (!reportId || !isValidUUID(reportId) || !reportedUserId || !isValidUUID(reportedUserId)) {
          return NextResponse.json({ error: 'Invalid reportId or reportedUserId' }, { status: 400 });
        }
        // 해당 report가 실제 존재하고 아직 미처리인지 확인
        const { data: report } = await supabaseAdmin.from('reports').select('id, resolved, reported_user_id').eq('id', reportId).single();
        if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        if (report.resolved) return NextResponse.json({ error: 'Report already resolved' }, { status: 400 });
        if (report.reported_user_id !== reportedUserId) {
          return NextResponse.json({ error: 'reportedUserId mismatch' }, { status: 400 });
        }

        await supabaseAdmin.rpc('increment_manner_score', { target_user_id: reportedUserId, delta: -1 });
        await supabaseAdmin.from('reports').update({ resolved: true, resolution: 'confirmed' }).eq('id', reportId);
        return NextResponse.json({ success: true });
      }

      case 'dismissReport': {
        const { reportId, reporterId } = payload;
        if (!reportId || !isValidUUID(reportId) || !reporterId || !isValidUUID(reporterId)) {
          return NextResponse.json({ error: 'Invalid reportId or reporterId' }, { status: 400 });
        }
        // 해당 report가 실제 존재하고 아직 미처리인지 확인
        const { data: report } = await supabaseAdmin.from('reports').select('id, resolved, reporter_id').eq('id', reportId).single();
        if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        if (report.resolved) return NextResponse.json({ error: 'Report already resolved' }, { status: 400 });
        if (report.reporter_id !== reporterId) {
          return NextResponse.json({ error: 'reporterId mismatch' }, { status: 400 });
        }

        await supabaseAdmin.rpc('increment_manner_score', { target_user_id: reporterId, delta: -0.5 });
        await supabaseAdmin.from('reports').update({ resolved: true, resolution: 'dismissed' }).eq('id', reportId);
        return NextResponse.json({ success: true });
      }

      case 'toggleBan': {
        const { userId, isBanned } = payload;
        if (!userId || !isValidUUID(userId) || typeof isBanned !== 'boolean') {
          return NextResponse.json({ error: 'Invalid userId or isBanned' }, { status: 400 });
        }
        const { error } = await supabaseAdmin.from('users').update({ is_banned: !isBanned }).eq('id', userId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      case 'deleteComment': {
        const { commentId } = payload;
        if (!commentId || !isValidUUID(commentId)) {
          return NextResponse.json({ error: 'Invalid commentId' }, { status: 400 });
        }
        const { error } = await supabaseAdmin.from('comments').delete().eq('id', commentId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      case 'cancelPod': {
        const { podId } = payload;
        if (!podId || !isValidUUID(podId)) {
          return NextResponse.json({ error: 'Invalid podId' }, { status: 400 });
        }
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
