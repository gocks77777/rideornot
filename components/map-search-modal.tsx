'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import { Search, X, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { haptics } from '@/lib/haptics';

interface MapSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (placeName: string, lat: number, lng: number) => void;
    title: string;
}

export function MapSearchModal({ isOpen, onClose, onSelect, title }: MapSearchModalProps) {
    const [keyword, setKeyword] = useState('');
    const [places, setPlaces] = useState<any[]>([]);
    const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
    const [mapCenter, setMapCenter] = useState({ lat: 37.566826, lng: 126.9786567 }); // Default: Seoul City Hall
    const [isKakaoLoaded, setIsKakaoLoaded] = useState(false);

    useEffect(() => {
        // Wait for the Kakao Maps SDK script to load
        const checkKakaoMap = setInterval(() => {
            if (window.kakao && window.kakao.maps) {
                window.kakao.maps.load(() => {
                    setIsKakaoLoaded(true);
                });
                clearInterval(checkKakaoMap);
            }
        }, 100);
        return () => clearInterval(checkKakaoMap);
    }, []);

    const searchPlaces = () => {
        if (!isKakaoLoaded || !keyword.trim()) return;

        const ps = new window.kakao.maps.services.Places();
        ps.keywordSearch(keyword, (data: any, status: any, _pagination: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
                setPlaces(data);
                if (data.length > 0) {
                    setMapCenter({ lat: Number(data[0].y), lng: Number(data[0].x) });
                }
            } else {
                setPlaces([]);
            }
        });
    };

    const handleSelect = () => {
        if (selectedPlace) {
            haptics.success();
            onSelect(selectedPlace.place_name, Number(selectedPlace.y), Number(selectedPlace.x));
            onClose();
            // Reset
            setKeyword('');
            setPlaces([]);
            setSelectedPlace(null);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-50 bg-white flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-xl font-bold">{title}</h2>
                        <button onClick={() => { haptics.light(); onClose(); }} className="p-2 bg-gray-100 rounded-full">
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="p-4 bg-white relative z-10 shadow-sm flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="장소나 주소를 검색하세요"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchPlaces()}
                                className="w-full h-12 pl-12 pr-4 bg-[#F2F4F6] rounded-xl text-[17px] focus:outline-none focus:ring-2 focus:ring-[#3182F6]"
                            />
                        </div>
                        <Button onClick={searchPlaces} className="h-12 px-6 bg-[#3182F6] hover:bg-blue-600 text-white rounded-xl font-semibold">
                            검색
                        </Button>
                    </div>

                    {/* Map Area */}
                    <div className="flex-1 relative">
                        {isKakaoLoaded ? (
                            <Map
                                center={mapCenter}
                                style={{ width: '100%', height: '100%' }}
                                level={4}
                            >
                                {places.map((place: any, i: number) => (
                                    <MapMarker
                                        key={`${place.id}-${i}`}
                                        position={{ lat: Number(place.y), lng: Number(place.x) }}
                                        onClick={() => {
                                            setSelectedPlace(place);
                                            setMapCenter({ lat: Number(place.y), lng: Number(place.x) });
                                        }}
                                        image={{
                                            src: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
                                            size: selectedPlace?.id === place.id ? { width: 48, height: 48 } : { width: 36, height: 36 },
                                            options: {
                                                offset: { x: 24, y: 48 }
                                            }
                                        }}
                                    />
                                ))}
                            </Map>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                지도 로딩 중...
                            </div>
                        )}

                        {/* Selected Place Overlay */}
                        {selectedPlace && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute bottom-6 left-4 right-4 bg-white p-5 rounded-3xl shadow-2xl flex flex-col gap-4 border border-gray-100"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-[#3182F6]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{selectedPlace.place_name}</h3>
                                        <p className="text-gray-500 text-sm mt-1">{selectedPlace.address_name}</p>
                                        {selectedPlace.road_address_name && (
                                            <p className="text-gray-400 text-xs mt-0.5">{selectedPlace.road_address_name}</p>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    onClick={handleSelect}
                                    className="w-full h-14 bg-[#3182F6] hover:bg-blue-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-500/30"
                                >
                                    여기로 선택하기
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
