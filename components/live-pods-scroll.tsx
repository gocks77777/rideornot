'use client';

import { motion } from 'framer-motion';
import { Users, Clock, ArrowRight, RefreshCw } from 'lucide-react'; // RefreshCw 아이콘 추가
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
  onRefresh?: () => void; // 새로고침 함수 추가
}

export function LivePodsScroll({ pods, onPodClick, onRefresh }: LivePodsScrollProps) {
  return (
    <div className="w-full overflow-hidden">
      <div className="flex items-center justify-between mb-3 px-6">
        <h3 className="text-sm font-semibold text-gray-600">실시간 팟</h3>
        {onRefresh && (
          <button 
            onClick={onRefresh} 
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 active:scale-95 transition-transform"
          >
            <RefreshCw className="w-3 h-3" />
            <span>새로고침</span>
          </button>
        )}
      </div>
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
