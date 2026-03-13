'use client';

import { motion } from 'framer-motion';

export function PodListSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-6 pb-24">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-[#F2F4F6] rounded-3xl p-6 h-[140px] w-full relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: 'linear',
            }}
          />
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-5 w-20 bg-gray-200 rounded-full" />
                <div className="w-4 h-4 bg-gray-200 rounded-full" />
                <div className="h-5 w-20 bg-gray-200 rounded-full" />
              </div>
              <div className="h-4 w-24 bg-gray-200 rounded-full" />
            </div>
            <div className="h-6 w-14 bg-gray-200 rounded-full" />
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 h-2 bg-gray-200 rounded-full" />
            <div className="h-4 w-10 bg-gray-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LivePodsSkeleton() {
  return (
    <div className="w-full overflow-hidden">
      <h3 className="text-sm font-semibold text-gray-600 mb-3 px-6">실시간 팟</h3>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-6 pb-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-64 h-[100px] bg-[#F2F4F6] rounded-3xl p-5 relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: 'linear',
              }}
            />
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded-full" />
                <div className="h-4 w-16 bg-gray-200 rounded-full" />
              </div>
              <div className="h-6 w-12 bg-gray-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
