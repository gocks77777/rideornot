'use client';

import { motion } from 'framer-motion';
import { Chrome as Home, List, Plus, User } from 'lucide-react';
import { haptics } from '@/lib/haptics';

interface FloatingNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCreatePod: () => void;
}

export function FloatingNav({ activeTab, onTabChange, onCreatePod }: FloatingNavProps) {
  const navItems = [
    { id: 'home', icon: Home, label: '홈' },
    { id: 'list', icon: List, label: '팟 목록' },
    { id: 'profile', icon: User, label: '프로필' },
  ];

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto"
      style={{ maxWidth: 'calc(100vw - 48px)' }}
    >
      <div className="glassmorphism rounded-full shadow-lg px-4 py-3 flex items-center gap-2 relative min-w-fit">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            haptics.medium();
            onCreatePod();
          }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-[#3182F6] text-white shadow-xl flex items-center justify-center active:shadow-md transition-shadow"
        >
          <Plus className="w-7 h-7" />
        </motion.button>

        {navItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => {
              haptics.light();
              onTabChange(item.id);
            }}
            whileTap={{ scale: 0.9 }}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              activeTab === item.id ? 'bg-[#3182F6] text-white' : 'text-gray-600'
            }`}
          >
            <item.icon className="w-5 h-5" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
