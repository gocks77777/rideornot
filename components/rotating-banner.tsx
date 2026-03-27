'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function RotatingBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % 2);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: '80px' }}>
      <AnimatePresence mode="wait">
        {current === 0 ? (
          <motion.div
            key="haenyeo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <img
              src="/banners/haenyo-ad.jpg"
              alt="말자좋은해녀 포차 광고"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>
        ) : (
          <motion.a
            key="event"
            href="mailto:gocks77777@naver.com?subject=탈래말래 배너 광고 문의"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-between px-5"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #3182F6 60%, #06b6d4 100%)' }}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-white/70 uppercase tracking-wide">AD</span>
                <span className="text-xs font-bold text-yellow-300 bg-yellow-400/20 px-2 py-0.5 rounded-full">선착순 3명</span>
              </div>
              <p className="text-white font-bold text-[15px] leading-snug">무료 배너 광고 이벤트 🎉</p>
              <p className="text-white/70 text-xs mt-0.5">gocks77777@naver.com 으로 문의하세요</p>
            </div>
            <div className="text-white/80 text-xl ml-3 flex-shrink-0">→</div>
          </motion.a>
        )}
      </AnimatePresence>

      {/* 인디케이터 dots */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${current === 0 ? 'bg-white' : 'bg-white/40'}`} />
        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${current === 1 ? 'bg-white' : 'bg-white/40'}`} />
      </div>
    </div>
  );
}
