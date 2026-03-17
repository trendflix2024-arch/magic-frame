"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { MagicFrameLayout } from '@/components/magic-frame/MagicFrameLayout';

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'confirming' | 'success' | 'error'>('confirming');
    const [errorMsg, setErrorMsg] = useState('');
    const [productName, setProductName] = useState('');

    useEffect(() => {
        const paymentKey = searchParams.get('paymentKey');
        const orderId = searchParams.get('orderId');
        const amount = searchParams.get('amount');
        const productId = searchParams.get('productId');

        // sessionStorage → localStorage 폴백
        let userId = '';
        try {
            const raw = sessionStorage.getItem('magic_frame_session');
            userId = JSON.parse(raw || '{}').userId || '';
        } catch {}
        if (!userId) {
            userId = localStorage.getItem('mf_pending_order') || '';
        }

        if (!paymentKey || !orderId || !amount || !productId || !userId) {
            setStatus('error');
            setErrorMsg('결제 정보가 올바르지 않습니다.');
            return;
        }

        fetch('/api/magic-frame/order/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentKey,
                orderId,
                amount: Number(amount),
                productId,
                userId,
            }),
        })
            .then(r => r.json())
            .then(data => {
                // 폴백 정리
                localStorage.removeItem('mf_pending_order');

                if (data.success) {
                    setProductName(data.productName || '');
                    setStatus('success');
                } else {
                    setStatus('error');
                    setErrorMsg(data.error || '결제 확인 실패');
                }
            })
            .catch(() => {
                setStatus('error');
                setErrorMsg('서버 오류가 발생했습니다.');
            });
    }, [searchParams]);

    if (status === 'confirming') {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center">
                    <Loader2 className="animate-spin mx-auto mb-4 text-indigo-500" size={40} />
                    <p className="text-slate-500 font-medium text-sm">결제를 확인하고 있습니다...</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="max-w-md mx-auto px-4 py-12 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-500 text-2xl">✕</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">결제 확인 실패</h2>
                <p className="text-sm text-slate-500 mb-6">{errorMsg}</p>
                <button onClick={() => router.push('/magic-frame/complete')}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl">
                    돌아가기
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"
                >
                    <CheckCircle2 size={40} className="text-emerald-600" />
                </motion.div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">주문이 완료되었습니다!</h2>
                    <p className="text-sm text-slate-500">
                        {productName && <><strong>{productName}</strong> 주문이 확인되었습니다.<br /></>}
                        매직액자와 함께 배송됩니다.
                    </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 text-sm text-slate-500">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <ShoppingBag size={16} className="text-indigo-500" />
                        <span className="font-bold text-slate-700">배송 안내</span>
                    </div>
                    <p>매직액자 제작 완료 후 함께 배송됩니다.<br />배송 관련 문의는 카카오톡 채널로 연락해 주세요.</p>
                </div>

                <button onClick={() => router.push('/magic-frame/complete')}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mx-auto transition-colors">
                    <ArrowLeft size={14} /> 완료 페이지로 돌아가기
                </button>
            </motion.div>
        </div>
    );
}

export default function MagicFrameOrderSuccessPage() {
    return (
        <MagicFrameLayout>
            <Suspense fallback={
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="animate-spin text-indigo-500" size={40} />
                </div>
            }>
                <OrderSuccessContent />
            </Suspense>
        </MagicFrameLayout>
    );
}
