'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Trash2, ShieldAlert, ArrowRight } from 'lucide-react';

// 관리자 이메일 목록 (환경변수로 설정 가능)
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [pods, setPods] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      const email = u?.email || '';
      const admin = ADMIN_EMAILS.includes(email) || email.endsWith('@탈래말래.kr');
      setIsAdmin(admin);
      if (admin) fetchAll();
      setLoading(false);
    });
  }, []);

  const fetchAll = async () => {
    const [podsRes, commentsRes, reportsRes] = await Promise.all([
      supabase.from('parties').select('*, host:users!parties_host_id_fkey(nickname, email)').order('created_at', { ascending: false }).limit(100),
      supabase.from('comments').select('*, user:users(nickname), party:parties(start_point, end_point)').order('created_at', { ascending: false }).limit(200),
      supabase.from('reports').select('*, reporter:users!reports_reporter_id_fkey(nickname), reported:users!reports_reported_user_id_fkey(nickname, manner_score)').order('created_at', { ascending: false }).limit(200),
    ]);
    if (podsRes.data) setPods(podsRes.data);
    if (commentsRes.data) setComments(commentsRes.data);
    if (reportsRes.data) setReports(reportsRes.data);
  };

  const deleteComment = async (id: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) { toast.error('삭제 실패: ' + error.message); return; }
    setComments(prev => prev.filter(c => c.id !== id));
    toast.success('댓글이 삭제됐습니다.');
  };

  const cancelPod = async (id: string) => {
    const { error } = await supabase.from('parties').update({ status: 'cancelled' }).eq('id', id);
    if (error) { toast.error('취소 실패: ' + error.message); return; }
    setPods(prev => prev.map(p => p.id === id ? { ...p, status: 'cancelled' } : p));
    toast.success('팟이 취소됐습니다.');
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 대시보드</h1>
      <p className="text-sm text-gray-500 mb-8">탈래말래 운영 현황을 확인하고 관리합니다.</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-[#3182F6]">{pods.length}</p>
          <p className="text-sm text-gray-600 mt-1">총 팟</p>
        </div>
        <div className="bg-orange-50 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-orange-500">{comments.length}</p>
          <p className="text-sm text-gray-600 mt-1">총 댓글</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-red-500">{reports.length}</p>
          <p className="text-sm text-gray-600 mt-1">총 신고</p>
        </div>
      </div>

      <Tabs defaultValue="pods">
        <TabsList className="mb-6">
          <TabsTrigger value="pods">팟 목록</TabsTrigger>
          <TabsTrigger value="comments">댓글 관리</TabsTrigger>
          <TabsTrigger value="reports">신고 내역</TabsTrigger>
        </TabsList>

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

        {/* 신고 내역 */}
        <TabsContent value="reports">
          <div className="space-y-2">
            {reports.map(r => (
              <div key={r.id} className="bg-red-50 border border-red-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{r.reason}</span>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">{r.reporter?.nickname || '?'}</span>
                  <span className="text-gray-500"> → 신고대상: </span>
                  <span className="font-semibold">{r.reported?.nickname || '?'}</span>
                  <span className="text-gray-400 ml-2">(매너온도: {r.reported?.manner_score?.toFixed(1)}°C)</span>
                </p>
                {r.detail && <p className="text-xs text-gray-500 mt-1">"{r.detail}"</p>}
              </div>
            ))}
            {reports.length === 0 && <p className="text-center text-gray-400 py-8">신고 내역이 없습니다.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
