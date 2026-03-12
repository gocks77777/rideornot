'use client';

import { motion } from 'framer-motion';
import { Settings, QrCode, Upload, Clock, Users, ArrowRight, LogOut, LogIn, CreditCard, Edit2, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { haptics } from '@/lib/haptics';

interface Pod {
  id: string;
  departure: string;
  destination: string;
  departureTime: string;
  status: 'completed' | 'upcoming' | 'cancelled';
}

import { supabase } from '@/lib/supabase';

export function MyPage({ user }: { user?: any }) {
  const [mannerTemp, setMannerTemp] = useState(36.5);
  const [bankAccount, setBankAccount] = useState('');
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [hostingPods, setHostingPods] = useState<Pod[]>([]);
  const [joinedPods, setJoinedPods] = useState<Pod[]>([]);

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
      .from('parties')
      .select('*')
      .eq('host_id', user.id)
      .order('departure_time', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setHostingPods(data.map(p => ({
            id: p.id,
            departure: p.start_point,
            destination: p.end_point,
            departureTime: new Date(p.departure_time).toLocaleString('ko-KR', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }),
            status: (p.status === 'recruiting' ? 'upcoming' : 'completed') as "upcoming" | "completed" | "cancelled"
          })));
        }
      });

    // Fetch pods I joined (where I am a member but not the host)
    supabase
      .from('party_members')
      .select('parties(*)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          const joined = data
            .map((m: any) => m.parties)
            .filter((p: any) => p && p.host_id !== user.id) // exclude hosted ones
            .map((p: any) => ({
              id: p.id,
              departure: p.start_point,
              destination: p.end_point,
              departureTime: new Date(p.departure_time).toLocaleString('ko-KR', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              }),
              status: (p.status === 'recruiting' ? 'upcoming' : 'completed') as "upcoming" | "completed" | "cancelled"
            }));
          setJoinedPods(joined);
        }
      });
  }, [user]);

  const handleKakaoLogin = async () => {
    haptics.light();
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
    });
  };

  const handleLogout = async () => {
    haptics.light();
    await supabase.auth.signOut();
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
      alert('계좌 정보 저장 중 오류가 발생했습니다.');
    } else {
      setIsEditingAccount(false);
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
      case 'upcoming':
        return <span className="text-xs font-semibold text-[#3182F6]">예정</span>;
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
                onClick={() => haptics.light()}
                className="bg-white rounded-2xl p-4 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#191F28]">{pod.departure}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="font-bold text-[#191F28]">{pod.destination}</span>
                  </div>
                  {getStatusBadge(pod.status)}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-sm">{pod.departureTime}</span>
                </div>
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
                onClick={() => haptics.light()}
                className="bg-white rounded-2xl p-4 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#191F28]">{pod.departure}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="font-bold text-[#191F28]">{pod.destination}</span>
                  </div>
                  {getStatusBadge(pod.status)}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-sm">{pod.departureTime}</span>
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
    </div>
  );
}
