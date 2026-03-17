"use client";

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { MagicFrameLayout } from '@/components/magic-frame/MagicFrameLayout';

export default function MagicFrameOrderFailPage() {
    const router = useRouter();

    return (
        <MagicFrameLayout>
            <div className="max-w-md mx-auto px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6"
                >
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-red-500 text-2xl">✕</span>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">결제가 취소되었습니다</h2>
                        <p className="text-sm text-slate-500">결제 도중 문제가 발생했거나 취소되었습니다.</p>
                    </div>

                    <button onClick={() => router.push('/magic-frame/complete')}
                        className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
                        돌아가기
                    </button>

                    <button onClick={() => router.push('/magic-frame/complete')}
                        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mx-auto transition-colors">
                        <ArrowLeft size={14} /> 완료 페이지로 돌아가기
                    </button>
                </motion.div>
            </div>
        </MagicFrameLayout>
    );
}
