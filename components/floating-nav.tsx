'use client';

import { Search as Home, List, Plus, User } from 'lucide-react';
import { haptics } from '@/lib/haptics';
import { toast } from 'sonner';

interface FloatingNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCreatePod: () => void;
  user?: any;
}

export function FloatingNav({ activeTab, onTabChange, onCreatePod, user }: FloatingNavProps) {
  const navItems = [
    { id: 'home', icon: Home, label: '홈' },
    { id: 'list', icon: List, label: '팟 목록' },
    { id: 'profile', icon: User, label: '프로필' },
  ];

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto"
      style={{ maxWidth: 'calc(100vw - 48px)' }}
    >
      <div className="glassmorphism rounded-full shadow-lg px-4 py-3 flex items-center gap-2 relative min-w-fit">
        <button
          onClick={() => {
            haptics.medium();
            if (!user) {
              toast.error('로그인이 필요합니다.', { description: '프로필 탭에서 카카오 로그인을 해주세요.' });
              return;
            }
            onCreatePod();
          }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-[#3182F6] text-white shadow-xl flex items-center justify-center active:scale-95 active:shadow-md transition-all"
        >
          <Plus className="w-7 h-7" />
        </button>

        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              haptics.light();
              onTabChange(item.id);
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              activeTab === item.id ? 'bg-[#3182F6] text-white' : 'text-gray-600'
            }`}
          >
            <item.icon className="w-5 h-5" />
          </button>
        ))}
      </div>
    </div>
  );
}

