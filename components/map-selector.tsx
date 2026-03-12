'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface LocationInfo {
  address: string;
  name?: string;
  lat: number;
  lng: number;
}

interface MapSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: LocationInfo) => void;
  title: string;
  mode?: 'departure' | 'destination';
}

// Shorten Korean address: "충청북도 청주시 흥덕구 오송읍 123" → "오송읍 123"
export function shortenAddress(address: string): string {
  if (!address) return '';
  const parts = address.split(' ');
  // Korean addresses: 시도 > 시군구 > 구 > 읍면동 > 번지
  // Keep the last 2-3 meaningful parts
  if (parts.length <= 2) return address;
  // Find the first part that ends with 읍/면/동/로/길/가 (the neighborhood/street level)
  const meaningfulIdx = parts.findIndex(p =>
    /[읍면동로길가리]$/.test(p) || /\d/.test(p)
  );
  if (meaningfulIdx >= 0) {
    return parts.slice(meaningfulIdx).join(' ');
  }
  // Fallback: take last 2 parts
  return parts.slice(-2).join(' ');
}

interface SearchResult {
  title: string;
  address: string;
  lat: number;
  lng: number;
}

export function MapSelector({ isOpen, onClose, onSelect, title, mode = 'departure' }: MapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  // Safe reverse geocode with full fallback
  const reverseGeocode = useCallback((latlng: any) => {
    try {
      const naver = (window as any).naver;
      if (!naver?.maps?.Service?.reverseGeocode) {
        setCurrentLocation({
          address: `위도 ${latlng.lat().toFixed(4)}, 경도 ${latlng.lng().toFixed(4)}`,
          lat: latlng.lat(),
          lng: latlng.lng()
        });
        return;
      }

      naver.maps.Service.reverseGeocode(
        { coords: latlng },
        (status: any, response: any) => {
          try {
            if (status === naver.maps.Service.Status.OK && response?.v2?.address) {
              const items = response.v2.address;
              let fullAddress = items.jibunAddress || items.roadAddress || '';
              // Shorten: remove leading 시도/시군구, keep the last meaningful segments
              const shortened = shortenAddress(fullAddress) || `위도 ${latlng.lat().toFixed(4)}, 경도 ${latlng.lng().toFixed(4)}`;
              setCurrentLocation({ address: shortened, lat: latlng.lat(), lng: latlng.lng() });
            } else {
              setCurrentLocation({
                address: `위도 ${latlng.lat().toFixed(4)}, 경도 ${latlng.lng().toFixed(4)}`,
                lat: latlng.lat(),
                lng: latlng.lng()
              });
            }
          } catch {
            setCurrentLocation({
              address: `위도 ${latlng.lat().toFixed(4)}, 경도 ${latlng.lng().toFixed(4)}`,
              lat: latlng.lat(),
              lng: latlng.lng()
            });
          }
        }
      );
    } catch {
      setCurrentLocation({
        address: `위도 ${latlng.lat().toFixed(4)}, 경도 ${latlng.lng().toFixed(4)}`,
        lat: latlng.lat(),
        lng: latlng.lng()
      });
    }
  }, []);

  // Search for places using server-side API route
  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/geocode?query=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(true);
      }
    } catch {
      setSearchResults([]);
      setShowSearchResults(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(value);
    }, 400);
  }, [searchPlaces]);

  const handleSelectSearchResult = useCallback((result: SearchResult) => {
    try {
      const naver = (window as any).naver;
      if (naver?.maps && mapInstanceRef.current && markerRef.current) {
        const loc = new naver.maps.LatLng(result.lat, result.lng);
        mapInstanceRef.current.setCenter(loc);
        markerRef.current.setPosition(loc);
      }
    } catch { /* ignore */ }

    setCurrentLocation({
      address: result.title,
      lat: result.lat,
      lng: result.lng
    });
    setShowSearchResults(false);
    setSearchQuery('');
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Reset
    setCurrentLocation(null);
    setMapError(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);

    const initMap = () => {
      try {
        const naver = (window as any).naver;
        if (!naver?.maps) {
          setMapError('네이버 지도를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
          return;
        }

        if (!mapRef.current) return;

        const defaultCenter = new naver.maps.LatLng(37.5666805, 126.9784147);

        const map = new naver.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 15,
          mapDataControl: false,
          scaleControl: false,
          mapTypeControl: false,
          logoControlOptions: {
            position: naver.maps.Position.BOTTOM_LEFT
          }
        });
        mapInstanceRef.current = map;

        const marker = new naver.maps.Marker({
          position: defaultCenter,
          map: map,
          icon: {
            content: `
              <div style="transform: translate(-50%, -100%); width: 44px; height: 44px; display: flex; flex-direction: column; align-items: center; pointer-events: none;">
                <div style="width: 32px; height: 32px; background-color: #3182F6; border-radius: 50%; box-shadow: 0 4px 12px rgba(49, 130, 246, 0.4); border: 3px solid white; display: flex; justify-content: center; align-items: center; z-index: 2;">
                  <div style="width: 10px; height: 10px; background-color: white; border-radius: 50%;"></div>
                </div>
                <div style="width: 3px; height: 14px; background-color: #3182F6; margin-top: -3px; z-index: 1;"></div>
                <div style="width: 14px; height: 5px; background-color: rgba(0,0,0,0.2); border-radius: 50%; margin-top: -2px;"></div>
              </div>
            `,
            anchor: new naver.maps.Point(22, 44)
          }
        });
        markerRef.current = marker;

        // Set default location immediately
        setCurrentLocation({
          address: '서울특별시 중구 세종대로 110',
          lat: 37.5666805,
          lng: 126.9784147
        });

        // For departure mode, try to get user's actual location
        if (mode === 'departure' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              try {
                const loc = new naver.maps.LatLng(position.coords.latitude, position.coords.longitude);
                map.setCenter(loc);
                marker.setPosition(loc);
                reverseGeocode(loc);
              } catch {
                setCurrentLocation({
                  address: `위도 ${position.coords.latitude.toFixed(4)}, 경도 ${position.coords.longitude.toFixed(4)}`,
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                });
              }
            },
            () => reverseGeocode(defaultCenter),
            { timeout: 5000 }
          );
        } else {
          reverseGeocode(defaultCenter);
        }

        // For destination mode, auto-focus search
        if (mode === 'destination') {
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 500);
        }

        // Drag events
        naver.maps.Event.addListener(map, 'drag', () => {
          try {
            const center = map.getCenter();
            marker.setPosition(center);
            setCurrentLocation(null);
          } catch { /* ignore */ }
        });

        naver.maps.Event.addListener(map, 'dragend', () => {
          try {
            const center = map.getCenter();
            reverseGeocode(center);
          } catch { /* ignore */ }
        });

      } catch (e) {
        console.error('Map init error:', e);
        setCurrentLocation({
          address: '서울특별시 중구 세종대로 110 (지도 로드 실패)',
          lat: 37.5666805,
          lng: 126.9784147
        });
      }
    };

    const timer = setTimeout(() => {
      const naver = (window as any).naver;
      if (naver?.maps) {
        initMap();
      } else {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          const n = (window as any).naver;
          if (n?.maps) {
            clearInterval(interval);
            initMap();
          } else if (attempts > 30) {
            clearInterval(interval);
            setMapError('네이버 지도를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
          }
        }, 300);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, reverseGeocode, mode]);

  const handleCurrentLocationClick = () => {
    if (!mapInstanceRef.current || !markerRef.current) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          try {
            const naver = (window as any).naver;
            if (!naver?.maps) return;
            const loc = new naver.maps.LatLng(position.coords.latitude, position.coords.longitude);
            mapInstanceRef.current.setCenter(loc);
            markerRef.current.setPosition(loc);
            reverseGeocode(loc);
          } catch {
            setCurrentLocation({
              address: `위도 ${position.coords.latitude.toFixed(4)}, 경도 ${position.coords.longitude.toFixed(4)}`,
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          }
        },
        undefined,
        { timeout: 5000 }
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[100] bg-white flex flex-col pt-safe"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10 w-full max-w-[480px] mx-auto">
            <h2 className="text-xl font-bold text-[#191F28]">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-3 bg-white z-10 w-full max-w-[480px] mx-auto border-b border-gray-50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder={mode === 'destination' ? '도착지를 검색하세요 (예: 오송역, 청주대)' : '장소를 검색하세요 (예: 오송역)'}
                className="w-full h-12 rounded-2xl bg-[#F2F4F6] pl-12 pr-4 text-base text-[#191F28] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#3182F6] transition-all"
              />
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="flex items-center justify-center gap-2 p-4">
                    <div className="w-4 h-4 border-2 border-[#3182F6] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-500">검색 중...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSearchResult(result)}
                      className="w-full text-left px-4 py-3 hover:bg-[#F2F4F6] transition-colors flex items-start gap-3 border-b border-gray-50 last:border-0"
                    >
                      <MapPin className="w-5 h-5 text-[#3182F6] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#191F28] truncate">{result.title}</p>
                        {result.address && result.address !== result.title && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{result.address}</p>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    검색 결과가 없습니다
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className="flex-1 relative w-full max-w-[480px] mx-auto">
            {mapError ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-center px-8">
                <div>
                  <p className="text-gray-500 text-lg font-medium mb-4">{mapError}</p>
                  <Button onClick={onClose} className="bg-[#3182F6] text-white rounded-2xl">돌아가기</Button>
                </div>
              </div>
            ) : (
              <>
                <div ref={mapRef} className="w-full h-full bg-gray-100" />
                <button
                  onClick={handleCurrentLocationClick}
                  className="absolute bottom-6 right-4 w-12 h-12 bg-white rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.15)] flex items-center justify-center text-gray-700 hover:bg-gray-50 z-10"
                >
                  <Navigation className="w-5 h-5 -ml-1 -mb-1" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Info Sheet */}
          <div className="bg-white rounded-t-3xl shadow-[0_-8px_24px_rgba(0,0,0,0.08)] p-6 z-10 -mt-6 relative w-full max-w-[480px] mx-auto pb-[env(safe-area-inset-bottom,24px)]">
            <div className="mb-6 min-h-[60px]">
              {currentLocation ? (
                <>
                  <h3 className="font-bold text-lg text-[#191F28] mb-1">
                    이 위치로 설정하시겠습니까?
                  </h3>
                  <p className="text-gray-500 text-sm font-medium">{currentLocation.address}</p>
                </>
              ) : (
                <div className="flex items-center justify-center gap-3 h-full">
                  <div className="w-5 h-5 border-2 border-[#3182F6] border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-medium text-gray-600">위치 정보를 불러오는 중...</p>
                </div>
              )}
            </div>

            <Button
              onClick={() => currentLocation && onSelect(currentLocation)}
              disabled={!currentLocation}
              className="w-full h-14 bg-[#3182F6] hover:bg-[#2968C8] text-white rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-blue-500/20"
            >
              선택 완료
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
