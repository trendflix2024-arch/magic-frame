"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, MessageCircle, Mail, Home, ShoppingBag, Loader2, ExternalLink } from 'lucide-react';
import { MagicFrameLayout } from '@/components/magic-frame/MagicFrameLayout';
import { KAKAO_CHANNEL_URL, SUPPORT_EMAIL, MAGIC_FRAME_PRODUCTS } from '@/lib/magic-frame-config';

export default function MagicFrameComplete() {
    const router = useRouter();
    const [result, setResult] = useState<{ imageUrl: string; name: string } | null>(null);
    const [session, setSession] = useState<{ userId: string; name: string; phone: string } | null>(null);
    const [purchasingProduct, setPurchasingProduct] = useState<string | null>(null);
    const [products, setProducts] = useState<typeof MAGIC_FRAME_PRODUCTS>([]);

    useEffect(() => {
        // Fetch products from DB (fallback to hardcoded)
        fetch('/api/magic-frame/products')
            .then(res => res.json())
            .then(data => setProducts(data.products?.length ? data.products : MAGIC_FRAME_PRODUCTS))
            .catch(() => setProducts(MAGIC_FRAME_PRODUCTS));
    }, []);

    useEffect(() => {
        const raw = sessionStorage.getItem('magic_frame_result');
        if (!raw) {
            router.replace('/magic-frame');
            return;
        }
        try {
            setResult(JSON.parse(raw));
        } catch {
            router.replace('/magic-frame');
        }

        // 세션 정보 (결제에 필요)
        try {
            const rawSession = sessionStorage.getItem('magic_frame_session');
            if (rawSession) setSession(JSON.parse(rawSession));
        } catch {}
    }, [router]);

    const handleProductPurchase = async (product: typeof MAGIC_FRAME_PRODUCTS[0]) => {
        if (!session) {
            router.push('/magic-frame/login');
            return;
        }

        setPurchasingProduct(product.id);
        try {
            const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
            if (!clientKey) {
                alert('결제 시스템을 준비 중입니다. 잠시 후 다시 시도해주세요.');
                return;
            }

            // sessionStorage 유실 대비 localStorage 폴백
            localStorage.setItem('mf_pending_order', session.userId);

            const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
            const tossPayments = await loadTossPayments(clientKey);

            const orderId = `mf-${product.id}-${Date.now()}`;
            const payment = tossPayments.payment({ customerKey: session.userId });

            await payment.requestPayment({
                method: 'CARD',
                amount: { currency: 'KRW', value: product.price },
                orderId,
                orderName: `매직액자 ${product.name}`,
                successUrl: `${window.location.origin}/magic-frame/order/success?productId=${product.id}`,
                failUrl: `${window.location.origin}/magic-frame/order/fail`,
                customerName: session.name,
            });
        } catch (err: any) {
            if (err?.code !== 'USER_CANCEL') {
                console.error('Payment error:', err);
                alert('결제 중 오류가 발생했습니다.');
            }
            localStorage.removeItem('mf_pending_order');
        } finally {
            setPurchasingProduct(null);
        }
    };

    if (!result) return null;

    return (
        <MagicFrameLayout>
            <div className="max-w-md mx-auto px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6"
                >
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} className="text-emerald-600" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">제출이 완료되었습니다!</h1>
                        <p className="text-sm text-slate-500">
                            {result.name}님의 사진이 성공적으로 저장되었습니다.<br />
                            소중한 매직액자를 곧 만나보실 수 있습니다.
                        </p>
                    </div>

                    {/* Preview */}
                    {result.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                            <img src={result.imageUrl} alt="제출된 사진" className="w-full" />
                        </div>
                    )}

                    {/* Product Recommendations */}
                    {session && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <ShoppingBag size={16} className="text-indigo-500" />
                                <h3 className="text-sm font-bold text-slate-700">함께 배송 가능한 상품</h3>
                            </div>
                            <p className="text-xs text-slate-400">매직액자와 함께 받아보세요</p>

                            <div className="grid grid-cols-2 gap-3">
                                {products.map((product, i) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 + i * 0.1 }}
                                        className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center space-y-2"
                                    >
                                        {/* Product Image or Emoji */}
                                        {product.image_url ? (
                                            <div className="w-16 h-16 rounded-xl overflow-hidden mx-auto">
                                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="text-3xl">{product.emoji}</div>
                                        )}
                                        <h4 className="text-sm font-bold text-slate-700">{product.name}</h4>
                                        <p className="text-[11px] text-slate-400 leading-tight">{product.description}</p>
                                        <p className="text-sm font-bold text-indigo-600">
                                            ₩{product.price.toLocaleString()}
                                        </p>
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => handleProductPurchase(product)}
                                                disabled={purchasingProduct !== null}
                                                className={`${product.detail_url ? 'flex-1' : 'w-full'} py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1`}
                                            >
                                                {purchasingProduct === product.id
                                                    ? <><Loader2 size={12} className="animate-spin" /> 처리 중...</>
                                                    : '구매하기'}
                                            </button>
                                            {product.detail_url && (
                                                <a href={product.detail_url} target="_blank" rel="noopener noreferrer"
                                                    className="px-3 py-2 border border-indigo-200 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-0.5">
                                                    <ExternalLink size={10} /> 자세히
                                                </a>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Contact */}
                    <div className="bg-slate-50 rounded-2xl p-5 space-y-3 text-sm">
                        <p className="text-slate-500 font-medium">수정이 필요하신 경우 아래로 문의해 주세요</p>
                        <div className="flex flex-col gap-2">
                            <a href={KAKAO_CHANNEL_URL} target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-400 text-white font-bold rounded-xl hover:bg-amber-500 transition-colors">
                                <MessageCircle size={16} /> 카카오톡 채널 문의
                            </a>
                            <a href={`mailto:${SUPPORT_EMAIL}`}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                                <Mail size={16} /> 이메일 문의
                            </a>
                        </div>
                    </div>

                    <button onClick={() => router.push('/magic-frame')}
                        className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mx-auto transition-colors">
                        <Home size={12} /> 처음으로 돌아가기
                    </button>
                </motion.div>
            </div>
        </MagicFrameLayout>
    );
}
