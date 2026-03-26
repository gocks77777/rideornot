'use client';

import { motion } from 'framer-motion';
import { Clock, Users, ArrowRight, LogOut, LogIn, CreditCard, Edit2, Check, BellRing, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { haptics } from '@/lib/haptics';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
}

export interface Pod {
  id: string;
  departure: string;
  destination: string;
  departureTime: string;
  status: 'completed' | 'upcoming' | 'cancelled';
  myMemberStatus?: 'pending' | 'joined' | 'paid' | 'rejected';
  participants?: Participant[];
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  maxMembers?: number;
  genderFilter?: string;
  departureDetail?: string;
}

import { supabase } from '@/lib/supabase';

// 참여자 목록을 보여주는 새로운 모달 컴포넌트
interface ParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
}

function ParticipantsModal({ isOpen, onClose, participants }: ParticipantsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()} // 클릭 이벤트 전파 방지
          >
            <h3 className="text-xl font-bold text-[#191F28] mb-4">참여자 목록</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center gap-3 bg-[#F2F4F6] rounded-xl p-3">
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#3182F6] flex items-center justify-center text-white font-bold">
                      {p.name.charAt(0)}
                    </div>
                  )}
                  <span className="font-semibold text-[#191F28]">{p.name}</span>
                </div>
              ))}
            </div>
            <Button onClick={onClose} className="w-full mt-6 bg-[#3182F6] text-white rounded-xl">닫기</Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MyPage({ user, onRecreatePod, onBankAccountSaved, onLogout }: { user?: any; onRecreatePod?: (pod: Pod) => void; onBankAccountSaved?: (account: string) => void; onLogout?: () => void }) {
  const [mannerTemp, setMannerTemp] = useState(36.5);
  const [bankAccount, setBankAccount] = useState('');
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [hostingPods, setHostingPods] = useState<Pod[]>([]);
  const [joinedPods, setJoinedPods] = useState<Pod[]>([]);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedPodParticipants, setSelectedPodParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch user profile for manner score and bank account
    supabase
      .from('users')
      .select('manner_score, bank_account')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          if (data.manner_score !== undefined) setMannerTemp(data.manner_score);
          if (data.bank_account) setBankAccount(data.bank_account);
        }
      });

    // Fetch pods I am hosting
    supabase
      .from("parties")
      .select(`
        *,
        party_members(user_id, user:users(nickname, avatar_url))
      `)
      .eq("host_id", user.id)
      .order("departure_time", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setHostingPods(data.map(p => ({
            id: p.id,
            departure: p.start_point,
            destination: p.end_point,
            departureTime: new Date(p.departure_time).toLocaleString("ko-KR", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
            }),
            status: p.status as "upcoming" | "completed" | "cancelled",
              participants: p.party_members?.map((m: any) => ({
                id: m.user_id,
                name: m.user?.nickname || "멤버",
                avatar: m.user?.avatar_url || ""
              })) || [],
              startLat: p.start_lat,
              startLng: p.start_lng,
              endLat: p.end_lat,
              endLng: p.end_lng,
              maxMembers: p.max_member,
              genderFilter: p.gender_filter,
              departureDetail: p.departure_detail
            })));
        }
      });

    // Fetch pods I joined (where I am a member but not the host)
    supabase
      .from("party_members")
      .select(`
        status,
        parties(*,
          party_members(user_id, user:users(nickname, avatar_url))
        )
      `)
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          const joined = data
            .filter((m: any) => m.parties && m.parties.host_id !== user.id)
            .map((m: any) => ({
              id: m.parties.id,
              departure: m.parties.start_point,
              destination: m.parties.end_point,
              departureTime: new Date(m.parties.departure_time).toLocaleString("ko-KR", {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
              }),
              status: m.parties.status as "upcoming" | "completed" | "cancelled",
              myMemberStatus: m.status, // pending | joined | paid | rejected
              participants: m.parties.party_members?.map((pm: any) => ({
                id: pm.user_id,
                name: pm.user?.nickname || "멤버",
                avatar: pm.user?.avatar_url || ""
              })) || [],
              startLat: m.parties.start_lat,
              startLng: m.parties.start_lng,
              endLat: m.parties.end_lat,
              endLng: m.parties.end_lng,
              maxMembers: m.parties.max_member,
              genderFilter: m.parties.gender_filter,
              departureDetail: m.parties.departure_detail
            }));
          setJoinedPods(joined);
        }
      });

    // Check if push is already enabled
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          reg.pushManager.getSubscription().then(sub => {
            setIsPushEnabled(!!sub);
          });
        }
      });
    }
  }, [user]);

  // URL Base64 to Uint8Array converter
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const handleEnablePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('이 브라우저는 푸시 알림을 지원하지 않습니다.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('알림 권한이 거부되었습니다.');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.error('VAPID Public Key is missing');
        toast.error('서버에 VAPID 키가 설정되지 않았습니다.');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      const subData = JSON.parse(JSON.stringify(subscription));

      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        endpoint: subData.endpoint,
        p256dh: subData.keys.p256dh,
        auth: subData.keys.auth
      });

      if (error) {
        if (error.code === '23505') {
          setIsPushEnabled(true);
          haptics.success();
          toast.success('알림 설정이 완료되었습니다!');
          return;
        }
        console.error('Failed to save subscription:', error);
        toast.error('알림 설정 저장 중 오류가 발생했습니다.');
        return;
      }

      setIsPushEnabled(true);
      haptics.success();
      toast.success('알림 설정 완료! 팟 참여/댓글 알림을 받을 수 있습니다.');
    } catch (e) {
      console.error('Push setup failed', e);
      toast.error('푸시 알림 설정에 실패했습니다. (아이폰은 홈 화면에 앱을 추가한 뒤 실행해주세요.)');
    }
  };

  const handleKakaoLogin = async () => {
    haptics.light();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
  };

  const handleLogout = async () => {
    haptics.medium();
    await supabase.auth.signOut();
    toast.success('로그아웃됐습니다.');
    onLogout?.();
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const handleDeleteAccount = async () => {
    if (!user) return;
    haptics.heavy();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch('/api/delete-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId: user.id })
    });
    if (res.ok) {
      await supabase.auth.signOut();
      toast.success('계정이 삭제됐습니다.');
    } else {
      toast.error('탈퇴 처리 중 오류가 발생했습니다.');
    }
    setShowDeleteConfirm(false);
  };

  const handleSaveBankAccount = async () => {
    haptics.medium();
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .update({ bank_account: bankAccount })
      .eq('id', user.id);

    if (error) {
      console.error('Error saving bank account:', error);
      toast.error('계좌 정보 저장 중 오류가 발생했습니다.');
    } else {
      setIsEditingAccount(false);
      toast.success('계좌번호가 저장됐습니다!');
      onBankAccountSaved?.(bankAccount);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Users className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-[#191F28] mb-2">로그인이 필요해요</h2>
        <p className="text-gray-500 text-center mb-8">
          내 프로필과 팟 이용 내역을 보려면<br />
          로그인을 진행해 주세요.
        </p>
        <Button
          onClick={handleKakaoLogin}
          className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#000000] rounded-xl h-12 font-semibold flex items-center justify-center gap-2"
        >
          <LogIn className="w-5 h-5" />
          카카오로 시작하기
        </Button>
      </div>
    );
  }

  const getTempColor = (temp: number) => {
    if (temp >= 37) return 'from-orange-400 to-red-500';
    if (temp >= 36) return 'from-green-400 to-blue-500';
    return 'from-blue-400 to-blue-600';
  };

  const getTempBgColor = (temp: number) => {
    if (temp >= 37) return 'bg-orange-50';
    if (temp >= 36) return 'bg-green-50';
    return 'bg-blue-50';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'recruiting':
      case 'upcoming':
        return <span className="text-xs font-semibold text-[#3182F6]">모집중</span>;
      case 'full':
        return <span className="text-xs font-semibold text-orange-500">마감</span>;
      case 'departed':
        return <span className="text-xs font-semibold text-purple-500">출발</span>;
      case 'completed':
        return <span className="text-xs font-semibold text-gray-500">완료</span>;
      case 'cancelled':
        return <span className="text-xs font-semibold text-red-500">취소</span>;
      default:
        return null;
    }
  };

  return (
    <div className="px-6 pt-8 pb-24">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#191F28]">내 프로필</h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleLogout}
          className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"
        >
          <LogOut className="w-5 h-5 text-red-500" />
        </motion.button>
      </header>

      <div className="bg-[#F2F4F6] rounded-3xl p-6 mb-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-4">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="profile" className="w-20 h-20 rounded-full border border-gray-200 object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#3182F6] to-[#1E5BBF] flex items-center justify-center text-white text-3xl font-bold">
                학
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[#191F28] mb-1">
                {user?.user_metadata?.full_name || user?.user_metadata?.name || '운전자'}
              </h2>
              <p className="text-sm text-gray-600">{user?.email || '이메일 정보 없음'}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-4 ${getTempBgColor(mannerTemp)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">매너온도</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#3182F6] to-[#1E5BBF] bg-clip-text text-transparent">
              {mannerTemp.toFixed(1)}°C
            </span>
          </div>
          <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${mannerTemp}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className={`h-full bg-gradient-to-r ${getTempColor(mannerTemp)} rounded-full`}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            다른 사용자들이 평가한 매너 점수입니다
          </p>
        </div>
      </div>

      {/* Push Notification Setting */}
      <div className="bg-[#F2F4F6] rounded-3xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BellRing className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-bold text-[#191F28]">푸시 알림</h3>
              <p className="text-xs text-gray-500 mt-0.5">팟 참여, 새 댓글 알림 받기</p>
            </div>
          </div>
          {isPushEnabled ? (
            <div className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 사용 중
            </div>
          ) : (
            <Button 
              onClick={handleEnablePush}
              className="h-8 text-xs bg-[#3182F6] hover:bg-[#2968C8] text-white rounded-full px-4"
            >
              알림 켜기
            </Button>
          )}
        </div>
      </div>

      <div className="bg-[#F2F4F6] rounded-3xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <h3 className="font-bold text-[#191F28]">계좌 정보</h3>
          </div>
          {bankAccount && !isEditingAccount && (
            <button
              onClick={() => setIsEditingAccount(true)}
              className="text-sm font-semibold text-[#3182F6] flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              수정
            </button>
          )}
        </div>

        {!isEditingAccount && bankAccount ? (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
            <span className="font-medium text-[#191F28]">{bankAccount}</span>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-500" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              팟 멤버들이 송금할 계좌번호를 입력해주세요.
            </p>
            <Input
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="예: 신한 110-123-456789"
              className="h-12 rounded-xl bg-white border-0"
            />
            <Button
              onClick={handleSaveBankAccount}
              disabled={!bankAccount.trim()}
              className="w-full bg-[#3182F6] text-white rounded-xl h-12 font-semibold hover:bg-[#2968C8] transition-colors"
            >
              저장하기
            </Button>
          </div>
        )}
      </div>

      <div className="bg-[#F2F4F6] rounded-3xl p-6">
        <h3 className="font-bold text-[#191F28] mb-4">팟 이용 내역</h3>

        <Tabs defaultValue="hosting" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white rounded-xl p-1 mb-4">
            <TabsTrigger
              value="hosting"
              className="rounded-lg data-[state=active]:bg-[#3182F6] data-[state=active]:text-white"
              onClick={() => haptics.light()}
            >
              내가 만든 팟
            </TabsTrigger>
            <TabsTrigger
              value="joined"
              className="rounded-lg data-[state=active]:bg-[#3182F6] data-[state=active]:text-white"
              onClick={() => haptics.light()}
            >
              참여한 팟
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hosting" className="space-y-3 mt-0">
            {hostingPods.map((pod, index) => (
              <motion.div
                key={pod.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  haptics.light();
                  if (pod.participants && pod.participants.length > 0) {
                    setSelectedPodParticipants(pod.participants);
                    setShowParticipantsModal(true);
                  }
                }}
                className="bg-white rounded-2xl p-4 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-bold text-[#191F28] text-base truncate">{pod.departure}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="font-bold text-[#191F28] text-base truncate">{pod.destination}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-sm truncate">{pod.departureTime}</span>
                    </div>
                  </div>
                  {getStatusBadge(pod.status)}
                </div>
                {onRecreatePod && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      haptics.medium();
                      onRecreatePod(pod);
                    }}
                    className="w-full mt-2 py-2 text-sm font-semibold text-[#3182F6] bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    이 팟 또 만들기 🔁
                  </button>
                )}
              </motion.div>
            ))}
            {hostingPods.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>아직 만든 팟이 없습니다</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="joined" className="space-y-3 mt-0">
            {joinedPods.map((pod, index) => (
              <motion.div
                key={pod.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  haptics.light();
                  if (pod.participants && pod.participants.length > 0) {
                    setSelectedPodParticipants(pod.participants);
                    setShowParticipantsModal(true);
                  }
                }}
                className="bg-white rounded-2xl p-4 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-bold text-[#191F28] text-base truncate">{pod.departure}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="font-bold text-[#191F28] text-base truncate">{pod.destination}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-sm truncate">{pod.departureTime}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(pod.status)}
                    {pod.myMemberStatus === 'pending' && (
                      <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">승인 대기중</span>
                    )}
                    {pod.myMemberStatus === 'rejected' && (
                      <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">거절됨</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {joinedPods.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>아직 참여한 팟이 없습니다</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* 고객 응대 */}
      <div className="mt-6 bg-[#F2F4F6] rounded-3xl p-5">
        <h3 className="font-bold text-[#191F28] mb-3">도움이 필요하신가요?</h3>
        <a
          href="mailto:gocks77777@naver.com?subject=탈래말래 문의"
          className="flex items-center justify-between bg-white rounded-2xl p-4 hover:bg-gray-50 transition-colors"
        >
          <div>
            <p className="font-semibold text-sm text-[#191F28]">이메일 문의</p>
            <p className="text-xs text-gray-500 mt-0.5">gocks77777@naver.com</p>
          </div>
          <span className="text-gray-400">→</span>
        </a>
      </div>

      {/* 법적 링크 */}
      <div className="mt-6 flex justify-center gap-4 text-xs text-gray-400">
        <a href="/terms" className="hover:text-gray-600 underline underline-offset-2 transition-colors">이용약관</a>
        <span>·</span>
        <a href="/privacy" className="hover:text-gray-600 underline underline-offset-2 transition-colors font-semibold">개인정보처리방침</a>
        <span>·</span>
        <a href="/admin" className="hover:text-gray-600 underline underline-offset-2 transition-colors">관리자</a>
      </div>

      <ParticipantsModal
        isOpen={showParticipantsModal}
        onClose={() => setShowParticipantsModal(false)}
        participants={selectedPodParticipants}
      />
    </div>
  );
}
