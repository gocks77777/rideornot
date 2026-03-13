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

  useEffect(() => {
    // 사용자가 로그인되어 있을 때만 확인
    if (user) {
      const checkGender = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('gender')
          .eq('id', user.id)
          .single();

        // 성별 정보가 없으면 모달을 띄움
        if (!error && !data?.gender) {
          setIsOpen(true);
        }
      };
      
      checkGender();
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!selectedGender || !user) return;
    
    setIsSubmitting(true);
    haptics.medium();

    const { error } = await supabase
      .from('users')
      .update({ gender: selectedGender })
      .eq('id', user.id);

    if (error) {
      console.error('Failed to update gender:', error);
      alert('저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            style={{ maxWidth: '480px', margin: '0 auto' }}
          >
            <div className="bg-white rounded-[32px] w-full p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#F2F4F6] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  👋
                </div>
                <h2 className="text-2xl font-bold text-[#191F28] mb-2">환영합니다!</h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  안전한 택시팟 매칭을 위해<br/>
                  회원님의 <strong>성별</strong>을 선택해주세요.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  * 한 번 선택하면 나중에 변경할 수 없습니다.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                <button
                  onClick={() => { haptics.light(); setSelectedGender('male'); }}
                  className={`py-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    selectedGender === 'male' 
                      ? 'border-[#3182F6] bg-blue-50 text-[#3182F6]' 
                      : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                  }`}
                >
                  <span className="text-3xl mb-1">👨</span>
                  <span className="font-bold text-lg">남자</span>
                </button>
                <button
                  onClick={() => { haptics.light(); setSelectedGender('female'); }}
                  className={`py-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    selectedGender === 'female' 
                      ? 'border-[#3182F6] bg-blue-50 text-[#3182F6]' 
                      : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                  }`}
                >
                  <span className="text-3xl mb-1">👩</span>
                  <span className="font-bold text-lg">여자</span>
                </button>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!selectedGender || isSubmitting}
                className="w-full h-14 rounded-2xl bg-[#3182F6] text-white font-bold text-lg shadow-lg hover:bg-[#2968C8] disabled:bg-gray-300 disabled:text-white"
              >
                {isSubmitting ? '저장 중...' : '시작하기'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
