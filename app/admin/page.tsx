'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

async function adminAction(action: string, payload: object) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/admin/action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify({ action, payload }),
  });
  return res.json();
}
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Trash2, ShieldAlert, ArrowRight, CheckCircle, XCircle, Ban, Users, BarChart3 } from 'lucide-react';

const ADMIN_EMAILS = ['gocks77777@naver.com'];

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [pods, setPods] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalPods: 0, activePods: 0, totalUsers: 0, totalReports: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      const admin = ADMIN_EMAILS.includes(u?.email || '');
      setIsAdmin(admin);
      if (admin) fetchAll();
      setLoading(false);
    });
  }, []);

  const fetchAll = async () => {
    const [podsRes, commentsRes, reportsRes, usersRes] = await Promise.all([
      supabase.from('parties').select('*, host:users!parties_host_id_fkey(nickname)').order('departure_time', { ascending: false }).limit(100),
      supabase.from('comments').select('*, user:users(nickname), party:parties(start_point, end_point)').order('created_at', { ascending: false }).limit(200),
      supabase.from('reports').select('*, reporter:users!reports_reporter_id_fkey(nickname), reported:users!reports_reported_user_id_fkey(nickname, manner_score)').order('created_at', { ascending: false }).limit(200),
      supabase.from('users').select('id, nickname, email, manner_score, is_banned, created_at').order('created_at', { ascending: false }).limit(200),
    ]);
    if (podsRes.data) {
      setPods(podsRes.data);
      setStats(prev => ({
        ...prev,
        totalPods: podsRes.data.length,
        activePods: podsRes.data.filter((p: any) => p.status === 'recruiting').length
      }));
    }
    if (commentsRes.data) setComments(commentsRes.data);
    if (reportsRes.data) setReports(reportsRes.data);
    if (usersRes.data) {
      setUsers(usersRes.data);
      setStats(prev => ({ ...prev, totalUsers: usersRes.data.length }));
    }
    if (reportsRes.data) setStats(prev => ({ ...prev, totalReports: reportsRes.data.length }));
  };

  const deleteComment = async (id: string) => {
    const result = await adminAction('deleteComment', { commentId: id });
    if (result.error) { toast.error('삭제 실패: ' + result.error); return; }
    setComments(prev => prev.filter(c => c.id !== id));
    toast.success('댓글이 삭제됐습니다.');
  };

  const cancelPod = async (id: string) => {
    const result = await adminAction('cancelPod', { podId: id });
    if (result.error) { toast.error('취소 실패: ' + result.error); return; }
    setPods(prev => prev.map(p => p.id === id ? { ...p, status: 'cancelled' } : p));
    toast.success('팟이 취소됐습니다.');
  };

  // 신고 확정 → 피신고자 매너온도 -1
  const confirmReport = async (report: any) => {
    const result = await adminAction('confirmReport', { reportId: report.id, reportedUserId: report.reported_user_id });
    if (result.error) { toast.error('처리 실패: ' + result.error); return; }
    setReports(prev => prev.map(r => r.id === report.id ? { ...r, resolved: true, resolution: 'confirmed' } : r));
    toast.success(`신고 확정 - ${report.reported?.nickname}님 매너온도 -1`);
  };

  // 허위 신고 → 신고자 매너온도 -0.5
  const dismissReport = async (report: any) => {
    const result = await adminAction('dismissReport', { reportId: report.id, reporterId: report.reporter_id });
    if (result.error) { toast.error('처리 실패: ' + result.error); return; }
    setReports(prev => prev.map(r => r.id === report.id ? { ...r, resolved: true, resolution: 'dismissed' } : r));
    toast.success(`허위 신고 처리 - ${report.reporter?.nickname}님 매너온도 -0.5`);
  };

  // 사용자 정지/정지 해제
  const toggleBan = async (userId: string, isBanned: boolean) => {
    const result = await adminAction('toggleBan', { userId, isBanned });
    if (result.error) { toast.error('처리 실패: ' + result.error); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !isBanned } : u));
    toast.success(isBanned ? '정지가 해제됐습니다.' : '사용자가 정지됐습니다.');
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">로딩 중...</p></div>;

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">로그인이 필요합니다.</p>
    </div>
  );

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <ShieldAlert className="w-16 h-16 text-red-400" />
      <p className="text-xl font-bold text-gray-700">관리자 전용 페이지입니다.</p>
      <p className="text-sm text-gray-500">{user.email}</p>
    </div>
  );

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { recruiting: '모집중', full: '마감', completed: '완료', cancelled: '취소', departed: '출발', closed: '종료' };
    return map[s] || s;
  };

  const pendingReports = reports.filter(r => !r.resolved);
  const resolvedReports = reports.filter(r => r.resolved);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 대시보드</h1>
      <p className="text-sm text-gray-500 mb-8">탈래말래 운영 현황을 확인하고 관리합니다.</p>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-[#3182F6]">{stats.totalPods}</p>
          <p className="text-xs text-gray-600 mt-1">총 팟</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.activePods}</p>
          <p className="text-xs text-gray-600 mt-1">모집중</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{stats.totalUsers}</p>
          <p className="text-xs text-gray-600 mt-1">총 유저</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-red-500">{pendingReports.length}</p>
          <p className="text-xs text-gray-600 mt-1">미처리 신고</p>
        </div>
      </div>

      <Tabs defaultValue="reports">
        <TabsList className="mb-6 flex flex-wrap gap-1">
          <TabsTrigger value="reports">
            신고 관리 {pendingReports.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{pendingReports.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="users">사용자 관리</TabsTrigger>
          <TabsTrigger value="pods">팟 목록</TabsTrigger>
          <TabsTrigger value="comments">댓글 관리</TabsTrigger>
        </TabsList>

        {/* 신고 관리 */}
        <TabsContent value="reports">
          <div className="space-y-4">
            {pendingReports.length === 0 && <p className="text-center text-gray-400 py-8">처리할 신고가 없습니다.</p>}
            {pendingReports.map(r => (
              <div key={r.id} className="bg-red-50 border border-red-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{r.reason}</span>
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-semibold">{r.reporter?.nickname || '?'}</span>
                  <span className="text-gray-500"> → 피신고: </span>
                  <span className="font-semibold">{r.reported?.nickname || '?'}</span>
                  <span className="text-gray-400 ml-2">(매너온도: {r.reported?.manner_score?.toFixed(1)}°C)</span>
                </p>
                {r.detail && <p className="text-xs text-gray-500 mb-3">"{r.detail}"</p>}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => confirmReport(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> 신고 확정 (-1°C)
                  </button>
                  <button
                    onClick={() => dismissReport(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> 허위 신고 (-0.5°C 신고자)
                  </button>
                </div>
              </div>
            ))}

            {resolvedReports.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-400 mb-3">처리 완료된 신고 ({resolvedReports.length}건)</p>
                <div className="space-y-2">
                  {resolvedReports.map(r => (
                    <div key={r.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 opacity-60">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600">
                          <span className="font-semibold">{r.reporter?.nickname}</span> → <span className="font-semibold">{r.reported?.nickname}</span>
                          <span className="ml-2 text-gray-400">({r.reason})</span>
                        </p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.resolution === 'confirmed' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'}`}>
                          {r.resolution === 'confirmed' ? '확정' : '기각'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 사용자 관리 */}
        <TabsContent value="users">
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className={`flex items-center justify-between rounded-xl p-4 gap-4 ${u.is_banned ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#191F28]">
                    {u.nickname || '(닉네임 없음)'}
                    {u.is_banned && <span className="ml-2 text-xs text-red-500 font-bold">정지됨</span>}
                  </p>
                  <p className="text-xs text-gray-500">매너온도: {u.manner_score?.toFixed(1)}°C · 가입: {new Date(u.created_at).toLocaleDateString('ko-KR')}</p>
                </div>
                <button
                  onClick={() => toggleBan(u.id, u.is_banned)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    u.is_banned
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  {u.is_banned ? '정지 해제' : '정지'}
                </button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 팟 목록 */}
        <TabsContent value="pods">
          <div className="space-y-2">
            {pods.map(pod => (
              <div key={pod.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm truncate">{pod.start_point}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="font-semibold text-sm truncate">{pod.end_point}</span>
                  </div>
                  <p className="text-xs text-gray-500">방장: {pod.host?.nickname || '-'} · {pod.current_member}/{pod.max_member}명 · {new Date(pod.departure_time).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${pod.status === 'recruiting' ? 'bg-blue-100 text-blue-700' : pod.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}`}>
                    {statusLabel(pod.status)}
                  </span>
                  {pod.status === 'recruiting' && (
                    <button
                      onClick={() => cancelPod(pod.id)}
                      className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 transition-colors"
                    >
                      강제취소
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 댓글 관리 */}
        <TabsContent value="comments">
          <p className="text-xs text-gray-500 mb-4">욕설, 성희롱 등 부적절한 댓글을 삭제하세요.</p>
          <div className="space-y-2">
            {comments.map(c => (
              <div key={c.id} className="flex items-start justify-between bg-gray-50 rounded-xl p-4 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-700">{c.user?.nickname || '익명'}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">{c.party?.start_point} → {c.party?.end_point}</span>
                  </div>
                  <p className="text-sm text-gray-800 break-words">{c.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString('ko-KR')}</p>
                </div>
                <button
                  onClick={() => deleteComment(c.id)}
                  className="flex-shrink-0 p-2 bg-red-100 text-red-500 rounded-xl hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {comments.length === 0 && <p className="text-center text-gray-400 py-8">댓글이 없습니다.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
