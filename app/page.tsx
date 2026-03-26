'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { FloatingNav } from '@/components/floating-nav';
import { LivePodsScroll } from '@/components/live-pods-scroll';
import { PodList } from '@/components/pod-list';
import { CreatePodSheet } from '@/components/create-pod-sheet';
import { PodDetail } from '@/components/pod-detail';
import { MyPage } from '@/components/my-page';
import { SearchScreen } from '@/components/search-screen';
import { PushGuideSheet } from '@/components/push-guide-sheet';
import { PodListSkeleton, LivePodsSkeleton } from '@/components/loading-skeleton';
import { GenderOnboarding } from '@/components/gender-onboarding';
import { OnboardingGuide } from '@/components/onboarding-guide';
import { PraisePromptSheet, PendingPraiseParty } from '@/components/praise-prompt-sheet';
import { ThumbsUp } from 'lucide-react';
import { haptics } from '@/lib/haptics';
import { supabase, sendPush } from '@/lib/supabase';
import { toast } from 'sonner';

// Haversine distance in km
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Taxi fare estimate: base 4800 + 1300/km (Korean mid-size taxi 2025)
function estimateTaxiFare(distKm: number): number {
  if (distKm <= 1.6) return 4800;
  return Math.round(4800 + (distKm - 1.6) * 1300);
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [createPodInitialData, setCreatePodInitialData] = useState<any>(null);
  const [userBankAccount, setUserBankAccount] = useState<string | null | undefined>(undefined);
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  const [searchFocus, setSearchFocus] = useState<'departure' | 'destination' | null>(null);
  const [pushGuideOpen, setPushGuideOpen] = useState(false);
  const [selectedPodId, setSelectedPodId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userGender, setUserGender] = useState<'male' | 'female' | null>(null);
  const [allPods, setAllPods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocationName, setCurrentLocationName] = useState<string | null>(null);
  const [pendingPraiseParties, setPendingPraiseParties] = useState<PendingPraiseParty[]>([]);
  const [praiseSheetOpen, setPraiseSheetOpen] = useState(false);

  const fetchPods = async () => {
    setIsLoading(true);
    
    // 현재 시간 구하기 (ISO 포맷)
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('parties')
      .select(`
        *,
        host:users!parties_host_id_fkey(nickname, avatar_url, manner_score, bank_account),
        party_members(user_id, status, user:users(nickname, avatar_url))
      `)
      .gte('departure_time', now) // 현재 시간 이후에 출발하는 팟만 필터링
      .neq('status', 'cancelled') // 취소된 팟 제외
      .order('departure_time', { ascending: true });

    if (data) {
      const formatted = data.map(p => {
        // Calculate taxi fare from coordinates
        let fare = 12000;
        if (p.start_lat && p.start_lng && p.end_lat && p.end_lng) {
          const dist = getDistanceKm(p.start_lat, p.start_lng, p.end_lat, p.end_lng);
          // Multiply by 1.3 to approximate road distance vs straight line
          fare = estimateTaxiFare(dist * 1.3);
        }

        return {
          id: p.id,
          hostId: p.host_id,
          departure: p.start_point,
          departureDetail: p.departure_detail || '',
          destination: p.end_point,
          startLat: p.start_lat,
          startLng: p.start_lng,
          endLat: p.end_lat,
          endLng: p.end_lng,
          currentMembers: p.current_member,
          maxMembers: p.max_member,
          genderFilter: p.gender_filter || 'any',
          hasDeposit: p.has_deposit,
          depositAmount: p.deposit_amount,
          departureTime: new Date(p.departure_time).toLocaleString('ko-KR', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          }),
          status: p.status,
          hostName: p.host?.nickname || '방장',
          hostBankAccount: p.host?.bank_account || '',
          estimatedCost: fare,
          participants: p.party_members
            ?.filter((m: any) => m.status !== 'rejected')
            .map((m: any) => ({
              id: m.user_id,
              name: m.user?.nickname || '멤버',
              avatar: m.user?.avatar_url || '',
              paid: m.status === 'paid',
              memberStatus: m.status  // 'pending' | 'joined' | 'paid'
            })) || []
        };
      });
      setAllPods(formatted);
    }
    setIsLoading(false);
  };

  const fetchPendingPraises = async (userId: string) => {
    const { data: memberRows } = await supabase
      .from('party_members')
      .select('party_id')
      .eq('user_id', userId)
      .in('status', ['joined', 'paid']);

    if (!memberRows?.length) return;
    const partyIds = memberRows.map((m: any) => m.party_id);

    const { data: completedParties } = await supabase
      .from('parties')
      .select('id, start_point, end_point, party_members(user_id, status, user:users(nickname, avatar_url))')
      .in('id', partyIds)
      .eq('status', 'completed');

    if (!completedParties?.length) return;

    const { data: myPraises } = await supabase
      .from('praises')
      .select('praised_user_id, party_id')
      .eq('praiser_id', userId)
      .in('party_id', partyIds);

    const praisedSet = new Set((myPraises || []).map((p: any) => `${p.party_id}-${p.praised_user_id}`));

    const pending: PendingPraiseParty[] = [];
    for (const party of completedParties) {
      const members = ((party.party_members as any[]) || [])
        .filter((m: any) => m.user_id !== userId && ['joined', 'paid'].includes(m.status))
        .map((m: any) => ({
          id: m.user_id,
          name: m.user?.nickname || '멤버',
          avatar: m.user?.avatar_url || '',
          praised: praisedSet.has(`${party.id}-${m.user_id}`)
        }));
      if (members.some((m: any) => !m.praised)) {
        pending.push({ id: party.id, departure: party.start_point, destination: party.end_point, members });
      }
    }
    setPendingPraiseParties(pending);
  };

  const checkUserGender = async (userId: string) => {
    const { data } = await supabase.from('users').select('gender').eq('id', userId).single();
    if (data?.gender) {
      setUserGender(data.gender);
    }
  };

  const checkBanStatus = async (userId: string) => {
    const { data } = await supabase.from('users').select('is_banned').eq('id', userId).single();
    if (data?.is_banned) {
      await supabase.auth.signOut();
      toast.error('이용이 정지된 계정입니다. 문의: gocks77777@naver.com');
      return true;
    }
    return false;
  };

  useEffect(() => {
    // Session 체크
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        const banned = await checkBanStatus(currentUser.id);
        if (banned) return;
        setUser(currentUser);
        checkUserGender(currentUser.id);
        fetchPendingPraises(currentUser.id);
        supabase.from('users').select('bank_account').eq('id', currentUser.id).single()
          .then(({ data }) => setUserBankAccount(data?.bank_account ?? null));
      }
    });

    // 인증 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        const banned = await checkBanStatus(currentUser.id);
        if (banned) return;
        setUser(currentUser);
        checkUserGender(currentUser.id);
        fetchPendingPraises(currentUser.id);
        supabase.from('users').select('bank_account').eq('id', currentUser.id).single()
          .then(({ data }) => setUserBankAccount(data?.bank_account ?? null));
      } else {
        setUser(null);
        setUserBankAccount(undefined);
      }
    });

    fetchPods();

    // 딥링크: ?pod=ID 처리
    const params = new URLSearchParams(window.location.search);
    const podIdParam = params.get('pod');
    if (podIdParam) {
      setSelectedPodId(podIdParam);
      window.history.replaceState({}, '', '/');
    }

    // 실시간 팟 업데이트 구독
    const realtimeChannel = supabase
      .channel('parties-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parties' }, () => {
        fetchPods();
      })
      .subscribe();

    // 2. 위치 기반 맞춤 인사말을 위한 Geolocation 호출
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          // 네이버 Reverse Geocoding 호출 (클라이언트 단에서 직접 호출하거나 API 라우트를 사용할 수 있으나 
          // 브라우저 naver.maps가 로드되어 있으면 그것을 활용하는 것이 가장 빠릅니다)
          const checkNaverMap = setInterval(() => {
            const naver = (window as any).naver;
            if (naver?.maps?.Service?.reverseGeocode) {
              clearInterval(checkNaverMap);
              const coord = new naver.maps.LatLng(lat, lng);
              naver.maps.Service.reverseGeocode({ coords: coord }, (status: any, response: any) => {
                if (status === naver.maps.Service.Status.OK && response?.v2?.address) {
                  const addr = response.v2.address;
                  // 읍/면/동만 추출 (예: 충청북도 청주시 흥덕구 오송읍 -> 오송읍)
                  const parts = (addr.roadAddress || addr.jibunAddress || '').split(' ');
                  const dong = parts.find((p: string) => /[읍면동]$/.test(p));
                  if (dong) setCurrentLocationName(dong);
                }
              });
            }
          }, 500);
          
          // 5초 뒤에도 못 찾으면 interval 종료
              setTimeout(() => clearInterval(checkNaverMap), 5000);
            },
            (err) => {
              console.warn("Geolocation error:", err);
              setCurrentLocationName("어딘가"); // 위치 정보 실패 시 기본값 설정
            }
      );
    }

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  const handleKakaoLogin = async () => {
    haptics.light();
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
  };

  const handleOpenCreateSheet = () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    if (userBankAccount === null) {
      toast.error('팟을 만들려면 먼저 계좌번호를 등록해주세요!', {
        description: '마이페이지 → 계좌 정보에서 등록할 수 있어요.',
        duration: 4000,
      });
      setActiveTab('my');
      return;
    }
    setIsCreateSheetOpen(true);
  };

  const handleCreatePod = async (data: any) => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    // 계좌번호 확인
    const { data: profile } = await supabase.from('users').select('bank_account').eq('id', user.id).single();
    if (!profile?.bank_account) {
      toast.error('계좌번호를 먼저 설정해주세요. (내 프로필 → 계좌 정보)');
      return;
    }

    // 활성 팟 중복 생성 방지
    const { data: activePods } = await supabase
      .from('parties')
      .select('id')
      .eq('host_id', user.id)
      .in('status', ['recruiting', 'full', 'departed']);
    if (activePods && activePods.length > 0) {
      toast.error('이미 진행 중인 팟이 있습니다. 완료 후 새 팟을 만들 수 있어요.');
      return;
    }

    // Insert into parties table
    const { data: newPod, error } = await supabase
      .from('parties')
      .insert({
        host_id: user.id,
        start_point: data.departure,
        departure_detail: data.departureDetail || null,
        start_lat: data.departureLat,
        start_lng: data.departureLng,
        end_point: data.destination,
        end_lat: data.destinationLat,
        end_lng: data.destinationLng,
        departure_time: new Date(data.departureTime).toISOString(),
        max_member: data.maxMembers,
        gender_filter: data.genderPreference,
        status: 'recruiting',
        current_member: 1
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pod:', error);
      toast.error('팟 생성 중 오류가 발생했습니다.');
      return;
    }

    // Add the host to party_members
    await supabase.from('party_members').insert({
      party_id: newPod.id,
      user_id: user.id,
      status: 'joined'
    });

    console.log('New pod created successfully:', newPod);
    fetchPods(); // reload
  };

  const livePods = allPods.slice(0, 3).map(pod => ({
    id: pod.id,
    departure: pod.departure,
    destination: pod.destination,
    currentMembers: pod.currentMembers,
    maxMembers: pod.maxMembers,
    departureTime: pod.departureTime,
  }));

  const selectedPod = selectedPodId ? allPods.find(pod => pod.id === selectedPodId) : null;

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen bg-white pb-24 w-full select-none">
      <div className="w-full mx-auto" style={{ maxWidth: '480px' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <header className="flex items-center justify-between px-6 pt-6 pb-4">
                {!user ? (
                  <button
                    onClick={handleKakaoLogin}
                    className="flex items-center px-4 py-2 gap-2 rounded-full bg-[#FEE500] text-[#000000] font-semibold text-sm hover:bg-[#FEE500]/90 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    카카오로 시작하기
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {user?.user_metadata?.avatar_url && (
                      <img src={user.user_metadata.avatar_url} alt="profile" className="w-8 h-8 rounded-full border border-gray-200" />
                    )}
                    <span className="font-semibold text-[#191F28] text-sm">
                      {user?.user_metadata?.full_name || user?.user_metadata?.name || '운전자'}님
                    </span>
                  </div>
                )}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    haptics.light();
                    setPushGuideOpen(true);
                  }}
                  className="w-10 h-10 rounded-full bg-[#F2F4F6] flex items-center justify-center active:bg-gray-200 transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                </motion.button>
              </header>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 pt-4 pb-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.03]">
                  <svg viewBox="0 0 200 200" fill="currentColor" className="text-[#3182F6]">
                    <path d="M40 60 L160 60 L180 100 L180 140 L160 160 L40 160 L20 140 L20 100 Z M50 80 L150 80 L165 110 L165 130 L150 145 L50 145 L35 130 L35 110 Z M60 100 C60 95 55 90 50 90 C45 90 40 95 40 100 C40 105 45 110 50 110 C55 110 60 105 60 100 M160 100 C160 95 155 90 150 90 C145 90 140 95 140 100 C140 105 145 110 150 110 C155 110 160 105 160 100" />
                    <circle cx="100" cy="50" r="8" fill="#FFA500" />
                  </svg>
                </div>
                <div className="absolute bottom-0 left-0 w-32 h-32 opacity-[0.02]">
                  <svg viewBox="0 0 100 100" fill="currentColor" className="text-[#FFA500]">
                    <path d="M50 10 L90 90 L10 90 Z M50 30 L70 75 L30 75 Z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-[#191F28] leading-tight mb-2 relative z-10">
                  {user
                    ? currentLocationName 
                      ? `${user?.user_metadata?.full_name || user?.user_metadata?.name || '운전자'}님!\n지금 ${currentLocationName}에서 출발하시나요?`
                      : `${user?.user_metadata?.full_name || user?.user_metadata?.name || '운전자'}님!\n오늘도 택시비 아껴볼까요?`
                    : currentLocationName
                      ? `반가워요! 👋\n지금 ${currentLocationName}에서 출발하시나요?`
                      : '반가워요! 👋\n오늘도 택시비 아껴볼까요?'}
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="px-6 mb-8"
              >
                <div className="w-full bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col relative">
                  <div className="absolute left-[34px] top-[46px] bottom-[46px] w-[2px] border-dashed border-l-2 border-gray-200"></div>
                  
                  <div 
                    onClick={() => {
                        haptics.light();
                        setSearchFocus('departure');
                        setSearchSheetOpen(true);
                    }}
                    className="flex items-center gap-4 bg-[#F2F4F6] p-4 rounded-2xl mb-3 cursor-pointer active:bg-gray-200 transition-colors"
                  >
                    <div className="w-3 h-3 rounded-full bg-[#3182F6]" />
                    <span className="text-[#8B95A1] font-medium text-lg">출발지를 검색하세요</span>
                  </div>

                  <div 
                    onClick={() => {
                        haptics.light();
                        setSearchFocus('destination');
                        setSearchSheetOpen(true);
                    }}
                    className="flex items-center gap-4 bg-[#F2F4F6] p-4 rounded-2xl cursor-pointer active:bg-gray-200 transition-colors"
                  >
                    <div className="w-3 h-3 rounded-full bg-[#FF5050]" />
                    <span className="text-[#8B95A1] font-medium text-lg">도착지를 검색하세요</span>
                  </div>
                </div>
              </motion.div>

              {pendingPraiseParties.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-6 mb-4"
                >
                  <button
                    onClick={() => { haptics.light(); setPraiseSheetOpen(true); }}
                    className="w-full flex items-center gap-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-left active:bg-yellow-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                      <ThumbsUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#191F28]">함께한 멤버를 칭찬해주세요</p>
                      <p className="text-xs text-gray-500 mt-0.5">완료된 팟 {pendingPraiseParties.length}개 · 칭찬 대기 중</p>
                    </div>
                    <span className="text-yellow-500 text-lg">→</span>
                  </button>
                </motion.div>
              )}

              {isLoading ? (
                <LivePodsSkeleton />
              ) : (
                <LivePodsScroll pods={livePods} onPodClick={setSelectedPodId} onRefresh={fetchPods} />
              )}
            </motion.div>
          )}

          {activeTab === 'list' && (
            <motion.div
              key="list"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <header className="px-6 pt-8 pb-6">
                <h1 className="text-3xl font-bold text-[#191F28]">팟 목록</h1>
                <p className="text-gray-600 mt-1">모집중인 택시팟을 확인하세요</p>
              </header>
              {isLoading ? (
                <PodListSkeleton />
              ) : (
                <PodList pods={allPods} onPodClick={setSelectedPodId} />
              )}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <MyPage
                user={user}
                onBankAccountSaved={(account) => setUserBankAccount(account)}
                onRecreatePod={(pod) => {
                  setCreatePodInitialData(pod);
                  setIsCreateSheetOpen(true);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <FloatingNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onCreatePod={handleOpenCreateSheet}
          user={user}
        />

        <CreatePodSheet
          isOpen={isCreateSheetOpen}
          onClose={() => {
            setIsCreateSheetOpen(false);
            setCreatePodInitialData(null);
          }}
          onSubmit={handleCreatePod}
          initialData={createPodInitialData}
        />

        <GenderOnboarding
          user={user}
          onComplete={(gender) => setUserGender(gender)}
        />
        <OnboardingGuide />

        {selectedPod && (
          <PodDetail
            pod={selectedPod}
            onBack={() => setSelectedPodId(null)}
            onJoin={async () => {
              if (!user) { toast.error('로그인이 필요합니다.'); return; }

              // 성별 필터 체크
              if (selectedPod.genderFilter !== 'any') {
                if (!userGender) {
                  toast.error('성별 정보가 없어 참여할 수 없습니다. 새로고침 후 성별을 설정해주세요.');
                  return;
                }
                if (selectedPod.genderFilter !== userGender) {
                  toast.error(selectedPod.genderFilter === 'male' ? '남자만 참여할 수 있는 팟입니다.' : '여자만 참여할 수 있는 팟입니다.');
                  return;
                }
              }

              // 자리 확인
              const { data: party } = await supabase
                .from('parties')
                .select('current_member, max_member')
                .eq('id', selectedPod.id)
                .single();
              if (!party || party.current_member >= party.max_member) {
                toast.error('이미 자리가 다 찼습니다!');
                return;
              }

              // 중복 참여 확인 (rejected는 재신청 허용)
              const { data: existing } = await supabase
                .from('party_members')
                .select('user_id, status')
                .eq('party_id', selectedPod.id)
                .eq('user_id', user.id)
                .maybeSingle();
              if (existing && existing.status !== 'rejected') {
                toast.info('이미 참여한 팟입니다.');
                return;
              }

              const isDepositPod = selectedPod.hasDeposit;
              const memberStatus = isDepositPod ? 'pending' : 'joined';

              // DB 저장 (rejected → upsert로 재신청)
              const { error: joinErr } = existing
                ? await supabase.from('party_members')
                    .update({ status: memberStatus })
                    .eq('party_id', selectedPod.id)
                    .eq('user_id', user.id)
                : await supabase.from('party_members').insert({
                    party_id: selectedPod.id,
                    user_id: user.id,
                    status: memberStatus
                  });
              if (joinErr) {
                toast.error('참여 실패: ' + joinErr.message);
                return;
              }

              // 예약금 없는 팟만 즉시 인원 증가
              if (!isDepositPod) {
                const newCount = party.current_member + 1;
                const isFull = newCount >= party.max_member;
                await supabase.from('parties').update({
                  current_member: newCount,
                  ...(isFull && { status: 'full' })
                }).eq('id', selectedPod.id);
              }

              // 성공 처리
              haptics.success();
              if (isDepositPod) {
                toast.success('참여 신청 완료! 방장이 송금 확인 후 승인해드릴 거예요 🙏');
                if (selectedPod.hostId) {
                  sendPush({
                    userId: selectedPod.hostId,
                    title: '새 참여 신청 💰',
                    body: `${user.user_metadata?.full_name || user?.user_metadata?.name || '누군가'}님이 예약금을 보내고 참여 신청했어요!`,
                    url: `/?pod=${selectedPod.id}`
                  });
                }
              } else {
                toast.success('팟에 참여했습니다! 🎉');
                const notifyUsers = selectedPod.participants.map((p: any) => p.id);
                if (selectedPod.hostId && !notifyUsers.includes(selectedPod.hostId)) {
                  notifyUsers.push(selectedPod.hostId);
                }
                const targets = notifyUsers.filter((id: string) => id !== user.id);
                targets.forEach((targetId: string) => {
                  sendPush({
                    userId: targetId,
                    title: '새로운 참여자 🎉',
                    body: `${user.user_metadata?.full_name || user?.user_metadata?.name || '누군가'}님이 팟에 참여했습니다!`,
                    url: `/?pod=${selectedPod.id}`
                  });
                });
              }

              setSelectedPodId(null);
              fetchPods();
            }}
            isHost={selectedPod.hostId === user?.id}
            user={user}
          />
        )}

        <SearchScreen
          isOpen={searchSheetOpen}
          onClose={() => setSearchSheetOpen(false)}
          onCreatePod={handleOpenCreateSheet}
          onPodClick={setSelectedPodId}
          allPods={allPods}
          user={user}
          initialFocus={searchFocus}
        />

        <PushGuideSheet
          isOpen={pushGuideOpen}
          onClose={() => setPushGuideOpen(false)}
          user={user}
        />

        <PraisePromptSheet
          isOpen={praiseSheetOpen}
          onClose={() => setPraiseSheetOpen(false)}
          userId={user?.id || ''}
          parties={pendingPraiseParties}
          onPraised={(partyId, memberId) => {
            setPendingPraiseParties(prev => {
              const updated = prev.map(p =>
                p.id === partyId
                  ? { ...p, members: p.members.map(m => m.id === memberId ? { ...m, praised: true } : m) }
                  : p
              ).filter(p => p.members.some(m => !m.praised));
              return updated;
            });
          }}
        />
      </div>
    </div>
  );
}
