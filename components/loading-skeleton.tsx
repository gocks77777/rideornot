'use client';

import { motion } from 'framer-motion';

export function PodCardSkeleton() {
  return (
    <div className="bg-[#F2F4F6] rounded-3xl p-6 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-5 bg-gray-300 rounded-full w-20"
            />
            <div className="h-5 bg-gray-300 rounded-full w-5" />
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="h-5 bg-gray-300 rounded-full w-20"
            />
          </div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            className="h-4 bg-gray-300 rounded-full w-32"
          />
        </div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
          className="h-7 bg-gray-300 rounded-full w-16"
        />
      </div>
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
          className="flex-1 h-2 bg-gray-300 rounded-full"
        />
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
          className="h-4 bg-gray-300 rounded-full w-12"
        />
      </div>
    </div>
  );
}

export function LivePodSkeleton() {
  return (
    <div className="snap-start flex-shrink-0 w-64">
      <div className="bg-[#F2F4F6] rounded-3xl p-5 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-6 bg-gray-300 rounded-full w-24"
          />
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            className="h-6 bg-gray-300 rounded-full w-12"
          />
        </div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          className="h-4 bg-gray-300 rounded-full w-20"
        />
      </div>
    </div>
  );
}
