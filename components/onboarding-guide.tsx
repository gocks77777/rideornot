'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { haptics } from '@/lib/haptics';

const STEPS = [
  {
    emoji: '🚕',
    title: '탈래말래가 뭔가요?',
    desc: '같은 방향으로 가는 사람들끼리 택시를 나눠 타는 서비스예요. 택시비를 최대 절반까지 아낄 수 있어요!',
    highlight: '택시는 각자 잡고, 비용만 나눠요',
  },
  {
    emoji: '📍',
    title: '팟 찾기 & 참여하기',
    desc: '원하는 출발지·도착지를 검색하면 같은 방향의 팟이 나와요. 방향이 완전히 같지 않아도 중간 하차가 가능하다면 추천해드려요.',
    highlight: '"합승 가능한 팟" 섹션을 주목하세요!',
  },
  {
    emoji: '✨',
    title: '팟 만들기',
    desc: '원하는 경로로 직접 팟을 만들어보세요. 방장은 성별 필터, 예약금 설정도 할 수 있어요. 최대 인원이 채워지면 같이 출발!',
    highlight: '하단 + 버튼으로 팟을 만들어요',
  },
  {
    emoji: '⭐',
    title: '매너온도로 신뢰를',
    desc: '함께 탄 멤버를 칭찬하거나 문제가 있으면 신고할 수 있어요. 매너온도가 높은 멤버와 함께하면 더 즐거운 이동이 돼요!',
    highlight: '서로 배려하면 모두가 편해요',
  },
];

export function OnboardingGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem('onboarding_seen');
    if (!seen) {
      // 약간의 딜레이 후 표시
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    haptics.light();
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    haptics.medium();
    localStorage.setItem('onboarding_seen', '1');
    setIsOpen(false);
  };

  const current = STEPS[step];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[100] flex items-end justify-center"
          style={{ maxWidth: '480px', margin: '0 auto' }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full bg-white rounded-t-3xl p-8 pb-10"
          >
            {/* 진행 점 */}
            <div className="flex justify-center gap-2 mb-8">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-[#3182F6]' : 'w-1.5 bg-gray-200'}`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="text-center"
              >
                <div className="text-6xl mb-6">{current.emoji}</div>
                <h2 className="text-2xl font-bold text-[#191F28] mb-3">{current.title}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">{current.desc}</p>
                <div className="bg-blue-50 text-[#3182F6] text-sm font-semibold rounded-xl px-4 py-2.5 inline-block">
                  💡 {current.highlight}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-none text-sm text-gray-400 font-medium px-4 py-3"
              >
                건너뛰기
              </button>
              <Button
                onClick={handleNext}
                className="flex-1 bg-[#3182F6] text-white rounded-2xl py-6 font-bold text-base hover:bg-[#2968C8]"
              >
                {step < STEPS.length - 1 ? '다음' : '시작하기 🚀'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
