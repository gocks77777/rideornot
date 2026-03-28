'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Users, Clock, MessageCircle, Plus, Check, Send, CreditCard, Loader2, Flag, ThumbsUp, LogOut } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaymentModal } from '@/components/payment-modal';
import { ReportModal } from '@/components/report-modal';
import { haptics } from '@/lib/haptics';
import { supabase, sendPush, sendPraise } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  paid?: boolean;
  memberStatus?: 'pending' | 'joined' | 'paid' | 'rejected';
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  createdAt: string;
}

interface PendingMember {
  userId: string;
  name: string;
  avatar?: string;
}

interface PodDetailProps {
  pod: {
    id: string;
    hostId?: string;
    departure: string;
    departureDetail?: string;
    destination: string;
    startLat?: number;
    startLng?: number;
    endLat?: number;
    endLng?: number;
    currentMembers: number;
    maxMembers: number;
    departureTime: string;
    estimatedCost: number;
    participants: Participant[];
    hostName?: string;
    hostBankAccount?: string;
    hasDeposit?: boolean;
    depositAmount?: number;
    genderFilter?: string;
    status?: string;
  };
  onBack: () => void;
  onJoin?: () => void;
  isHost?: boolean;
  user?: any;
  onLogin?: () => void;
}

export function PodDetail({ pod, onBack, onJoin, isHost = false, user, onLogin }: PodDetailProps) {
  const approvedParticipants = pod.participants.filter(p => p.memberStatus !== 'pending' && p.memberStatus !== 'rejected');
  const emptySlots = pod.maxMembers - approvedParticipants.length;
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showRejectedConfirm, setShowRejectedConfirm] = useState(false);
  const [participantsPaidStatus, setParticipantsPaidStatus] = useState<Record<string, boolean>>(
    pod.participants
      .filter(p => p.memberStatus !== 'pending' && p.memberStatus !== 'rejected')
      .reduce((acc, p) => ({ ...acc, [p.id]: p.paid || false }), {})
  );

  // Confirm dialogs
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);

  // Report modal
  const [reportTarget, setReportTarget] = useState<{ userId: string; userName: string } | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);

  const [realTaxiFare, setRealTaxiFare] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapLoadError, setMapLoadError] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [scrollToBottom, setScrollToBottom] = useState(false);

  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);

  const hasCoords = pod.startLat && pod.startLng && pod.endLat && pod.endLng;
  const displayFare = realTaxiFare || pod.estimatedCost;
  const costPerPerson = Math.round(displayFare / pod.maxMembers);

  // 방장일 때 pending 멤버 조회
  useEffect(() => {
    if (!isHost || !pod.hasDeposit) return;
    const fetchPending = async () => {
      const { data: memberRows } = await supabase
        .from('party_members')
        .select('user_id')
        .eq('party_id', pod.id)
        .eq('status', 'pending');
      if (!memberRows || memberRows.length === 0) { setPendingMembers([]); return; }

      const userIds = memberRows.map((m: any) => m.user_id);
      const { data: userRows } = await supabase
        .from('users')
        .select('id, nickname, avatar_url')
        .in('id', userIds);

      const userMap: Record<string, { nickname: string; avatar_url: string }> = {};
      userRows?.forEach((u: any) => { userMap[u.id] = u; });

      setPendingMembers(memberRows.map((m: any) => ({
        userId: m.user_id,
        name: userMap[m.user_id]?.nickname || '멤버',
        avatar: userMap[m.user_id]?.avatar_url || ''
      })));
    };
    fetchPending();
  }, [isHost, pod.hasDeposit, pod.id]);

  const handleApproveMember = async (userId: string) => {
    const { data, error } = await supabase.rpc('approve_member', {
      p_party_id: pod.id,
      p_user_id: userId,
    });
    if (error) { toast.error('승인 실패: ' + error.message); return; }
    if (data?.error === 'full') { toast.error('이미 가득 찬 팟입니다.'); return; }

    setPendingMembers(prev => prev.filter(m => m.userId !== userId));
    haptics.success();
    toast.success('멤버를 승인했어요!');
    sendPush({
      userId,
      title: '참여 승인됐어요! 🎉',
      body: `${pod.departure} → ${pod.destination} 팟 참여가 승인됐어요!`,
      url: `/?pod=${pod.id}`
    });
  };

  const handleRejectMember = async (userId: string) => {
    const { error } = await supabase
      .from('party_members')
      .update({ status: 'rejected' })
      .eq('party_id', pod.id)
      .eq('user_id', userId);
    if (error) { toast.error('거절 실패: ' + error.message); return; }
    setPendingMembers(prev => prev.filter(m => m.userId !== userId));
    haptics.light();
    toast.info('신청을 거절했어요.');
    sendPush({
      userId,
      title: '참여 신청 거절',
      body: `${pod.departure} → ${pod.destination} 팟 참여가 거절됐어요. 예약금은 돌려받으세요.`,
      url: `/?pod=${pod.id}`
    });
  };

  // 팟 나가기
  const handleLeavePod = async () => {
    if (!user) return;
    setIsLeaving(true);
    const { error } = await supabase
      .from('party_members')
      .delete()
      .eq('party_id', pod.id)
      .eq('user_id', user.id);
    setIsLeaving(false);
    if (error) { toast.error('나가기 실패: ' + error.message); return; }
    // current_member와 status는 trg_sync_party_member_count 트리거가 자동 처리

    haptics.medium();
    toast.success('팟에서 나왔어요.');

    // 방장에게 알림
    if (pod.hostId) {
      const leaverName = user.user_metadata?.full_name || user.user_metadata?.name || '누군가';
      sendPush({
        userId: pod.hostId,
        title: '멤버가 나갔어요 😢',
        body: `${leaverName}님이 ${pod.departure} → ${pod.destination} 팟에서 나갔어요.`,
        url: `/?pod=${pod.id}`
      });
    }

    onBack();
  };

  // Naver Map 초기화
  useEffect(() => {
    if (!hasCoords || !mapRef.current) return;

    const initMap = async () => {
      try {
        const naver = (window as any).naver;
        if (!naver?.maps) return;

        const startPos = new naver.maps.LatLng(pod.startLat, pod.startLng);
        const endPos = new naver.maps.LatLng(pod.endLat, pod.endLng);
        const centerLat = ((pod.startLat || 0) + (pod.endLat || 0)) / 2;
        const centerLng = ((pod.startLng || 0) + (pod.endLng || 0)) / 2;
        const center = new naver.maps.LatLng(centerLat, centerLng);

        const map = new naver.maps.Map(mapRef.current, {
          center,
          zoom: 12,
          mapDataControl: false,
          scaleControl: false,
          mapTypeControl: false,
          zoomControl: false,
          draggable: false,
          scrollWheel: false,
          keyboardShortcuts: false,
          disableDoubleClickZoom: true,
          logoControlOptions: { position: naver.maps.Position.TOP_LEFT }
        });

        const bounds = new naver.maps.LatLngBounds(startPos, endPos);
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });

        new naver.maps.Marker({
          position: startPos, map,
          icon: {
            content: `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 6px rgba(49,130,246,0.45));"><div style="background:#3182F6;color:white;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;">출발</div><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #3182F6;margin-top:-1px;"></div></div>`,
            anchor: new naver.maps.Point(25, 37)
          }
        });

        new naver.maps.Marker({
          position: endPos, map,
          icon: {
            content: `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 6px rgba(255,165,0,0.45));"><div style="background:#FFA500;color:white;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;">도착</div><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #FFA500;margin-top:-1px;"></div></div>`,
            anchor: new naver.maps.Point(25, 37)
          }
        });

        try {
          const res = await fetch(`/api/directions?startLat=${pod.startLat}&startLng=${pod.startLng}&endLat=${pod.endLat}&endLng=${pod.endLng}`);
          const data = await res.json();
          if (data.path && data.path.length > 0) {
            const routePath = data.path.map((coord: number[]) => new naver.maps.LatLng(coord[1], coord[0]));
            new naver.maps.Polyline({ map, path: routePath, strokeColor: '#1a56c4', strokeWeight: 10, strokeOpacity: 0.25, strokeLineCap: 'round', strokeLineJoin: 'round' });
            new naver.maps.Polyline({ map, path: routePath, strokeColor: '#3182F6', strokeWeight: 7, strokeOpacity: 1, strokeLineCap: 'round', strokeLineJoin: 'round' });
            const routeBounds = new naver.maps.LatLngBounds();
            routePath.forEach((p: any) => routeBounds.extend(p));
            map.fitBounds(routeBounds, { top: 60, right: 40, bottom: 40, left: 40 });
            if (data.taxiFare && data.taxiFare > 0) setRealTaxiFare(data.taxiFare);
            if (data.duration) setRouteDuration(Math.round(data.duration / 60000));
            if (data.distance) setRouteDistance(Math.round(data.distance / 100) / 10);
          } else {
            new naver.maps.Polyline({ map, path: [startPos, endPos], strokeColor: '#1E5BBF', strokeWeight: 4, strokeOpacity: 0.8, strokeStyle: 'shortdash', strokeLineCap: 'round', strokeLineJoin: 'round' });
          }
        } catch {
          new naver.maps.Polyline({ map, path: [startPos, endPos], strokeColor: '#1E5BBF', strokeWeight: 4, strokeOpacity: 0.8, strokeStyle: 'shortdash', strokeLineCap: 'round', strokeLineJoin: 'round' });
        }
        setMapLoading(false);
      } catch (e) {
        console.error('Pod detail map error:', e);
      }
    };

    const timer = setTimeout(() => {
      const naver = (window as any).naver;
      if (naver?.maps) {
        initMap();
      } else {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if ((window as any).naver?.maps) { clearInterval(interval); initMap(); }
          else if (attempts > 20) { clearInterval(interval); setMapLoadError(true); setMapLoading(false); }
        }, 300);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [hasCoords, pod.startLat, pod.startLng, pod.endLat, pod.endLng]);

  // 댓글 구독
  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*, user:users(nickname, avatar_url)')
        .eq('party_id', pod.id)
        .order('created_at', { ascending: true });
      if (data) {
        setComments(data.map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          userName: c.user?.nickname || '익명',
          userAvatar: c.user?.avatar_url,
          message: c.message,
          createdAt: formatTimeAgo(c.created_at)
        })));
      }
    };
    fetchComments();

    const channel = supabase
      .channel(`comments-${pod.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `party_id=eq.${pod.id}` }, async (payload: any) => {
        const { data: userData } = await supabase.from('users').select('nickname, avatar_url').eq('id', payload.new.user_id).single();
        setComments(prev => [...prev, {
          id: payload.new.id,
          userId: payload.new.user_id,
          userName: userData?.nickname || '익명',
          userAvatar: userData?.avatar_url,
          message: payload.new.message,
          createdAt: '방금'
        }]);
        setScrollToBottom(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [pod.id]);

  useEffect(() => {
    if (!scrollToBottom) return;
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setScrollToBottom(false);
  }, [scrollToBottom]);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '방금';
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const handleSendComment = async () => {
    if (!commentInput.trim() || !user || isSendingComment) return;
    setIsSendingComment(true);
    const message = commentInput.trim();
    const { error } = await supabase.from('comments').insert({ party_id: pod.id, user_id: user.id, message });
    if (!error) {
      setCommentInput('');
      setScrollToBottom(true);
      const senderName = user.user_metadata?.full_name || user.user_metadata?.name || '누군가';
      const targets = approvedParticipants.filter(p => p.id !== user.id).map(p => p.id);
      if (pod.hostId && pod.hostId !== user.id && !targets.includes(pod.hostId)) targets.push(pod.hostId);
      targets.forEach(targetId => {
        sendPush({
          userId: targetId,
          title: `💬 ${senderName}님의 댓글`,
          body: message.length > 40 ? message.slice(0, 40) + '…' : message,
          url: `/?pod=${pod.id}`
        });
      });
    }
    setIsSendingComment(false);
    haptics.light();
  };

  const togglePaidStatus = async (participantId: string) => {
    const newStatus = !participantsPaidStatus[participantId];
    setParticipantsPaidStatus(prev => ({ ...prev, [participantId]: newStatus }));
    haptics.light();
    const { error } = await supabase
      .from('party_members')
      .update({ status: newStatus ? 'paid' : 'joined' })
      .eq('party_id', pod.id)
      .eq('user_id', participantId);
    if (error) {
      setParticipantsPaidStatus(prev => ({ ...prev, [participantId]: !newStatus }));
      toast.error('송금 상태 변경에 실패했습니다.');
    }
  };

  const handleJoinClick = () => {
    if (!user) { toast.error('로그인이 필요합니다.'); return; }
    const myRecord = pod.participants.find(p => p.id === user?.id);
    if (myRecord && myRecord.memberStatus !== 'rejected') { toast.info('이미 참여한 팟입니다.'); return; }
    haptics.light();
    if (myRecord?.memberStatus === 'rejected') {
      setShowRejectedConfirm(true);
      return;
    }
    if (pod.hasDeposit) {
      setShowPaymentModal(true);
    } else {
      setShowJoinConfirm(true);
    }
  };

  const handlePaymentConfirm = () => {
    setShowPaymentModal(false);
    onJoin?.();
  };

  const handleCancelPod = async () => {
    haptics.heavy();
    setIsCancelling(true);
    const { error } = await supabase
      .from('parties')
      .update({ status: 'cancelled' })
      .eq('id', pod.id)
      .eq('host_id', user.id);
    setIsCancelling(false);

    if (error) {
      toast.error(`팟 취소에 실패했습니다: ${error.message}`);
    } else {
      toast.success('팟이 취소되었습니다.');
      // 승인된 멤버 + 대기 중 멤버 모두에게 알림
      const allMembers = [...approvedParticipants, ...pendingMembers.map(m => ({ id: m.userId }))];
      allMembers.forEach(p => {
        if (p.id === user.id) return;
        sendPush({
          userId: p.id,
          title: '팟이 폭파됐어요 💥',
          body: `${pod.departure} → ${pod.destination} 팟이 방장에 의해 취소되었습니다.`,
          url: '/'
        });
      });
      onBack();
    }
  };

  const handleCompletePod = async () => {
    haptics.success();
    setIsCompleting(true);
    const { error } = await supabase
      .from('parties')
      .update({ status: 'completed' })
      .eq('id', pod.id)
      .eq('host_id', user.id);
    setIsCompleting(false);
    if (error) {
      toast.error(`이용 완료 처리에 실패했습니다: ${error.message}`);
    } else {
      toast.success('이용 완료 처리되었습니다! 🎉');
      onBack();
    }
  };

  // 칭찬하기
  const handlePraise = async (targetId: string, targetName: string) => {
    if (!user) return;
    const result = await sendPraise(targetId, pod.id);
    if (result.alreadyPraised) { toast.info('이미 칭찬한 멤버입니다.'); return; }
    if (result.error) { toast.error('칭찬 전송 실패'); return; }
    toast.success(`${targetName}님을 칭찬했어요! 👍`);
    haptics.success();
  };

  const myParticipation = user ? pod.participants.find(p => p.id === user.id) : null;
  const isMember = !!myParticipation && myParticipation.memberStatus !== 'pending' && myParticipation.memberStatus !== 'rejected';
  const isPending = !!myParticipation && myParticipation.memberStatus === 'pending';
  const isRejected = !!myParticipation && myParticipation.memberStatus === 'rejected';

  const genderLabel = pod.genderFilter === 'male' ? '남성 전용' : pod.genderFilter === 'female' ? '여성 전용' : null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 bg-white z-50 overflow-y-auto pb-24"
      style={{ maxWidth: '480px', margin: '0 auto' }}
    >
      <header className="sticky top-0 bg-white z-[11] px-6 py-3 flex items-center gap-3 border-b border-gray-100" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <button
          onClick={() => { haptics.light(); onBack(); }}
          className="w-10 h-10 rounded-full bg-[#F2F4F6] flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-[#191F28]">팟 상세</h1>
        {genderLabel && (
          <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${pod.genderFilter === 'female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
            {genderLabel}
          </span>
        )}
      </header>

      <div className="px-6 py-6 space-y-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 120px)' }}>
        {/* 지도 */}
        {hasCoords ? (
          <div className="relative rounded-3xl overflow-hidden h-56 bg-gray-100 z-0">
            {mapLoading && !mapLoadError && (
              <div className="absolute inset-0 bg-gray-200 z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-3 border-gray-300 border-t-[#3182F6] rounded-full animate-spin" style={{ borderWidth: '3px' }} />
                  <p className="text-xs text-gray-400 font-medium">경로 불러오는 중...</p>
                </div>
              </div>
            )}
            {mapLoadError && (
              <div className="absolute inset-0 bg-gray-100 z-10 flex items-center justify-center">
                <p className="text-xs text-gray-400">지도를 불러올 수 없습니다.</p>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" />
            {!mapLoading && (routeDuration || routeDistance) && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {routeDuration && (
                  <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5 text-[#3182F6] flex-shrink-0" />
                    <span className="text-xs font-bold text-[#191F28]">약 {routeDuration}분</span>
                  </div>
                )}
                {routeDistance && (
                  <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                    <MapPin className="w-3.5 h-3.5 text-[#3182F6] flex-shrink-0" />
                    <span className="text-xs font-bold text-[#191F28]">{routeDistance}km</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-100 rounded-3xl h-56 flex items-center justify-center z-0">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">위치 정보 없음</p>
            </div>
          </div>
        )}

        {/* 여정 정보 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative z-10">
          <h2 className="text-sm font-semibold text-gray-400 mb-5 tracking-wide">여정 정보</h2>
          <div className="relative pl-3">
            <div className="absolute left-[7px] top-[24px] bottom-[24px] w-[2px] bg-gray-200 border-l-[2px] border-dashed border-gray-300"></div>
            <div className="relative mb-8 flex items-start">
              <div className="absolute -left-3 top-1 w-4 h-4 rounded-full bg-[#3182F6] shadow-[0_0_0_4px_rgba(49,130,246,0.15)] z-10"></div>
              <div className="ml-6 flex-1">
                <span className="text-xs font-bold text-[#3182F6] bg-blue-50 px-2 py-0.5 rounded-md">출발</span>
                <p className="font-bold text-[#191F28] text-[1.1rem] leading-tight mt-1">{pod.departure}</p>
                {pod.departureDetail && (
                  <div className="flex items-center gap-1 mt-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 w-fit">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <p className="text-sm text-gray-600 font-medium">{pod.departureDetail}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="relative flex items-start">
              <div className="absolute -left-3 top-1 w-4 h-4 rounded-full bg-[#FFA500] shadow-[0_0_0_4px_rgba(255,165,0,0.15)] z-10"></div>
              <div className="ml-6 flex-1">
                <span className="text-xs font-bold text-[#FFA500] bg-orange-50 px-2 py-0.5 rounded-md">도착</span>
                <p className="font-bold text-[#191F28] text-[1.1rem] leading-tight mt-1">{pod.destination}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-2 text-[#191F28]">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-gray-600" />
            </div>
            <span className="font-bold text-[15px]">{pod.departureTime} 출발</span>
          </div>
        </div>

        {/* 예약금 안내 (멤버용) */}
        {pod.hasDeposit && !isHost && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="font-bold text-amber-800 mb-1">예약금 필요한 팟이에요</p>
                <p className="text-sm text-amber-700">
                  참여하려면 <span className="font-bold">{(pod.depositAmount || 0).toLocaleString()}원</span>을 먼저 방장 계좌로 송금해주세요.
                  송금 후 방장이 확인하면 참여가 승인됩니다.
                </p>
                {pod.hostBankAccount && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pod.hostBankAccount || '');
                      haptics.medium();
                      toast.success('계좌번호가 복사됐어요!');
                    }}
                    className="mt-2 text-xs bg-amber-200 text-amber-900 px-3 py-1.5 rounded-full font-semibold"
                  >
                    계좌 복사: {pod.hostBankAccount}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 방장 - 승인 대기 멤버 */}
        {isHost && pod.hasDeposit && pendingMembers.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5">
            <h2 className="text-sm font-bold text-amber-800 mb-3">⏳ 승인 대기 {pendingMembers.length}명</h2>
            <div className="space-y-3">
              {pendingMembers.map((m) => (
                <div key={m.userId} className="flex items-center gap-3 bg-white rounded-2xl p-3">
                  {m.avatar ? (
                    <img src={m.avatar} alt={m.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-white font-bold flex-shrink-0">{m.name.charAt(0)}</div>
                  )}
                  <span className="text-sm font-semibold text-[#191F28] flex-1">{m.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleRejectMember(m.userId)} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">거절</button>
                    <button onClick={() => handleApproveMember(m.userId)} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">승인</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 참여자 */}
        <div className="bg-[#F2F4F6] rounded-3xl p-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">참여자</h2>
          <div className="space-y-3">
            {approvedParticipants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-3 bg-white rounded-2xl p-3">
                {participant.avatar ? (
                  <img src={participant.avatar} alt={participant.name} className="w-12 h-12 rounded-full border border-gray-200 flex-shrink-0 object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#3182F6] flex items-center justify-center text-white font-bold flex-shrink-0">{participant.name.charAt(0)}</div>
                )}
                <span className="text-sm font-semibold text-[#191F28] flex-1">{participant.name}</span>

                {/* 방장 전용: 재촉 + 송금 토글 (자기 자신 제외) */}
                {isHost && user && participant.id !== user.id && (
                  <div className="flex items-center gap-1.5">
                    {!participantsPaidStatus[participant.id] && (
                      <button
                        onClick={() => {
                          haptics.medium();
                          sendPush({
                            userId: participant.id,
                            title: '💸 송금 잊으셨나요?',
                            body: `${pod.departure} → ${pod.destination} 팟 택시비 송금을 까먹으신 건 아닌가요?`,
                            url: `/?pod=${pod.id}`
                          });
                          toast.success(`${participant.name}님에게 재촉 알림을 보냈어요!`);
                        }}
                        className="px-2.5 py-1.5 rounded-full text-xs font-medium bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
                      >
                        재촉
                      </button>
                    )}
                    <button
                      onClick={() => togglePaidStatus(participant.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${participantsPaidStatus[participant.id] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {participantsPaidStatus[participant.id] ? <><Check className="w-3 h-3" /><span>송금완료</span></> : <span>미송금</span>}
                    </button>
                  </div>
                )}

                {/* 자기 자신이 아닌 경우: 신고(언제나) + 칭찬(완료 후만) */}
                {user && participant.id !== user.id && (
                  <div className="flex gap-1.5">
                    {pod.status === 'completed' && (
                      <button
                        onClick={() => handlePraise(participant.id, participant.name)}
                        className="p-1.5 rounded-full bg-yellow-50 text-yellow-500 hover:bg-yellow-100 transition-colors"
                        title="칭찬하기"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setReportTarget({ userId: participant.id, userName: participant.name })}
                      className="p-1.5 rounded-full bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                      title="신고하기"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {Array.from({ length: emptySlots }).map((_, index) => (
              <div key={`empty-${index}`} className="flex items-center gap-3 bg-white rounded-2xl p-3 border-2 border-dashed border-gray-200">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-sm text-gray-400">빈자리</span>
              </div>
            ))}
          </div>
        </div>

        {/* 예상 비용 */}
        <div className="bg-[#F2F4F6] rounded-3xl p-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">예상 비용</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">총 택시비 {realTaxiFare ? '(네이버 기준)' : '(예상)'}</span>
              <span className="font-semibold text-[#191F28]">{displayFare.toLocaleString()} 원</span>
            </div>
            {routeDuration && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">예상 소요시간</span>
                <span className="font-semibold text-[#191F28]">약 {routeDuration}분</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-gray-600">1인당 (목표 인원 기준)</span>
              <span className="font-bold text-2xl text-[#3182F6]">{costPerPerson.toLocaleString()} 원</span>
            </div>
          </div>
          {pod.maxMembers > 1 && (
            <div className="mt-4 bg-blue-50 text-[#3182F6] text-sm font-semibold rounded-xl p-3 text-center border border-blue-100">
              🎉 혼자 탈 때보다 1인당 <span className="text-lg">{(displayFare - costPerPerson).toLocaleString()}원</span>을 아낄 수 있어요!
            </div>
          )}
        </div>

        {/* 계좌 + 댓글 */}
        {(pod.hostBankAccount || user) && (
          <div className="bg-[#F2F4F6] rounded-3xl p-6">
            {pod.hostBankAccount && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <h2 className="text-sm font-semibold text-gray-600">방장 계좌</h2>
                </div>
                <div className="bg-white rounded-2xl p-4">
                  <p className="font-semibold text-[#191F28]">{pod.hostName}</p>
                  <p className="text-[#3182F6] font-mono text-lg mt-1">{pod.hostBankAccount}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-gray-600" />
              <h2 className="text-sm font-semibold text-gray-600">댓글 {comments.length > 0 && `(${comments.length})`}</h2>
            </div>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {comments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400">아직 댓글이 없습니다</p>
                  <p className="text-xs text-gray-300 mt-1">첫 번째 댓글을 남겨보세요!</p>
                </div>
              ) : (
                comments.map((msg) => (
                  <div key={msg.id} className="bg-white rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {msg.userAvatar ? (
                          <img src={msg.userAvatar} alt={msg.userName} className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#3182F6] flex items-center justify-center text-white text-xs font-bold">{msg.userName.charAt(0)}</div>
                        )}
                        <span className="font-semibold text-sm text-[#191F28]">{msg.userName}</span>
                      </div>
                      <span className="text-xs text-gray-500">{msg.createdAt}</span>
                    </div>
                    <p className="text-gray-700 text-sm">{msg.message}</p>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>
            {user ? (
              <div className="flex gap-2">
                <Input
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                  placeholder="댓글을 입력하세요..."
                  className="flex-1 rounded-full bg-white border-0 px-4"
                />
                <Button
                  className="rounded-full bg-[#3182F6] text-white px-4 min-w-[48px]"
                  onClick={handleSendComment}
                  disabled={!commentInput.trim() || isSendingComment}
                >
                  {isSendingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="w-full text-center text-sm text-[#3182F6] font-semibold py-2 rounded-xl bg-blue-50 active:bg-blue-100 transition-colors"
              >
                로그인하고 댓글 남기기
              </button>
            )}
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      {!isHost && !isMember && !isPending && !isRejected && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100" style={{ maxWidth: '480px', margin: '0 auto' }}>
          <Button
            className="w-full bg-[#3182F6] text-white rounded-full py-6 text-lg font-bold shadow-lg hover:bg-[#2968C8]"
            onClick={handleJoinClick}
            disabled={isJoining}
          >
            {isJoining ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
              pod.hasDeposit
                ? `예약금 ${(pod.depositAmount || 0).toLocaleString()}원 송금 후 신청하기`
                : '참여하기'
            )}
          </Button>
        </div>
      )}

      {isRejected && !isHost && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100" style={{ maxWidth: '480px', margin: '0 auto' }}>
          <Button
            className="w-full bg-gray-100 text-gray-600 rounded-full py-6 text-lg font-bold hover:bg-gray-200"
            onClick={() => setShowRejectedConfirm(true)}
          >
            재신청하기
          </Button>
        </div>
      )}

      {isPending && !isHost && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100" style={{ maxWidth: '480px', margin: '0 auto' }}>
          <Button disabled className="w-full bg-amber-100 text-amber-700 rounded-full py-6 text-lg font-bold cursor-not-allowed">
            방장 승인 대기 중 ⏳
          </Button>
        </div>
      )}

      {isMember && !isHost && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 flex gap-3" style={{ maxWidth: '480px', margin: '0 auto' }}>
          <Button
            onClick={() => setShowLeaveConfirm(true)}
            disabled={isLeaving}
            className="flex-none bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-full py-6 px-5 font-bold transition-colors"
          >
            {isLeaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
          </Button>
          <Button disabled className="flex-1 bg-gray-200 text-gray-500 rounded-full py-6 text-lg font-bold cursor-not-allowed">
            참여 완료 ✅
          </Button>
        </div>
      )}

      {isHost && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 flex gap-2" style={{ maxWidth: '480px', margin: '0 auto' }}>
          <Button onClick={() => setShowCancelConfirm(true)} disabled={isCancelling || isCompleting} className="flex-1 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-full py-6 text-lg font-bold transition-colors">
            {isCancelling ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '취소(폭파)'}
          </Button>
          <Button onClick={() => setShowCompleteConfirm(true)} disabled={isCancelling || isCompleting} className="flex-1 bg-[#3182F6] text-white hover:bg-[#2968C8] rounded-full py-6 text-lg font-bold transition-colors">
            {isCompleting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '이용 완료'}
          </Button>
        </div>
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirmPayment={handlePaymentConfirm}
        amount={costPerPerson}
        hostName={pod.hostName || pod.participants[0]?.name || '방장'}
        accountNumber={pod.hostBankAccount}
      />

      {/* 팟 취소 확인 */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>팟을 취소할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              팟을 폭파하면 모든 멤버에게 취소 알림이 전송됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>아니요</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelPod} disabled={isCancelling} className="bg-red-500 hover:bg-red-600">폭파하기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 이용 완료 확인 */}
      <AlertDialog open={showCompleteConfirm} onOpenChange={setShowCompleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이용을 완료할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              완료 처리 후에는 마이페이지에서 이 팟을 다시 만들 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>아니요</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompletePod} disabled={isCompleting} className="bg-[#3182F6] hover:bg-[#2968C8]">완료하기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 팟 나가기 확인 */}
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>팟에서 나갈까요?</AlertDialogTitle>
            <AlertDialogDescription>
              팟을 나가면 방장에게 알림이 전송됩니다. 다시 참여하려면 재신청해야 합니다.
              {pod.hasDeposit && ' 예약금은 방장에게 직접 환불 요청해주세요.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeavePod} disabled={isLeaving} className="bg-gray-500 hover:bg-gray-600">나가기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showJoinConfirm} onOpenChange={setShowJoinConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>팟에 참여할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {pod.departure} → {pod.destination} 팟에 참여합니다. 택시비는 탑승 후 정산해주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowJoinConfirm(false); onJoin?.(); }} className="bg-[#3182F6] hover:bg-[#2968C8]">참여하기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 거절된 멤버 재신청 확인 */}
      <AlertDialog open={showRejectedConfirm} onOpenChange={setShowRejectedConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>재신청할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              이전에 거절된 팟이에요. 다시 신청하면 방장의 승인을 기다려야 합니다.
              {pod.hasDeposit && ` 예약금 ${(pod.depositAmount || 0).toLocaleString()}원을 먼저 송금해주세요.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowRejectedConfirm(false); onJoin?.(); }} className="bg-[#3182F6] hover:bg-[#2968C8]">재신청하기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 신고 모달 */}
      {reportTarget && (
        <ReportModal
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          reportedUserId={reportTarget.userId}
          reportedUserName={reportTarget.userName}
          partyId={pod.id}
          reporterId={user?.id}
        />
      )}
    </motion.div>
  );
}
