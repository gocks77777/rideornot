'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Supabase가 URL의 code(PKCE) 또는 #access_token(implicit)을 자동으로 처리
    // SIGNED_IN 이벤트가 오면 홈으로 이동
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.replace('/');
      }
    });

    // 5초 내 SIGNED_IN이 안 오면 홈으로 강제 이동 (실패 케이스)
    const timeout = setTimeout(() => router.replace('/'), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#3182F6] rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">로그인 중...</p>
      </div>
    </div>
  );
}
