'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Users, Edit3 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { haptics } from '@/lib/haptics';
import { IosTimePicker } from '@/components/ui/ios-time-picker';
import { MapSelector, LocationInfo } from '@/components/map-selector';

interface CreatePodSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    departure: string;
    departureDetail?: string;
    departureLat: number;
    departureLng: number;
    destination: string;
    destinationLat: number;
    destinationLng: number;
    departureTime: string;
    maxMembers: number;
    genderPreference: 'male' | 'female' | 'any';
  }) => void;
}

export function CreatePodSheet({ isOpen, onClose, onSubmit }: CreatePodSheetProps) {
  const [departure, setDeparture] = useState<LocationInfo | null>(null);
  const [departureDetail, setDepartureDetail] = useState('');
  const [destination, setDestination] = useState<LocationInfo | null>(null);

  const [isDepartureMapOpen, setIsDepartureMapOpen] = useState(false);
  const [isDestinationMapOpen, setIsDestinationMapOpen] = useState(false);

  // Custom states replacing generic native selectors
  const [departureTime, setDepartureTime] = useState<Date>(() => {
    // Default to +30 minutes from now rounded to 5 min
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5);
    return d;
  });
  const [neededMembers, setNeededMembers] = useState(3); // 1명 더, 2명 더, 3명 더
  const [genderPreference, setGenderPreference] = useState<'male' | 'female' | 'any'>('any');

  const handleSubmit = () => {
    if (!departure || !destination) return;
    haptics.success();
    onSubmit({
      departure: departure.address,
      departureDetail: departureDetail.trim() || undefined,
      departureLat: departure.lat,
      departureLng: departure.lng,
      destination: destination.address,
      destinationLat: destination.lat,
      destinationLng: destination.lng,
      departureTime: departureTime.toISOString(),
      maxMembers: neededMembers + 1, // Add host (1) to needed members
      genderPreference
    });
    setDeparture(null);
    setDepartureDetail('');
    setDestination(null);
    setNeededMembers(3);
    setGenderPreference('any');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 pb-8 safe-area-pb">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#191F28]">새 팟 만들기</h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    haptics.light();
                    onClose();
                  }}
                  className="w-10 h-10 rounded-full bg-[#F2F4F6] flex items-center justify-center active:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </motion.button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    출발지
                  </label>
                  <div
                    onClick={() => setIsDepartureMapOpen(true)}
                    className="flex items-center w-full h-14 rounded-2xl bg-[#F2F4F6] px-5 cursor-pointer"
                  >
                    <span className={departure ? 'text-base text-[#191F28]' : 'text-base text-gray-400'}>
                      {departure?.address || '어디서 출발하시나요?'}
                    </span>
                  </div>
                  {departure && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">상세 위치 (선택)</span>
                      </div>
                      <Input
                        value={departureDetail}
                        onChange={(e) => setDepartureDetail(e.target.value)}
                        placeholder="예: 3번 출구, 정문 앞, GS25 옆"
                        className="h-11 rounded-xl bg-[#F2F4F6] border-0 px-4 text-sm placeholder-gray-400"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    도착지
                  </label>
                  <div
                    onClick={() => setIsDestinationMapOpen(true)}
                    className="flex items-center w-full h-14 rounded-2xl bg-[#F2F4F6] px-5 cursor-pointer"
                  >
                    <span className={destination ? 'text-base text-[#191F28]' : 'text-base text-gray-400'}>
                      {destination?.address || '어디로 가시나요?'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-2">
                    <Clock className="w-4 h-4" />
                    언제 출발할까요?
                  </label>
                  <IosTimePicker value={departureTime} onChange={setDepartureTime} />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-2">
                    <Users className="w-4 h-4" />
                    몇 명이 더 필요한가요?
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((num) => (
                      <motion.button
                        key={num}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          haptics.light();
                          setNeededMembers(num);
                        }}
                        className={`flex-1 h-14 rounded-2xl font-semibold transition-all ${neededMembers === num
                          ? 'bg-[#3182F6] text-white shadow-lg'
                          : 'bg-[#F2F4F6] text-gray-600 active:bg-gray-200'
                          }`}
                      >
                        {num}명 더
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">
                    성별 제한
                  </label>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        haptics.light();
                        setGenderPreference('male');
                      }}
                      className={`flex-1 h-14 rounded-2xl font-semibold transition-all ${genderPreference === 'male'
                        ? 'bg-[#3182F6] text-white shadow-lg'
                        : 'bg-[#F2F4F6] text-gray-600 active:bg-gray-200'
                        }`}
                    >
                      남자만
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        haptics.light();
                        setGenderPreference('female');
                      }}
                      className={`flex-1 h-14 rounded-2xl font-semibold transition-all ${genderPreference === 'female'
                        ? 'bg-[#3182F6] text-white shadow-lg'
                        : 'bg-[#F2F4F6] text-gray-600 active:bg-gray-200'
                        }`}
                    >
                      여자만
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        haptics.light();
                        setGenderPreference('any');
                      }}
                      className={`flex-1 h-14 rounded-2xl font-semibold transition-all ${genderPreference === 'any'
                        ? 'bg-[#3182F6] text-white shadow-lg'
                        : 'bg-[#F2F4F6] text-gray-600 active:bg-gray-200'
                        }`}
                    >
                      상관없음
                    </motion.button>
                  </div>
                </div>
              </div>

              <motion.div whileTap={{ scale: 0.98 }} className="mt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={!departure || !destination}
                  className="w-full h-14 rounded-2xl bg-[#3182F6] text-white font-bold text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  팟 만들기
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <MapSelector
            isOpen={isDepartureMapOpen}
            onClose={() => setIsDepartureMapOpen(false)}
            onSelect={(location) => {
              setDeparture(location);
              setIsDepartureMapOpen(false);
            }}
            title="출발지 설정"
            mode="departure"
          />
          <MapSelector
            isOpen={isDestinationMapOpen}
            onClose={() => setIsDestinationMapOpen(false)}
            onSelect={(location) => {
              setDestination(location);
              setIsDestinationMapOpen(false);
            }}
            title="도착지 설정"
            mode="destination"
          />
        </>
      )}
    </AnimatePresence>
  );
}
