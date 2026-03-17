'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, MapPin, Clock, Users, Package } from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { haptics } from '@/lib/haptics';
import { shortenAddress } from '@/components/map-selector';

interface Pod {
  id: string;
  departure: string;
  destination: string;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  currentMembers: number;
  maxMembers: number;
  departureTime: string;
  status: 'recruiting' | 'full';
}

interface SearchScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePod: () => void;
  onPodClick: (podId: string) => void;
  allPods: Pod[];
  user?: any;
  initialFocus?: 'departure' | 'destination' | null;
}

function getDistKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function SearchScreen({ isOpen, onClose, onCreatePod, onPodClick, allPods, user, initialFocus }: SearchScreenProps) {
  const [depQuery, setDepQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Pod[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const depInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async (dep: string, dest: string) => {
    if (!dep.trim() && !dest.trim()) { 
      setSearchResults([]); 
      return; 
    }

    setIsSearching(true);

    let depMatched: Pod[] | null = null;
    let destMatched: Pod[] | null = null;

    // 1) Departures
    if (dep.trim()) {
      const q = dep.toLowerCase();
      const textResults = allPods.filter(pod => pod.departure?.toLowerCase().includes(q));
      try {
        const res = await fetch(`/api/geocode?query=${encodeURIComponent(dep)}`);
        const data = await res.json();
        if (data.results?.length > 0) {
          const { lat, lng } = data.results[0];
          const nearbyPods = allPods.filter(pod => {
            if (textResults.some(tr => tr.id === pod.id)) return false;
            if (pod.startLat && pod.startLng) {
              return getDistKm(lat, lng, pod.startLat, pod.startLng) < 5;
            }
            return false;
          });
          depMatched = [...textResults, ...nearbyPods];
        } else {
          depMatched = textResults;
        }
      } catch {
        depMatched = textResults;
      }
    }

    // 2) Destinations
    if (dest.trim()) {
      const q = dest.toLowerCase();
      const textResults = allPods.filter(pod => pod.destination?.toLowerCase().includes(q));
      try {
        const res = await fetch(`/api/geocode?query=${encodeURIComponent(dest)}`);
        const data = await res.json();
        if (data.results?.length > 0) {
          const { lat, lng } = data.results[0];
          const nearbyPods = allPods.filter(pod => {
            if (textResults.some(tr => tr.id === pod.id)) return false;
            if (pod.endLat && pod.endLng) {
              return getDistKm(lat, lng, pod.endLat, pod.endLng) < 5;
            }
            return false;
          });
          destMatched = [...textResults, ...nearbyPods];
        } else {
          destMatched = textResults;
        }
      } catch {
        destMatched = textResults;
      }
    }

    if (depMatched && destMatched) {
      const _destMatched = destMatched;
      setSearchResults(depMatched.filter(d => _destMatched.some(ds => ds.id === d.id)));
    } else if (depMatched) {
      setSearchResults(depMatched);
    } else if (destMatched) {
      setSearchResults(destMatched);
    } else {
      setSearchResults([]);
    }
    
    setIsSearching(false);
  }, [allPods]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(depQuery, destQuery);
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [depQuery, destQuery, handleSearch]);

  const handleCreateFromSearch = () => {
    haptics.medium();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    onClose();
    onCreatePod();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed inset-0 bg-white z-50"
          style={{ maxWidth: '480px', margin: '0 auto' }}
        >
          <header className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  haptics.light();
                  onClose();
                }}
                className="w-10 h-10 rounded-full bg-[#F2F4F6] flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </motion.button>
              <h1 className="text-xl font-bold text-[#191F28]">팟 검색</h1>
            </div>

            <div className="flex flex-col gap-3 relative">
              <div className="absolute left-[24px] top-[40px] bottom-[30px] border-l-2 border-dashed border-gray-200" style={{ opacity: 0.5 }}></div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={depQuery}
                  onChange={(e) => setDepQuery(e.target.value)}
                  placeholder="출발지를 검색하세요"
                  className="h-14 rounded-2xl bg-[#F2F4F6] border-0 pl-12 pr-4 text-base focus-visible:ring-[#3182F6]"
                  autoFocus={initialFocus === 'departure' || !initialFocus}
                />
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={destQuery}
                  onChange={(e) => setDestQuery(e.target.value)}
                  placeholder="도착지를 검색하세요"
                  className="h-14 rounded-2xl bg-[#F2F4F6] border-0 pl-12 pr-4 text-base focus-visible:ring-[#3182F6]"
                  autoFocus={initialFocus === 'destination'}
                />
              </div>
            </div>
          </header>

          <div className="px-6 py-6">
            {(depQuery || destQuery) && searchResults.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">
                  {searchResults.length}개의 팟을 찾았습니다
                </p>
                {searchResults.map((pod, index) => (
                  <motion.div
                    key={pod.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      haptics.light();
                      onPodClick(pod.id);
                      onClose();
                    }}
                    className="bg-[#F2F4F6] rounded-2xl p-4 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="font-bold text-[#191F28]">{pod.departure}</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-bold text-[#191F28]">{pod.destination}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#FFA500]">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-sm font-medium">{pod.departureTime}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[#3182F6]">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          {pod.currentMembers}/{pod.maxMembers}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {(depQuery || destQuery) && searchResults.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F2F4F6] rounded-3xl flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-[#191F28] mb-2">
                  찾으시는 팟이 없네요
                </h3>
                <p className="text-gray-600 mb-6">
                  직접 이 경로로 팟을 만들어볼까요?
                </p>
                <Button
                  onClick={handleCreateFromSearch}
                  className="bg-[#3182F6] text-white rounded-2xl h-14 px-8 font-bold hover:bg-[#2968C8]"
                >
                  이 경로로 팟 만들기
                </Button>
              </motion.div>
            )}

            {!(depQuery || destQuery) && (
              <div className="text-center py-16">
                <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">출발지나 도착지를 검색해보세요</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
