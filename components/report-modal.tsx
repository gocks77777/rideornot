'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { haptics } from '@/lib/haptics';
import { toast } from 'sonner';

const REPORT_REASONS = ['노쇼', '지각', '불쾌한 언행', '성희롱', '사기', '기타'] as const;

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
  partyId: string;
  reporterId?: string;
}

export function ReportModal({ isOpen, onClose, reportedUserId, reportedUserName, partyId, reporterId }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [detail, setDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    if (!reporterId) { toast.error('로그인이 필요합니다.'); return; }
    setIsSubmitting(true);

    const { error } = await supabase.from('reports').insert({
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      party_id: partyId,
      reason: selectedReason,
      detail: detail.trim() || null
    });

    if (error?.code === '23505') {
      toast.info('이미 신고한 멤버입니다.');
      setIsSubmitting(false);
      onClose();
      return;
    }

    if (error) {
      toast.error('신고 제출에 실패했습니다.');
      setIsSubmitting(false);
      return;
    }

    // 매너온도는 관리자 검토 후 처리됩니다 (즉시 차감 없음)
    haptics.medium();
    toast.success(`신고가 접수됐어요. 검토 후 처리됩니다.`);
    setIsSubmitting(false);
    setSelectedReason('');
    setDetail('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-[200] flex items-end justify-center"
          style={{ maxWidth: '480px', margin: '0 auto' }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="w-full bg-white rounded-t-3xl p-6 pb-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#191F28]">{reportedUserName}님 신고하기</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">신고 사유를 선택해주세요.</p>

            <div className="grid grid-cols-2 gap-2 mb-5">
              {REPORT_REASONS.map(reason => (
                <button
                  key={reason}
                  onClick={() => { setSelectedReason(reason); haptics.light(); }}
                  className={`py-3 px-4 rounded-2xl text-sm font-semibold border-2 transition-colors ${
                    selectedReason === reason
                      ? 'border-red-400 bg-red-50 text-red-600'
                      : 'border-gray-100 bg-gray-50 text-gray-700'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            {selectedReason === '기타' && (
              <textarea
                value={detail}
                onChange={e => setDetail(e.target.value)}
                placeholder="자세한 내용을 입력해주세요 (선택)"
                className="w-full bg-gray-50 rounded-2xl p-4 text-sm text-gray-700 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-red-200 mb-4"
              />
            )}

            <p className="text-xs text-gray-400 mb-4">
              허위 신고는 본인의 매너온도에 영향을 줄 수 있습니다.
            </p>

            <Button
              onClick={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              className="w-full bg-red-500 hover:bg-red-600 text-white rounded-2xl py-6 font-bold text-base"
            >
              {isSubmitting ? '처리 중...' : '신고 제출하기'}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
