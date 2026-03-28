'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white" style={{ maxWidth: '480px', margin: '0 auto' }}>
      <header className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex items-center gap-3" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#F2F4F6] flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-[#191F28]">배너 광고 안내</h1>
      </header>

      <div className="px-6 py-8 space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#6366f1] to-[#3182F6] rounded-3xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📢</span>
          </div>
          <h2 className="text-2xl font-bold text-[#191F28] mb-2">탈래말래? 배너 광고</h2>
          <p className="text-gray-500">반경 5km 이내 사용자들에게 가게를 홍보하세요!</p>
        </div>

        <div className="bg-[#F2F4F6] rounded-3xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#3182F6] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">1</div>
            <div>
              <h3 className="font-bold text-[#191F28] mb-1">무료 이벤트 진행 중</h3>
              <p className="text-sm text-gray-600">현재 선착순 3명에게 무료로 배너 광고를 제공하고 있습니다.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#3182F6] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">2</div>
            <div>
              <h3 className="font-bold text-[#191F28] mb-1">노출 위치</h3>
              <p className="text-sm text-gray-600">앱 메인 화면 + 팟 목록 상단에 배너가 노출됩니다. 모든 사용자에게 5초 간격으로 자동 전환됩니다.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#3182F6] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">3</div>
            <div>
              <h3 className="font-bold text-[#191F28] mb-1">배너 사이즈</h3>
              <p className="text-sm text-gray-600">864 x 160px (레티나 기준) 또는 432 x 80px. JPG/PNG 형식으로 보내주세요.</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-3xl p-6 text-center">
          <p className="text-sm text-gray-600 mb-1">자세한 상의는 메일을 이용해주세요</p>
          <p className="text-xs text-gray-400 mb-1">광고 기간, 디자인 등 맞춤 상담 가능합니다</p>
          <p className="text-xs text-green-600 font-semibold mb-3">어떠한 금액도 청구되지 않으니 안심하세요!</p>
          <a
            href="mailto:gocks77777@naver.com?subject=탈래말래 배너 광고 문의"
            className="inline-flex items-center gap-2 bg-[#3182F6] text-white font-bold px-6 py-3 rounded-2xl text-base active:scale-95 transition-transform"
          >
            gocks77777@naver.com
          </a>
        </div>
      </div>
    </div>
  );
}
