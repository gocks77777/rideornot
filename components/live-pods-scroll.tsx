'use client';

import { motion } from 'framer-motion';
import { Users, Clock, ArrowRight } from 'lucide-react';
import { haptics } from '@/lib/haptics';
import { shortenAddress } from '@/components/map-selector';

interface Pod {
  id: string;
  departure: string;
  destination: string;
  currentMembers: number;
  maxMembers: number;
  departureTime: string;
}

interface LivePodsScrollProps {
  pods: Pod[];
  onPodClick?: (podId: string) => void;
}

export function LivePodsScroll({ pods, onPodClick }: LivePodsScrollProps) {
  return (
    <div className="w-full overflow-hidden">
      <h3 className="text-sm font-semibold text-gray-600 mb-3 px-6">실시간 팟</h3>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x px-6 pb-2">
        {pods.map((pod, index) => (
          <motion.div
            key={pod.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="snap-start flex-shrink-0 w-64"
          >
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                haptics.light();
                onPodClick?.(pod.id);
              }}
              className="bg-[#F2F4F6] rounded-3xl p-5 shadow-sm cursor-pointer active:shadow-none transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 mr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#191F28] text-sm truncate">
                      {shortenAddress(pod.departure) || '출발지'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="font-bold text-[#3182F6] text-sm truncate">
                      {shortenAddress(pod.destination) || '도착지'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-white rounded-full px-2.5 py-1 flex-shrink-0">
                  <Users className="w-3.5 h-3.5 text-[#3182F6]" />
                  <span className="text-sm font-semibold text-[#3182F6]">
                    {pod.currentMembers}/{pod.maxMembers}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[#FFA500] font-medium">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{pod.departureTime}</span>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
