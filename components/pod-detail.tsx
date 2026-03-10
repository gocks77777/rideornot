'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Users, Clock, MessageCircle, Plus, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { PaymentModal } from '@/components/payment-modal';
import { haptics } from '@/lib/haptics';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  paid?: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

interface PodDetailProps {
  pod: {
    id: string;
    departure: string;
    destination: string;
    currentMembers: number;
    maxMembers: number;
    departureTime: string;
    estimatedCost: number;
    participants: Participant[];
  };
  onBack: () => void;
  onJoin?: () => void;
  isHost?: boolean;
}

export function PodDetail({ pod, onBack, onJoin, isHost = false }: PodDetailProps) {
  const costPerPerson = Math.round(pod.estimatedCost / pod.maxMembers);
  const emptySlots = pod.maxMembers - pod.participants.length;
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [participantsPaidStatus, setParticipantsPaidStatus] = useState<Record<string, boolean>>(
    pod.participants.reduce((acc, p) => ({ ...acc, [p.id]: p.paid || false }), {})
  );

  const togglePaidStatus = (participantId: string) => {
    setParticipantsPaidStatus(prev => ({
      ...prev,
      [participantId]: !prev[participantId]
    }));
    haptics.light();
  };

  const handleJoinClick = () => {
    setShowPaymentModal(true);
    haptics.light();
  };

  const handlePaymentConfirm = () => {
    setShowPaymentModal(false);
    onJoin?.();
  };

  const chatMessages: ChatMessage[] = [
    { id: '1', userId: '1', userName: '김민수', message: '정문 앞에서 만나요!', timestamp: '10분 전' },
    { id: '2', userId: '2', userName: '이지은', message: '네 알겠습니다', timestamp: '5분 전' },
  ];

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 bg-white z-50 overflow-y-auto pb-24"
      style={{ maxWidth: '480px', margin: '0 auto' }}
    >
      <header className="sticky top-0 bg-white z-10 px-6 py-4 flex items-center gap-3 border-b border-gray-100">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            haptics.light();
            onBack();
          }}
          className="w-10 h-10 rounded-full bg-[#F2F4F6] flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </motion.button>
        <h1 className="text-xl font-bold text-[#191F28]">팟 상세</h1>
      </header>

      <div className="px-6 py-6 space-y-6">
        <div className="bg-gray-100 rounded-3xl h-48 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">Map View</p>
          </div>
        </div>

        <div className="bg-[#F2F4F6] rounded-3xl p-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">경로</h2>
          <div className="relative pl-8">
            <div className="absolute left-2 top-3 bottom-3 w-0.5 bg-gradient-to-b from-[#3182F6] to-[#FFA500]"></div>

            <div className="relative mb-6">
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#3182F6] border-4 border-white"></div>
              <div>
                <p className="text-sm text-gray-600 mb-1">출발</p>
                <p className="font-bold text-[#191F28] text-lg">{pod.departure}</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#FFA500] border-4 border-white"></div>
              <div>
                <p className="text-sm text-gray-600 mb-1">도착</p>
                <p className="font-bold text-[#191F28] text-lg">{pod.destination}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-[#FFA500]">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">{pod.departureTime}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#F2F4F6] rounded-3xl p-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">참여자</h2>
          <div className="space-y-3">
            {pod.participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-3 bg-white rounded-2xl p-3">
                <div className="w-12 h-12 rounded-full bg-[#3182F6] flex items-center justify-center text-white font-bold flex-shrink-0">
                  {participant.name.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-[#191F28] flex-1">{participant.name}</span>
                {isHost && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => togglePaidStatus(participant.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      participantsPaidStatus[participant.id]
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {participantsPaidStatus[participant.id] ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>송금완료</span>
                      </>
                    ) : (
                      <span>미송금</span>
                    )}
                  </motion.button>
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

        <div className="bg-[#F2F4F6] rounded-3xl p-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">예상 비용</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">총 택시비</span>
              <span className="font-semibold text-[#191F28]">{pod.estimatedCost.toLocaleString()} 원</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-gray-600">1인당</span>
              <span className="font-bold text-2xl text-[#3182F6]">{costPerPerson.toLocaleString()} 원</span>
            </div>
          </div>
        </div>

        <div className="bg-[#F2F4F6] rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-600">댓글</h2>
          </div>

          <div className="space-y-3 mb-4">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="bg-white rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-[#191F28]">{msg.userName}</span>
                  <span className="text-xs text-gray-500">{msg.timestamp}</span>
                </div>
                <p className="text-gray-700">{msg.message}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="댓글을 입력하세요..."
              className="flex-1 rounded-full bg-white border-0 px-4"
            />
            <Button
              className="rounded-full bg-[#3182F6] text-white px-6"
              onClick={() => haptics.light()}
            >
              전송
            </Button>
          </div>
        </div>
      </div>

      {!isHost && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100" style={{ maxWidth: '480px', margin: '0 auto' }}>
          <Button
            className="w-full bg-[#3182F6] text-white rounded-full py-6 text-lg font-bold shadow-lg hover:bg-[#2968C8]"
            onClick={handleJoinClick}
          >
            참여하기
          </Button>
        </div>
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirmPayment={handlePaymentConfirm}
        amount={costPerPerson}
        hostName={pod.participants[0]?.name || '방장'}
      />
    </motion.div>
  );
}
