'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, X, CheckCircle } from 'lucide-react';
import { sendPraise } from '@/lib/supabase';
import { toast } from 'sonner';
import { haptics } from '@/lib/haptics';

export interface PendingPraiseParty {
  id: string;
  departure: string;
  destination: string;
  members: { id: string; name: string; avatar: string; praised: boolean }[];
}

interface PraisePromptSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  parties: PendingPraiseParty[];
  onPraised: (partyId: string, memberId: string) => void;
}

export function PraisePromptSheet({ isOpen, onClose, userId, parties, onPraised }: PraisePromptSheetProps) {
  const [praising, setPraising] = useState<string | null>(null);

  const allDone = parties.every(p => p.members.every(m => m.praised));

  const handlePraise = async (partyId: string, targetId: string, targetName: string) => {
    const key = `${partyId}-${targetId}`;
    setPraising(key);

    const result = await sendPraise(targetId, partyId);

    if (result.error) {
      toast.error('칭찬 전송 실패');
      setPraising(null);
      return;
    }

    if (!result.alreadyPraised) {
      toast.success(`${targetName}님을 칭찬했어요! 👍`);
      haptics.success();
    }

    onPraised(partyId, targetId);
    setPraising(null);
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
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 overflow-y-auto"
            style={{ maxWidth: '480px', margin: '0 auto', maxHeight: '70vh' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#191F28]">함께한 멤버 칭찬하기</h2>
                <p className="text-sm text-gray-500 mt-0.5">좋았던 멤버에게 칭찬을 남겨주세요</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#F2F4F6] flex items-center justify-center">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {allDone ? (
              <div className="text-center py-10">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <p className="font-bold text-lg text-[#191F28]">칭찬 완료!</p>
                <p className="text-sm text-gray-500 mt-1">모든 멤버에게 칭찬을 전달했어요</p>
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {parties.map(party => (
                  <div key={party.id}>
                    <p className="text-xs font-semibold text-gray-400 mb-3">
                      {party.departure} → {party.destination}
                    </p>
                    <div className="space-y-2">
                      {party.members.map(member => {
                        const key = `${party.id}-${member.id}`;
                        const isLoading = praising === key;
                        return (
                          <div key={member.id} className="flex items-center justify-between bg-[#F8F9FA] rounded-2xl p-3">
                            <div className="flex items-center gap-3">
                              {member.avatar ? (
                                <img src={member.avatar} className="w-10 h-10 rounded-full object-cover" alt={member.name} />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-[#3182F6] flex items-center justify-center text-white font-bold text-sm">
                                  {member.name.charAt(0)}
                                </div>
                              )}
                              <span className="font-semibold text-sm text-[#191F28]">{member.name}</span>
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => !member.praised && !isLoading && handlePraise(party.id, member.id, member.name)}
                              disabled={member.praised || isLoading}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                member.praised
                                  ? 'bg-yellow-100 text-yellow-600'
                                  : 'bg-[#3182F6] text-white hover:bg-[#2968C8]'
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              {member.praised ? '칭찬함' : isLoading ? '...' : '칭찬'}
                            </motion.button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
