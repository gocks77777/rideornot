'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Users, Clock, MessageCircle, Plus, Check, Send, CreditCard, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaymentModal } from '@/components/payment-modal';
import { haptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  paid?: boolean;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  createdAt: string;
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
  };
  onBack: () => void;
  onJoin?: () => void;
  isHost?: boolean;
  user?: any;
}

export function PodDetail({ pod, onBack, onJoin, isHost = false, user }: PodDetailProps) {
  const emptySlots = pod.maxMembers - pod.participants.length;
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [participantsPaidStatus, setParticipantsPaidStatus] = useState<Record<string, boolean>>(
    pod.participants.reduce((acc, p) => ({ ...acc, [p.id]: p.paid || false }), {})
  );

  // Map ref for interactive map
  const mapRef = useRef<HTMLDivElement>(null);

  // Real fare from Directions API
  const [realTaxiFare, setRealTaxiFare] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const hasCoords = pod.startLat && pod.startLng && pod.endLat && pod.endLng;

  // Use real fare if available, otherwise use estimate
  const displayFare = realTaxiFare || pod.estimatedCost;
  const costPerPerson = Math.round(displayFare / pod.maxMembers);

  // Initialize Naver Map with route
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
          center: center,
          zoom: 12,
          mapDataControl: false,
          scaleControl: false,
          mapTypeControl: false,
          zoomControl: false,
          draggable: false,
          scrollWheel: false,
          keyboardShortcuts: false,
          disableDoubleClickZoom: true,
          logoControlOptions: {
            position: naver.maps.Position.TOP_LEFT // Naver 로고를 좌측 상단으로 이동
          }
        });

        const bounds = new naver.maps.LatLngBounds(startPos, endPos);
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });

        // Start marker (blue)
        new naver.maps.Marker({
          position: startPos,
          map: map,
          icon: {
            content: `
              <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center;">
                <div style="background: #3182F6; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 8px rgba(49,130,246,0.4);">출발</div>
                <div style="width: 3px; height: 8px; background: #3182F6; margin-top: -1px;"></div>
                <div style="width: 10px; height: 4px; background: rgba(0,0,0,0.2); border-radius: 50%;"></div>
              </div>
            `,
            anchor: new naver.maps.Point(20, 40)
          }
        });

        // End marker (orange)
        new naver.maps.Marker({
          position: endPos,
          map: map,
          icon: {
            content: `
              <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center;">
                <div style="background: #FFA500; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 8px rgba(255,165,0,0.4);">도착</div>
                <div style="width: 3px; height: 8px; background: #FFA500; margin-top: -1px;"></div>
                <div style="width: 10px; height: 4px; background: rgba(0,0,0,0.2); border-radius: 50%;"></div>
              </div>
            `,
            anchor: new naver.maps.Point(20, 40)
          }
        });

        // Fetch real road route from Directions API
        try {
          const res = await fetch(
            `/api/directions?startLat=${pod.startLat}&startLng=${pod.startLng}&endLat=${pod.endLat}&endLng=${pod.endLng}`
          );
          const data = await res.json();

          console.log('[Directions API response]', data);

          if (data.path && data.path.length > 0) {
            // Draw real road route with gradient-like or solid bold style
            const routePath = data.path.map(
              (coord: number[]) => new naver.maps.LatLng(coord[1], coord[0]) // [lng, lat] -> LatLng(lat, lng)
            );

            // 외곽선(그림자) 효과를 위한 백그라운드 라인
            new naver.maps.Polyline({
              map: map,
              path: routePath,
              strokeColor: '#1E5BBF', // 짙은 파란색
              strokeWeight: 7,
              strokeOpacity: 0.3,
              strokeLineCap: 'round',
              strokeLineJoin: 'round',
            });

            // 메인 경로 라인 (솔리드 라인)
            new naver.maps.Polyline({
              map: map,
              path: routePath,
              strokeColor: '#3182F6',
              strokeWeight: 6,
              strokeOpacity: 1,
              strokeLineCap: 'round',
              strokeLineJoin: 'round',
            });

            // Re-fit bounds to include the route with some padding
            const routeBounds = new naver.maps.LatLngBounds();
            routePath.forEach((p: any) => routeBounds.extend(p));
            map.fitBounds(routeBounds, { top: 60, right: 40, bottom: 40, left: 40 });

            // Update taxi fare if available from API
            if (data.taxiFare && data.taxiFare > 0) {
              setRealTaxiFare(data.taxiFare);
            }
            if (data.duration) {
              setRouteDuration(Math.round(data.duration / 60000)); // ms to minutes
            }
          } else {
            // Fallback: dashed line if no route found
            new naver.maps.Polyline({
              map: map,
              path: [startPos, endPos],
              strokeColor: '#1E5BBF',
              strokeWeight: 4,
              strokeOpacity: 0.8,
              strokeStyle: 'shortdash',
              strokeLineCap: 'round',
              strokeLineJoin: 'round',
            });
          }
        } catch (dirErr) {
          console.error('[Directions API fetch error]', dirErr);
          // Fallback: dashed line on error
          new naver.maps.Polyline({
            map: map,
            path: [startPos, endPos],
            strokeColor: '#1E5BBF',
            strokeWeight: 4,
            strokeOpacity: 0.8,
            strokeStyle: 'shortdash',
            strokeLineCap: 'round',
            strokeLineJoin: 'round',
          });
        }

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
          if ((window as any).naver?.maps) {
            clearInterval(interval);
            initMap();
          } else if (attempts > 20) {
            clearInterval(interval);
          }
        }, 300);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [hasCoords, pod.startLat, pod.startLng, pod.endLat, pod.endLng]);

  // Fetch comments
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
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `party_id=eq.${pod.id}`
      }, async (payload: any) => {
        const { data: userData } = await supabase
          .from('users')
          .select('nickname, avatar_url')
          .eq('id', payload.new.user_id)
          .single();

        setComments(prev => [...prev, {
          id: payload.new.id,
          userId: payload.new.user_id,
          userName: userData?.nickname || '익명',
          userAvatar: userData?.avatar_url,
          message: payload.new.message,
          createdAt: '방금'
        }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [pod.id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

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
    const { error } = await supabase.from('comments').insert({
      party_id: pod.id,
      user_id: user.id,
      message: commentInput.trim()
    });
    if (!error) setCommentInput('');
    setIsSendingComment(false);
    haptics.light();
  };

  const togglePaidStatus = async (participantId: string) => {
    // 1. 낙관적 UI 업데이트
    const newStatus = !participantsPaidStatus[participantId];
    setParticipantsPaidStatus(prev => ({
      ...prev,
      [participantId]: newStatus
    }));
    haptics.light();

    // 2. DB 업데이트
    const { error } = await supabase
      .from('party_members')
      .update({ status: newStatus ? 'paid' : 'joined' })
      .eq('party_id', pod.id)
      .eq('user_id', participantId);

    // 3. 실패 시 롤백
    if (error) {
      console.error('Failed to update paid status:', error);
      setParticipantsPaidStatus(prev => ({
        ...prev,
        [participantId]: !newStatus
      }));
      alert('송금 상태 변경에 실패했습니다.');
    }
  };

  const handleJoinClick = () => {
    if (!user) { alert('로그인이 필요합니다.'); return; }
    // Check if already a member
    const isMember = pod.participants.some(p => p.id === user?.id);
    if (isMember) { alert('이미 참여한 팟입니다.'); return; }
    setShowPaymentModal(true);
    haptics.light();
  };

  const handlePaymentConfirm = () => {
    setShowPaymentModal(false);
    onJoin?.();
  };

  const handleCancelPod = async () => {
    if (!window.confirm('정말 이 팟을 취소(폭파)하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    
    haptics.heavy();
    const { error, status, statusText } = await supabase
      .from("parties")
      .update({ status: "cancelled" })
      .eq("id", pod.id)
      .eq("host_id", user.id);

    if (error) {
      console.error("팟 취소 실패:", error, status, statusText);
      alert(`팟 취소에 실패했습니다: ${error.message} (코드: ${status})`);
    } else {
      alert("팟이 성공적으로 취소되었습니다. 🎉");
      onBack(); // 메인 화면으로 돌아가기
    }
  };

  const isMember = user && pod.participants.some(p => p.id === user.id);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 bg-white z-50 overflow-y-auto pb-24"
      style={{ maxWidth: '480px', margin: '0 auto' }}
    >
      <header className="sticky top-0 bg-white z-[11] px-6 py-4 flex items-center gap-3 border-b border-gray-100" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <button
          onClick={() => { haptics.light(); onBack(); }}
          className="w-10 h-10 rounded-full bg-[#F2F4F6] flex items-center justify-center active:scale-95 transition-transform mt-[max(5px, env(safe-area-inset-top))]"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-[#191F28]">팟 상세</h1>
      </header>

      <div className="px-6 py-6 space-y-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 120px)' }}>
        {/* Interactive Map */}
        {hasCoords ? (
          <div ref={mapRef} className="rounded-3xl overflow-hidden h-48 bg-gray-100 z-0" />
        ) : (
          <div className="bg-gray-100 rounded-3xl h-48 flex items-center justify-center z-0">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">위치 정보 없음</p>
            </div>
          </div>
        )}

        {/* Route Info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative z-10">
          <h2 className="text-sm font-semibold text-gray-400 mb-5 tracking-wide">여정 정보</h2>
          
          <div className="relative pl-3">
            {/* 세로 연결 선 (점선 스타일) */}
            <div className="absolute left-[7px] top-[24px] bottom-[24px] w-[2px] bg-gray-200 border-l-[2px] border-dashed border-gray-300"></div>
            
            {/* 출발지 */}
            <div className="relative mb-8 flex items-start">
              <div className="absolute -left-3 top-1 w-4 h-4 rounded-full bg-[#3182F6] shadow-[0_0_0_4px_rgba(49,130,246,0.15)] z-10"></div>
              <div className="ml-6 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[#3182F6] bg-blue-50 px-2 py-0.5 rounded-md">출발</span>
                </div>
                <p className="font-bold text-[#191F28] text-[1.1rem] leading-tight mt-1">{pod.departure}</p>
                {pod.departureDetail && (
                  <div className="flex items-center gap-1 mt-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 w-fit">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <p className="text-sm text-gray-600 font-medium">{pod.departureDetail}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 도착지 */}
            <div className="relative flex items-start">
              <div className="absolute -left-3 top-1 w-4 h-4 rounded-full bg-[#FFA500] shadow-[0_0_0_4px_rgba(255,165,0,0.15)] z-10"></div>
              <div className="ml-6 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[#FFA500] bg-orange-50 px-2 py-0.5 rounded-md">도착</span>
                </div>
                <p className="font-bold text-[#191F28] text-[1.1rem] leading-tight mt-1">{pod.destination}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#191F28]">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-gray-600" />
              </div>
              <span className="font-bold text-[15px]">{pod.departureTime} 출발</span>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-[#F2F4F6] rounded-3xl p-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">참여자</h2>
          <div className="space-y-3">
            {pod.participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-3 bg-white rounded-2xl p-3">
                {participant.avatar ? (
                  <img src={participant.avatar} alt={participant.name} className="w-12 h-12 rounded-full border border-gray-200 flex-shrink-0 object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#3182F6] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {participant.name.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-semibold text-[#191F28] flex-1">{participant.name}</span>
                {isHost && (
                  <button
                    onClick={() => togglePaidStatus(participant.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      participantsPaidStatus[participant.id]
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {participantsPaidStatus[participant.id] ? (
                      <><Check className="w-3 h-3" /><span>송금완료</span></>
                    ) : (
                      <span>미송금</span>
                    )}
                  </button>
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

        {/* Estimated Cost */}
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
              <span className="text-gray-600">1인당</span>
              <span className="font-bold text-2xl text-[#3182F6]">{costPerPerson.toLocaleString()} 원</span>
            </div>
          </div>
        </div>

        {/* Host Bank Account and Comments Combined */}
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
                          <div className="w-6 h-6 rounded-full bg-[#3182F6] flex items-center justify-center text-white text-xs font-bold">
                            {msg.userName.charAt(0)}
                          </div>
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
              <p className="text-center text-sm text-gray-400">로그인하면 댓글을 남길 수 있습니다</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom action button */}
      {!isHost && !isMember && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100" style={{ maxWidth: '480px', margin: '0 auto' }}>
          <Button
            className="w-full bg-[#3182F6] text-white rounded-full py-6 text-lg font-bold shadow-lg hover:bg-[#2968C8]"
            onClick={handleJoinClick}
          >
            참여하기
          </Button>
        </div>
      )}

      {isMember && !isHost && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100" style={{ maxWidth: '480px', margin: '0 auto' }}>
          <Button disabled className="w-full bg-gray-200 text-gray-500 rounded-full py-6 text-lg font-bold cursor-not-allowed">
            참여 완료 ✅
          </Button>
        </div>
      )}

      {isHost && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100" style={{ maxWidth: '480px', margin: '0 auto' }}>
          <Button 
            onClick={handleCancelPod}
            className="w-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-full py-6 text-lg font-bold transition-colors"
          >
            이 팟 취소하기 (폭파)
          </Button>
        </div>
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirmPayment={handlePaymentConfirm}
        amount={costPerPerson}
        hostName={pod.hostName || pod.participants[0]?.name || '방장'}
      />
    </motion.div>
  );
}
