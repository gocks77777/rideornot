'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, LogIn, LogOut } from 'lucide-react';
import { FloatingNav } from '@/components/floating-nav';
import { LivePodsScroll } from '@/components/live-pods-scroll';
import { PodList } from '@/components/pod-list';
import { CreatePodSheet } from '@/components/create-pod-sheet';
import { PodDetail } from '@/components/pod-detail';
import { MyPage } from '@/components/my-page';
import { SearchScreen } from '@/components/search-screen';
import { haptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';

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
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  const [selectedPodId, setSelectedPodId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [allPods, setAllPods] = useState<any[]>([]);

  const fetchPods = async () => {
    const { data, error } = await supabase
      .from('parties')
      .select(`
        *,
        host:users!parties_host_id_fkey(nickname, avatar_url, manner_score, bank_account),
        party_members(user_id, status, user:users(nickname, avatar_url))
      `)
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
          departureTime: new Date(p.departure_time).toLocaleString('ko-KR', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          }),
          status: p.status,
          hostName: p.host?.nickname || '방장',
          hostBankAccount: p.host?.bank_account || '',
          estimatedCost: fare,
          participants: p.party_members?.map((m: any) => ({
            id: m.user_id,
            name: m.user?.nickname || '멤버',
            avatar: m.user?.avatar_url || ''
          })) || []
        };
      });
      setAllPods(formatted);
    }
  };

  useEffect(() => {
    // Session 체크
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 인증 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchPods();

    return () => subscription.unsubscribe();
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

  const handleCreatePod = async (data: any) => {
    if (!user) {
      alert('로그인이 필요합니다.');
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
      alert('팟 생성 중 오류가 발생했습니다.');
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
                  onClick={() => haptics.light()}
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
                    ? `${user?.user_metadata?.full_name || user?.user_metadata?.name || '운전자'}님!\n오늘도 택시비 아껴볼까요?`
                    : '반가워요! 👋\n오늘도 택시비 아껴볼까요?'}
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="px-6 mb-8"
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    haptics.light();
                    setSearchSheetOpen(!searchSheetOpen);
                  }}
                  className="w-full bg-[#F2F4F6] rounded-3xl p-6 shadow-lg flex items-center gap-4 active:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-full bg-[#3182F6] flex items-center justify-center">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-gray-600">어디로 가시나요?</span>
                </motion.button>
              </motion.div>

              <LivePodsScroll pods={livePods} onPodClick={setSelectedPodId} />
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
              <PodList pods={allPods} onPodClick={setSelectedPodId} />
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
              <MyPage user={user} />
            </motion.div>
          )}
        </AnimatePresence>

        <FloatingNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onCreatePod={() => setIsCreateSheetOpen(true)}
          user={user}
        />

        <CreatePodSheet
          isOpen={isCreateSheetOpen}
          onClose={() => setIsCreateSheetOpen(false)}
          onSubmit={handleCreatePod}
        />

        {selectedPod && (
          <PodDetail
            pod={selectedPod}
            onBack={() => setSelectedPodId(null)}
            onJoin={async () => {
              if (!user) { alert('로그인이 필요합니다.'); return; }
              // Atomic join: check current_member < max_member
              const { data: party } = await supabase
                .from('parties')
                .select('current_member, max_member')
                .eq('id', selectedPod.id)
                .single();
              if (!party || party.current_member >= party.max_member) {
                alert('이미 자리가 다 찼습니다!');
                return;
              }
              // Check not already joined
              const { data: existing } = await supabase
                .from('party_members')
                .select('user_id')
                .eq('party_id', selectedPod.id)
                .eq('user_id', user.id)
                .single();
              if (existing) {
                alert('이미 참여한 팟입니다.');
                return;
              }
              const { error: joinErr } = await supabase.from('party_members').insert({
                party_id: selectedPod.id,
                user_id: user.id,
                status: 'joined'
              });
              if (joinErr) { alert('참여 실패: ' + joinErr.message); return; }
              await supabase.from('parties').update({
                current_member: party.current_member + 1
              }).eq('id', selectedPod.id);
              haptics.success();
              alert('팟에 참여했습니다! 🎉');
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
          onCreatePod={() => setIsCreateSheetOpen(true)}
          onPodClick={setSelectedPodId}
          allPods={allPods}
          user={user}
        />
      </div>
    </div>
  );
}
