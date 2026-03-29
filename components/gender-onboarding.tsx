'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { haptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';

interface GenderOnboardingProps {
  user: any;
  onComplete: (gender: 'male' | 'female') => void;
}

export function GenderOnboarding({ user, onComplete }: GenderOnboardingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeLocation, setAgreeLocation] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);

  const allAgreed = agreeTerms && agreePrivacy && agreeLocation && agreeAge;

  useEffect(() => {
    if (user) {
      const checkGender = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('gender')
          .eq('id', user.id)
          .single();

        if (!error && !data?.gender) {
          setIsOpen(true);
        }
      };

      checkGender();
    }
  }, [user]);

  const handleAgreeAll = () => {
    const newVal = !allAgreed;
    haptics.light();
    setAgreeTerms(newVal);
    setAgreePrivacy(newVal);
    setAgreeLocation(newVal);
    setAgreeAge(newVal);
  };

  const handleSubmit = async () => {
    if (!selectedGender || !user || !allAgreed) return;

    setIsSubmitting(true);
    haptics.medium();

    const { error } = await supabase
      .from('users')
      .update({ gender: selectedGender })
      .eq('id', user.id);

    if (error) {
      console.error('Failed to update gender:', error);
      haptics.error();
      setIsSubmitting(false);
      return;
    }

    haptics.success();
    setIsOpen(false);
    onComplete(selectedGender);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
            style={{ maxWidth: '480px', margin: '0 auto' }}
          >
            <div className="bg-white rounded-[32px] w-full p-6 shadow-2xl my-4">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-[#F2F4F6] rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                  👋
                </div>
                <h2 className="text-xl font-bold text-[#191F28] mb-1">환영합니다!</h2>
                <p className="text-gray-500 text-sm">
                  서비스 이용을 위해 아래 항목을 확인해주세요.
                </p>
              </div>

              {/* 성별 선택 */}
              <div className="mb-5">
                <p className="text-sm font-bold text-[#191F28] mb-2">성별 선택</p>
                <p className="text-xs text-gray-400 mb-3">안전한 매칭을 위해 필요하며, 변경할 수 없습니다.</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { haptics.light(); setSelectedGender('male'); }}
                    className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                      selectedGender === 'male'
                        ? 'border-[#3182F6] bg-blue-50 text-[#3182F6]'
                        : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-2xl">👨</span>
                    <span className="font-bold">남자</span>
                  </button>
                  <button
                    onClick={() => { haptics.light(); setSelectedGender('female'); }}
                    className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                      selectedGender === 'female'
                        ? 'border-[#3182F6] bg-blue-50 text-[#3182F6]'
                        : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-2xl">👩</span>
                    <span className="font-bold">여자</span>
                  </button>
                </div>
              </div>

              {/* 약관 동의 */}
              <div className="mb-5 bg-[#F8F9FA] rounded-2xl p-4">
                <button
                  onClick={handleAgreeAll}
                  className="flex items-center gap-3 w-full mb-3 pb-3 border-b border-gray-200"
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    allAgreed ? 'bg-[#3182F6] border-[#3182F6]' : 'border-gray-300'
                  }`}>
                    {allAgreed && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <span className="font-bold text-[#191F28] text-sm">전체 동의하기</span>
                </button>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={() => { haptics.light(); setAgreeTerms(!agreeTerms); }}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      agreeTerms ? 'bg-[#3182F6] border-[#3182F6]' : 'border-gray-300'
                    }`}>
                      {agreeTerms && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <span className="text-sm text-gray-600 flex-1">[필수] 이용약관 동의</span>
                    <a href="/terms" target="_blank" className="text-xs text-[#3182F6] flex-shrink-0">보기</a>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={() => { haptics.light(); setAgreePrivacy(!agreePrivacy); }}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      agreePrivacy ? 'bg-[#3182F6] border-[#3182F6]' : 'border-gray-300'
                    }`}>
                      {agreePrivacy && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <span className="text-sm text-gray-600 flex-1">[필수] 개인정보 수집·이용 동의</span>
                    <a href="/privacy" target="_blank" className="text-xs text-[#3182F6] flex-shrink-0">보기</a>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeLocation}
                      onChange={() => { haptics.light(); setAgreeLocation(!agreeLocation); }}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      agreeLocation ? 'bg-[#3182F6] border-[#3182F6]' : 'border-gray-300'
                    }`}>
                      {agreeLocation && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <span className="text-sm text-gray-600 flex-1">[필수] 위치정보 수집·이용 동의</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeAge}
                      onChange={() => { haptics.light(); setAgreeAge(!agreeAge); }}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      agreeAge ? 'bg-[#3182F6] border-[#3182F6]' : 'border-gray-300'
                    }`}>
                      {agreeAge && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <span className="text-sm text-gray-600 flex-1">[필수] 만 14세 이상입니다</span>
                  </label>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!selectedGender || !allAgreed || isSubmitting}
                className="w-full h-14 rounded-2xl bg-[#3182F6] text-white font-bold text-lg shadow-lg hover:bg-[#2968C8] disabled:bg-gray-300 disabled:text-white"
              >
                {isSubmitting ? '저장 중...' : '동의하고 시작하기'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
