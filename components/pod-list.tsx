'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Users, Clock, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { haptics } from '@/lib/haptics';
import { useState } from 'react';

interface Pod {
  id: string;
  departure: string;
  destination: string;
  currentMembers: number;
  maxMembers: number;
  departureTime: string;
  status: 'recruiting' | 'full' | string;
  estimatedCost?: number;
  genderFilter?: string;
}

interface PodListProps {
  pods: Pod[];
  onPodClick?: (podId: string) => void;
}

export function PodList({ pods, onPodClick }: PodListProps) {
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'recruiting' | 'full'>('all');

  const filtered = pods.filter(pod => {
    const text = filterText.trim().toLowerCase();
    const matchText = !text || pod.departure.toLowerCase().includes(text) || pod.destination.toLowerCase().includes(text);
    const matchStatus = statusFilter === 'all' || pod.status === statusFilter || (statusFilter === 'recruiting' && pod.status !== 'full');
    return matchText && matchStatus;
  });
  const getStatusBadge = (status: string, currentMembers: number, maxMembers: number) => {
    if (status === 'full') {
      return <Badge className="bg-red-500 text-white rounded-full px-3 py-1">마감</Badge>;
    }
    if (currentMembers === maxMembers - 1) {
      return <Badge className="bg-[#FFA500] text-white rounded-full px-3 py-1">마감임박</Badge>;
    }
    return <Badge className="bg-[#3182F6] text-white rounded-full px-3 py-1">모집중</Badge>;
  };

  return (
    <div className="flex flex-col gap-3 px-6 pb-24">
      {/* 필터 */}
      <div className="flex flex-col gap-2 mb-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="출발지 또는 도착지 검색"
            className="w-full h-11 pl-10 pr-10 rounded-2xl bg-[#F2F4F6] text-sm text-[#191F28] placeholder-gray-400 outline-none"
          />
          {filterText && (
            <button onClick={() => setFilterText('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {(['all', 'recruiting', 'full'] as const).map(s => (
            <button
              key={s}
              onClick={() => { haptics.light(); setStatusFilter(s); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                statusFilter === s ? 'bg-[#3182F6] text-white' : 'bg-[#F2F4F6] text-gray-600'
              }`}
            >
              {s === 'all' ? '전체' : s === 'recruiting' ? '모집중' : '마감'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-10 text-sm">검색 결과가 없어요</p>
      )}
      {filtered.map((pod, index) => (
        <motion.div
          key={pod.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            haptics.light();
            onPodClick?.(pod.id);
          }}
          className="bg-[#F2F4F6] rounded-3xl p-6 shadow-lg cursor-pointer active:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="font-bold text-lg text-[#191F28]">{pod.departure}</span>
                <ArrowRight className="w-5 h-5 text-gray-400" />
                <span className="font-bold text-lg text-[#191F28]">{pod.destination}</span>
                {pod.genderFilter === 'female' && (
                  <span className="text-xs font-bold bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">여성 전용</span>
                )}
                {pod.genderFilter === 'male' && (
                  <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">남성 전용</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[#FFA500] font-medium">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{pod.departureTime}</span>
              </div>
            </div>
            {getStatusBadge(pod.status, pod.currentMembers, pod.maxMembers)}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(pod.currentMembers / pod.maxMembers) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
                className="h-full bg-[#3182F6]"
              />
            </div>
            <div className="flex items-center gap-1.5 text-[#3182F6] font-semibold">
              <Users className="w-4 h-4" />
              <span className="text-sm">{pod.currentMembers}/{pod.maxMembers}</span>
            </div>
          </div>
          {pod.estimatedCost && pod.maxMembers > 1 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500">1인당 약</span>
              <span className="text-sm font-bold text-[#3182F6]">
                {Math.round(pod.estimatedCost / pod.maxMembers).toLocaleString()}원
              </span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                {Math.round((pod.estimatedCost - pod.estimatedCost / pod.maxMembers)).toLocaleString()}원 절약
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
