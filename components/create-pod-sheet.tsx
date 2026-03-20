'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Users, Edit3 } from 'lucide-react';
import { useState, useEffect } from 'react';
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
    hasDeposit: boolean;
    depositAmount: number;
  }) => void;
  initialData?: any;
}

export function CreatePodSheet({ isOpen, onClose, onSubmit, initialData }: CreatePodSheetProps) {
  const [departure, setDeparture] = useState<LocationInfo | null>(null);
  const [departureDetail, setDepartureDetail] = useState('');
  const [destination, setDestination] = useState<LocationInfo | null>(null);

  const [isDepartureMapOpen, setIsDepartureMapOpen] = useState(false);
  const [isDestinationMapOpen, setIsDestinationMapOpen] = useState(false);

  // Custom states replacing generic native selectors
  const [departureTime, setDepartureTime] = useState<Date>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5);
    return d;
  });
  const [neededMembers, setNeededMembers] = useState(3); // 1명 더, 2명 더, 3명 더
  const [genderPreference, setGenderPreference] = useState<'male' | 'female' | 'any'>('any');
  const [hasDeposit, setHasDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number | ''>('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDeparture({
          address: initialData.departure,
          lat: initialData.startLat || 0,
          lng: initialData.startLng || 0
        });
        setDepartureDetail(initialData.departureDetail || '');
        setDestination({
          address: initialData.destination,
          lat: initialData.endLat || 0,
          lng: initialData.endLng || 0
        });
        setNeededMembers(initialData.maxMembers ? Math.max(1, initialData.maxMembers - 1) : 3);
        setGenderPreference(initialData.genderFilter || 'any');
        setHasDeposit(initialData.hasDeposit || false);
        setDepositAmount(initialData.depositAmount || '');

        // 매주 동일 시간 (또는 오늘 같은 시간)
        // 일단 현재 시간 기준으로 하되 시/분은 이전 팟의 시간으로 세팅
        if (initialData.departureTime) {
          try {
            // initialData.departureTime은 "MM월 DD일 HH:MM" 형태이거나 Date string
            // 가장 안전하게 오늘 날짜에 기존 시/분만 적용
            const parsedOld = new Date(initialData.departureTime);
            if (!isNaN(parsedOld.getTime())) {
              const d = new Date();
              d.setHours(parsedOld.getHours(), parsedOld.getMinutes(), 0, 0);
              // 만약 과거 시간이면 내일로 설정
              if (d.getTime() < Date.now()) {
                d.setDate(d.getDate() + 1);
              }
              setDepartureTime(d);
            }
          } catch(e) {}
        }
      } else {
        setDeparture(null);
        setDepartureDetail('');
        setDestination(null);
        const d = new Date();
        d.setMinutes(d.getMinutes() + 30);
        d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5);
        setDepartureTime(d);
        setNeededMembers(3);
        setGenderPreference('any');
        setHasDeposit(false);
        setDepositAmount('');
      }
    }
  }, [isOpen, initialData]);

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
      genderPreference,
      hasDeposit,
      depositAmount: hasDeposit ? Number(depositAmount) || 0 : 0
    });
    setDeparture(null);
    setDepartureDetail('');
    setDestination(null);
    setNeededMembers(3);
    setGenderPreference('any');
    setHasDeposit(false);
    setDepositAmount('');
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

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-600 block">
                      예약금 설정
                    </label>
                    <div 
                      onClick={() => {
                        haptics.light();
                        setHasDeposit(!hasDeposit);
                      }}
                      className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${hasDeposit ? 'bg-[#3182F6]' : 'bg-gray-300'}`}
                    >
                      <motion.div 
                        className="w-4 h-4 bg-white rounded-full"
                        animate={{ x: hasDeposit ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </div>
                  </div>
                  <AnimatePresence>
                    {hasDeposit && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <Input
                          type="number"
                          placeholder="예약금 금액 (예: 2000)"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value ? Number(e.target.value) : '')}
                          className="h-14 rounded-2xl bg-[#F2F4F6] border-0 px-5 text-base placeholder-gray-400 mt-2"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
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
