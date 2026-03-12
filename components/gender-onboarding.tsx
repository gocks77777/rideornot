'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { haptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';

interface GenderOnboardingProps {
  isOpen: boolean;
  userId: string;
  onComplete: (gender: 'male' | 'female') => void;
}

export function GenderOnboarding({ isOpen, userId, onComplete }: GenderOnboardingProps) {
  const [selected, setSelected] = useState<'male' | 'female' | null>(null);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    haptics.success();

    const { error } = await supabase
      .from('users')
      .update({ gender: selected })
      .eq('id', userId);

    if (error) {
      console.error('Gender save error:', error);
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      setSaving(false);
      return;
    }

    onComplete(selected);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white z-[100] flex items-center justify-center"
          style={{ maxWidth: '480px', margin: '0 auto' }}
        >
          <div className="px-8 w-full">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-12"
            >
              <h1 className="text-3xl font-black text-[#191F28] mb-3">환영합니다! 👋</h1>
              <p className="text-gray-500 text-lg">성별을 선택해주세요</p>
              <p className="text-gray-400 text-sm mt-1">팟 매칭에 사용됩니다</p>
            </motion.div>

            <div className="flex gap-4 mb-12">
              <motion.button
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSelected('male'); haptics.light(); }}
                className={`flex-1 rounded-3xl p-8 transition-all border-2 ${
                  selected === 'male'
                    ? 'bg-blue-50 border-[#3182F6] shadow-lg shadow-blue-200'
                    : 'bg-[#F2F4F6] border-transparent'
                }`}
              >
                <div className="text-5xl mb-4">🙋‍♂️</div>
                <span className={`text-xl font-bold ${
                  selected === 'male' ? 'text-[#3182F6]' : 'text-[#191F28]'
                }`}>남성</span>
              </motion.button>

              <motion.button
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSelected('female'); haptics.light(); }}
                className={`flex-1 rounded-3xl p-8 transition-all border-2 ${
                  selected === 'female'
                    ? 'bg-pink-50 border-pink-400 shadow-lg shadow-pink-200'
                    : 'bg-[#F2F4F6] border-transparent'
                }`}
              >
                <div className="text-5xl mb-4">🙋‍♀️</div>
                <span className={`text-xl font-bold ${
                  selected === 'female' ? 'text-pink-500' : 'text-[#191F28]'
                }`}>여성</span>
              </motion.button>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={handleConfirm}
                disabled={!selected || saving}
                className={`w-full rounded-full py-7 text-lg font-bold transition-all ${
                  selected
                    ? 'bg-[#3182F6] text-white hover:bg-[#2968C8] shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {saving ? '저장 중...' : '시작하기'}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
