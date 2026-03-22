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

// 점(px,py)에서 선분(ax,ay)→(bx,by)까지의 최단 거리(km)
function pointToSegmentDistKm(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number
): number {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return getDistKm(px, py, ax, ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return getDistKm(px, py, ax + t * dx, ay + t * dy);
}

// 두 경로의 방향 코사인 유사도 (-1 ~ 1, 높을수록 같은 방향)
function directionSimilarity(
  lat1: number, lng1: number, lat2: number, lng2: number,
  lat3: number, lng3: number, lat4: number, lng4: number
): number {
  const ax = lat2 - lat1, ay = lng2 - lng1;
  const bx = lat4 - lat3, by = lng4 - lng3;
  const dot = ax * bx + ay * by;
  const magA = Math.sqrt(ax * ax + ay * ay);
  const magB = Math.sqrt(bx * bx + by * by);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

/**
 * 팟이 "내 경로와 합승 가능한가" 판단
 *
 * 케이스 A: 팟 도착지가 내 경로 위에 있음 (팟 목적지에서 내려서 계속 이동)
 *   예) 오송→광명 팟 + 오송→서울역 사용자 → 광명에서 내려서 서울역 가면 됨
 *
 * 케이스 B: 내 목적지가 팟 경로 위에 있음 (중간 하차)
 *   예) 오송→인천 팟 + 오송→서울역 사용자 → 서울역에서 중간 하차
 */
function isRouteCompatible(
  uDepLat: number, uDepLng: number,   // 사용자 출발지
  uDestLat: number, uDestLng: number, // 사용자 목적지
  pDepLat: number, pDepLng: number,   // 팟 출발지
  pDestLat: number, pDestLng: number  // 팟 목적지
): boolean {
  // 팟 출발지가 사용자 출발지에서 10km 이내여야 함
  if (getDistKm(uDepLat, uDepLng, pDepLat, pDepLng) > 10) return false;

  // 방향이 반대면 제외 (코사인 유사도 0 미만 = 90도 초과)
  if (directionSimilarity(uDepLat, uDepLng, uDestLat, uDestLng,
                          pDepLat, pDepLng, pDestLat, pDestLng) < 0) return false;

  const totalUserDist = getDistKm(uDepLat, uDepLng, uDestLat, uDestLng);
  // 허용 오차: 경로 길이의 15% 또는 최소 5km
  const threshold = Math.max(5, totalUserDist * 0.15);

  // 케이스 A: 팟 도착지가 사용자 경로 선분 위에 있음
  const podEndOnUserRoute = pointToSegmentDistKm(
    pDestLat, pDestLng,
    uDepLat, uDepLng, uDestLat, uDestLng
  ) < threshold;
  // + 팟이 최소 20% 이상 커버
  const podCoverageA = getDistKm(uDepLat, uDepLng, pDestLat, pDestLng) > totalUserDist * 0.2;

  // 케이스 B: 사용자 목적지가 팟 경로 선분 위에 있음 (중간 하차)
  const userDestOnPodRoute = pointToSegmentDistKm(
    uDestLat, uDestLng,
    pDepLat, pDepLng, pDestLat, pDestLng
  ) < threshold;
  // + 팟이 사용자 목적지를 넘어 더 가야 의미 있음 (최소 10% 이상)
  const podCoverageB = getDistKm(pDepLat, pDepLng, pDestLat, pDestLng) >
                       getDistKm(pDepLat, pDepLng, uDestLat, uDestLng) * 1.1;

  return (podEndOnUserRoute && podCoverageA) || (userDestOnPodRoute && podCoverageB);
}

export function SearchScreen({ isOpen, onClose, onCreatePod, onPodClick, allPods, user, initialFocus }: SearchScreenProps) {
  const [depQuery, setDepQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Pod[]>([]);
  const [directionResults, setDirectionResults] = useState<Pod[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const depInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async (dep: string, dest: string) => {
    if (!dep.trim() && !dest.trim()) {
      setSearchResults([]);
      setDirectionResults([]);
      return;
    }

    setIsSearching(true);

    let depMatched: Pod[] | null = null;
    let destMatched: Pod[] | null = null;

    let depCoords: { lat: number; lng: number } | null = null;
    let destCoords: { lat: number; lng: number } | null = null;

    // 1) Departures
    if (dep.trim()) {
      const q = dep.toLowerCase();
      const textResults = allPods.filter(pod => pod.departure?.toLowerCase().includes(q));
      try {
        const res = await fetch(`/api/geocode?query=${encodeURIComponent(dep)}`);
        const data = await res.json();
        if (data.results?.length > 0) {
          const { lat, lng } = data.results[0];
          depCoords = { lat, lng };
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
          destCoords = { lat, lng };
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

    let exactResults: Pod[] = [];
    if (depMatched && destMatched) {
      const _destMatched = destMatched;
      exactResults = depMatched.filter(d => _destMatched.some(ds => ds.id === d.id));
    } else if (depMatched) {
      exactResults = depMatched;
    } else if (destMatched) {
      exactResults = destMatched;
    }
    setSearchResults(exactResults);

    // 3) 경로 호환 매칭: 출발/도착 좌표가 모두 있을 때
    console.log('[방향매칭] depCoords:', depCoords, 'destCoords:', destCoords, 'allPods count:', allPods.length);
    if (depCoords && destCoords) {
      const dirMatched = allPods.filter(pod => {
        if (exactResults.some(r => r.id === pod.id)) return false;
        if (!pod.startLat || !pod.startLng || !pod.endLat || !pod.endLng) {
          console.log('[방향매칭] 좌표없음 제외:', pod.departure, '→', pod.destination);
          return false;
        }
        const result = isRouteCompatible(
          depCoords!.lat, depCoords!.lng,
          destCoords!.lat, destCoords!.lng,
          pod.startLat, pod.startLng,
          pod.endLat, pod.endLng
        );
        console.log(`[방향매칭] ${pod.departure}→${pod.destination}: ${result ? '✅' : '❌'}`);
        return result;
      });
      console.log('[방향매칭] 결과:', dirMatched.length, '개');
      setDirectionResults(dirMatched);
    } else {
      setDirectionResults([]);
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

          <div className="px-6 py-6 space-y-6">
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

            {/* 방향 기반 매칭 결과 */}
            {(depQuery && destQuery) && directionResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#191F28]">합승 가능한 팟</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">경로 호환 🛣️</span>
                </div>
                <p className="text-xs text-gray-500 -mt-2">목적지가 달라도 중간 하차하거나 환승해서 갈 수 있어요</p>
                {directionResults.map((pod, index) => (
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
                    className="bg-green-50 border border-green-200 rounded-2xl p-4 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-green-600" />
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

            {(depQuery || destQuery) && searchResults.length === 0 && directionResults.length === 0 && (
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
