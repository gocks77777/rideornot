'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

type AppName = '카카오톡' | '인스타그램' | '페이스북' | '라인' | '네이버' | '트위터' | string;

function detectInApp(): { isInApp: boolean; appName: AppName } {
  if (typeof window === 'undefined') return { isInApp: false, appName: '' };
  const ua = navigator.userAgent;
  if (/KAKAOTALK/i.test(ua))          return { isInApp: true, appName: '카카오톡' };
  if (/Instagram/i.test(ua))          return { isInApp: true, appName: '인스타그램' };
  if (/FBAN|FBAV|FB_IAB/i.test(ua))   return { isInApp: true, appName: '페이스북' };
  if (/Line\//i.test(ua))             return { isInApp: true, appName: '라인' };
  if (/NAVER(?!Maps)/i.test(ua))      return { isInApp: true, appName: '네이버' };
  if (/Twitter/i.test(ua))            return { isInApp: true, appName: '트위터' };
  return { isInApp: false, appName: '' };
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

const APP_EMOJI: Record<string, string> = {
  '카카오톡': '💬',
  '인스타그램': '📸',
  '페이스북': '👍',
  '라인': '💚',
  '네이버': '🟢',
  '트위터': '🐦',
};

export function InAppBrowserGuide() {
  const [show, setShow] = useState(false);
  const [appName, setAppName] = useState<AppName>('');
  const [ios, setIos] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const { isInApp, appName: name } = detectInApp();
    if (isInApp) {
      setAppName(name);
      setIos(isIOS());
      setShow(true);
    }
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select text
      const el = document.createElement('input');
      el.value = window.location.href;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenExternal = () => {
    if (!ios) {
      // Android: intent로 Chrome 또는 Samsung 브라우저 시도
      const url = window.location.href;
      const intentUrl = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end;`;
      window.location.href = intentUrl;
    }
  };

  const emoji = APP_EMOJI[appName] || '📱';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[999] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="w-full bg-white rounded-t-3xl px-7 pt-7 pb-12"
            style={{ maxWidth: '480px' }}
          >
            {/* 핸들 */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

            <div className="text-center mb-7">
              <div className="text-5xl mb-4">{emoji}</div>
              <h2 className="text-xl font-bold text-[#191F28] mb-2">
                {appName} 브라우저에서는<br />일부 기능이 제한돼요
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                푸시 알림, 위치 기능이 정상 작동하려면<br />
                <strong>{ios ? 'Safari' : '기본 브라우저(Chrome · 삼성 인터넷)'}</strong>로 열어주세요.
              </p>
            </div>

            {/* 단계별 안내 */}
            <div className="bg-[#F2F4F6] rounded-2xl p-5 mb-5 space-y-3">
              {ios ? (
                // iOS 안내
                <>
                  <Step n={1} text={`아래 링크 복사 버튼을 눌러요`} />
                  <Step n={2} text="Safari 앱을 열어요" />
                  <Step n={3} text="주소창을 길게 눌러 붙여넣기 후 이동해요" />
                </>
              ) : (
                // Android 안내
                <>
                  <Step n={1} text="아래 '외부 브라우저로 열기'를 눌러요" />
                  <Step n={2} text="안 되면 링크 복사 후 Chrome·삼성 인터넷에 붙여넣기해요" />
                </>
              )}
            </div>

            {/* 버튼들 */}
            <div className="space-y-3">
              {/* Android는 직접 열기 시도 */}
              {!ios && (
                <button
                  onClick={handleOpenExternal}
                  className="w-full bg-[#3182F6] text-white rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2 active:opacity-80"
                >
                  <span>🌐</span>
                  외부 브라우저로 열기
                </button>
              )}

              {/* 링크 복사 */}
              <button
                onClick={handleCopy}
                className={`w-full rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2 transition-colors active:opacity-80 ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-[#F2F4F6] text-[#191F28]'
                }`}
              >
                {copied ? (
                  <><Check className="w-5 h-5" /> 복사됐어요! Safari에 붙여넣기 하세요</>
                ) : (
                  <><Copy className="w-5 h-5" /> 링크 복사하기</>
                )}
              </button>

              <button
                onClick={() => setShow(false)}
                className="w-full text-sm text-gray-400 py-2"
              >
                그냥 계속 이용하기
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-[#3182F6] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {n}
      </span>
      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}
