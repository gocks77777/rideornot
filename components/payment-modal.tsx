'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { haptics } from '@/lib/haptics';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: () => void;
  amount: number;
  hostName: string;
  accountNumber?: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  onConfirmPayment,
  amount,
  hostName,
  accountNumber = '1002-1234-5678'
}: PaymentModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const numbersOnly = accountNumber.replace(/[^0-9]/g, '');
    navigator.clipboard.writeText(numbersOnly);
    setCopied(true);
    haptics.light();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    haptics.success();
    onConfirmPayment();
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
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ maxWidth: '480px', margin: '0 auto' }}
          >
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#191F28]">송금하기</h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    haptics.light();
                    onClose();
                  }}
                  className="w-8 h-8 rounded-full bg-[#F2F4F6] flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </motion.button>
              </div>

              <div className="text-center mb-6">
                <p className="text-gray-600 mb-2">방장에게</p>
                <div className="text-3xl font-bold text-[#3182F6] mb-1">
                  {amount.toLocaleString()}원
                </div>
                <p className="text-gray-600">을 송금해주세요</p>
              </div>

              <div className="bg-[#F2F4F6] rounded-3xl p-6 mb-6">
                <div className="w-full aspect-square bg-white rounded-2xl flex items-center justify-center mb-4">
                  <div className="text-center">
                    <QrCode className="w-24 h-24 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">QR Code</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">받는 사람</p>
                    <p className="font-bold text-[#191F28]">{hostName}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4">
                    <p className="text-xs text-gray-500 mb-1">계좌번호</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-[#191F28]">{accountNumber}</p>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopy}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F2F4F6] text-sm font-medium text-gray-700"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">복사됨</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>복사</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleConfirm}
                className="w-full h-14 rounded-2xl bg-[#3182F6] text-white font-bold text-base shadow-lg hover:bg-[#2968C8]"
              >
                송금 완료
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
