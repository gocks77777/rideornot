'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, X, Share, PlusSquare, Info, CheckCircle2, ExternalLink, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { haptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';

interface PushGuideSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export function PushGuideSheet({ isOpen, onClose, user }: PushGuideSheetProps) {
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [isStandalone, setIsStandalone] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    // 1. 기기 종류 및 인앱 브라우저 판별
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType('ios');
    } else if (/android/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // 카카오톡, 라인, 인스타그램, 네이버 등 인앱 브라우저 감지
    const inAppRegex = /kakaotalk|instagram|naver|line|fbav/i;
    if (inAppRegex.test(ua)) {
      setIsInAppBrowser(true);
    }

    // 2. iOS에서 "홈 화면에 추가(PWA)"로 실행되었는지 판별
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isPWA);

    // 3. 현재 알림 권한 상태 및 구독 상태 확인
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          reg.pushManager.getSubscription().then(sub => {
            setIsPushEnabled(!!sub);
          });
        }
      });
    }
  }, [isOpen]);

  // URL Base64 to Uint8Array converter
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const handleEnablePush = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('이 브라우저는 푸시 알림을 지원하지 않습니다.');
      return;
    }

    setIsLoading(true);
    haptics.medium();

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission !== 'granted') {
        setIsLoading(false);
        return; // UI에서 권한 거부 안내(Guide) 렌더링으로 자연스럽게 넘어감
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.error('VAPID Public Key is missing');
        alert('서버에 VAPID 키가 설정되지 않았습니다.');
        setIsLoading(false);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      const subData = JSON.parse(JSON.stringify(subscription));

      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        endpoint: subData.endpoint,
        p256dh: subData.keys.p256dh,
        auth: subData.keys.auth
      });

      if (error && error.code !== '23505') { // 23505 is unique constraint violation (already exists)
        console.error('Failed to save subscription:', error);
        alert('알림 설정 저장 중 오류가 발생했습니다.');
        setIsLoading(false);
        return;
      }

      setIsPushEnabled(true);
      haptics.success();
      alert('알림 설정이 완료되었습니다! 🎉');
    } catch (e) {
      console.error('Push setup failed', e);
      alert('푸시 알림 설정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
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
            <div className="p-6 pb-safe safe-area-pb">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <BellRing className="w-5 h-5 text-[#3182F6]" />
                  </div>
                  <h2 className="text-xl font-bold text-[#191F28]">푸시 알림 설정</h2>
                </div>
                <button
                  onClick={() => { haptics.light(); onClose(); }}
                  className="w-8 h-8 rounded-full bg-[#F2F4F6] flex items-center justify-center active:bg-gray-200"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* 1. 이미 켜져있는 경우 */}
              {isPushEnabled && permissionStatus === 'granted' ? (
                <div className="bg-green-50 rounded-3xl p-6 text-center my-6">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-green-800 mb-1">알림이 켜져 있어요!</h3>
                  <p className="text-sm text-green-600">
                    팟에 멤버가 참여하거나 새로운 댓글이 달리면 카톡처럼 바로 알려드릴게요.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 mb-6">
                  <p className="text-gray-600 font-medium">
                    앱을 켜두지 않아도 중요한 알림을 놓치지 마세요!
                  </p>

                  {/* 2. 인앱 브라우저로 접속한 경우 (최우선 차단) */}
                  {isInAppBrowser && (
                    <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
                      <div className="flex items-start gap-3">
                        <ExternalLink className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-red-800 mb-2">외부 브라우저로 열어주세요</h4>
                          <p className="text-sm text-red-700 mb-3 leading-relaxed">
                            현재 카카오톡 등 내부 브라우저에서는 알림을 받을 수 없습니다. 화면 우측 하단의 <strong className="text-red-900">⋮ 버튼</strong>을 눌러 <strong className="text-red-900">다른 브라우저로 열기(Safari/Chrome)</strong>를 선택해주세요.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. 알림 권한을 실수로 '거부'한 경우 (수동 설정 안내) */}
                  {!isInAppBrowser && permissionStatus === 'denied' && (
                    <div className="bg-gray-100 rounded-2xl p-5">
                      <div className="flex items-start gap-3">
                        <Settings className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-[#191F28] mb-2">알림이 차단되어 있습니다</h4>
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                            기기 설정에서 알림 권한을 직접 켜주셔야 합니다.
                          </p>
                          
                          {deviceType === 'ios' ? (
                            <div className="bg-white rounded-xl p-4 text-sm text-gray-700 space-y-2 shadow-sm border border-gray-200">
                              <p>1. 아이폰 <strong>설정</strong> 앱 실행</p>
                              <p>2. 아래로 스크롤하여 <strong>탈래말래?</strong> 앱 선택</p>
                              <p>3. <strong>알림</strong> 선택</p>
                              <p>4. <strong>알림 허용</strong> 스위치 켜기</p>
                            </div>
                          ) : (
                            <div className="bg-white rounded-xl p-4 text-sm text-gray-700 space-y-2 shadow-sm border border-gray-200">
                              <p>1. 주소창 왼쪽의 <strong>자물쇠 🔒 아이콘</strong> 터치</p>
                              <p>2. <strong>권한</strong> 또는 <strong>사이트 설정</strong> 선택</p>
                              <p>3. <strong>알림</strong> 선택</p>
                              <p>4. <strong>허용</strong>으로 변경 후 새로고침</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. iOS 가이드 (웹앱 설치 안된 경우 & 거부 안함) */}
                  {!isInAppBrowser && permissionStatus !== 'denied' && deviceType === 'ios' && !isStandalone && (
                    <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-orange-800 mb-2">아이폰은 앱 설치가 필요해요</h4>
                          <p className="text-sm text-orange-700 mb-4 leading-relaxed">
                            아이폰 정책상, 사파리 하단의 <strong>공유 버튼</strong>을 누르고 <strong>홈 화면에 추가</strong>를 하셔야 알림을 받을 수 있습니다.
                          </p>
                          <div className="flex items-center gap-2 text-sm font-semibold text-orange-800 bg-white/60 p-2.5 rounded-xl justify-center">
                            <Share className="w-4 h-4" /> 공유 <ArrowRight className="w-3 h-3 mx-1" />
                            <PlusSquare className="w-4 h-4" /> 홈 화면에 추가
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. 일반적인 알림 허용 안내 (Android, Desktop, iOS PWA & 거부 안함) */}
                  {!isInAppBrowser && permissionStatus !== 'denied' && (deviceType !== 'ios' || isStandalone) && (
                    <div className="bg-[#F2F4F6] rounded-2xl p-5">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center flex-shrink-0">
                          <BellRing className="w-6 h-6 text-[#3182F6]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-[#191F28] mb-0.5">권한 허용하기</h4>
                          <p className="text-sm text-gray-500">브라우저 알림 권한을 허용해주세요.</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleEnablePush}
                        disabled={isLoading || !user}
                        className="w-full bg-[#3182F6] hover:bg-[#2968C8] text-white h-12 rounded-xl font-bold mt-2"
                      >
                        {isLoading ? '설정 중...' : user ? '지금 바로 알림 켜기' : '로그인 후 알림 켜기'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Dummy icon for iOS guide
function ArrowRight(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
