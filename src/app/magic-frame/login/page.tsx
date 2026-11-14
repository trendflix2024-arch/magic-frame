"use client";

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Hash, ArrowRight, Loader2, AlertCircle, Mail, MessageCircle, RotateCcw, Package } from 'lucide-react';
import { MagicFrameLayout } from '@/components/magic-frame/MagicFrameLayout';
import { KAKAO_CHANNEL_URL, SUPPORT_EMAIL } from '@/lib/magic-frame-config';
import { setAdminToken } from '@/lib/admin-token';

const SOURCE_LABEL: Record<string, string> = {
    gajeong: '가정의 달',
    coupang: '쿠팡',
    naver: '네이버',
};

function MagicFrameLoginInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const source = searchParams.get('source') || 'gajeong';
    const sourceLabel = SOURCE_LABEL[source] || '가정의 달';
    const [name, setName] = useState('');
    const [haengbun, setHaengbun] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submittedUserId, setSubmittedUserId] = useState<string | null>(null);
    const [resetting, setResetting] = useState(false);
    const [resetError, setResetError] = useState('');

    // 기존 세션이 있으면 편집 페이지로 자동 이동
    useEffect(() => {
        const raw = localStorage.getItem('magic_frame_session');
        if (raw) {
            try {
                const s = JSON.parse(raw);
                if (s?.userId) router.replace('/magic-frame/edit');
            } catch { /* ignore */ }
        }
    }, [router]);

    const handleResubmit = useCallback(async () => {
        if (!submittedUserId) return;
        setResetting(true);
        setResetError('');
        try {
            const res = await fetch('/api/magic-frame/resubmit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: submittedUserId }),
            });
            const data = await res.json();
            if (data.error) {
                setResetError(data.error);
                return;
            }
            localStorage.setItem('magic_frame_session', JSON.stringify({
                userId: submittedUserId,
                name: name.trim(),
                phone: haengbun,
            }));
            router.push('/magic-frame/edit');
        } catch {
            setResetError('네트워크 오류가 발생했습니다.');
        } finally {
            setResetting(false);
        }
    }, [submittedUserId, name, haengbun, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) { setError('이름을 입력해 주세요.'); return; }
        const cleanHaengbun = haengbun.replace(/[^0-9]/g, '');
        if (cleanHaengbun.length !== 7) { setError('행번 7자리를 입력해 주세요.'); return; }

        setLoading(true);
        try {
            const res = await fetch('/api/magic-frame/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), haengbun: cleanHaengbun, source }),
            });
            const data = await res.json();

            if (data.isAdmin) {
                setAdminToken(data.adminToken);
                router.push('/magic-frame/admin');
                return;
            }

            if (data.submitted) {
                setSubmittedUserId(data.userId);
                setSubmitted(true);
                return;
            }

            if (data.error) { setError(data.error); return; }

            localStorage.setItem('magic_frame_session', JSON.stringify({
                userId: data.userId,
                name: name.trim(),
                phone: cleanHaengbun,
                source,
            }));

            router.push('/magic-frame/edit');
        } catch {
            setError('네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MagicFrameLayout>
            <div className="max-w-md mx-auto px-4 py-12">
                <AnimatePresence mode="wait">
                    {submitted ? (
                        <motion.div key="submitted"
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 text-center space-y-5">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle size={28} className="text-amber-600" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">이미 제출이 완료되었습니다</h2>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                사진이 확정되어 제작 중에 있습니다.<br />
                                사진 변경을 원하시면 아래 버튼을 눌러 다시 제출하거나, 채널로 문의해 주세요.
                            </p>

                            <div className="space-y-3">
                                {resetError && (
                                    <p className="text-red-500 text-xs flex items-center justify-center gap-1">
                                        <AlertCircle size={12} /> {resetError}
                                    </p>
                                )}
                                <button onClick={handleResubmit} disabled={resetting}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                    {resetting
                                        ? <><Loader2 size={16} className="animate-spin" /> 처리 중...</>
                                        : <><RotateCcw size={16} /> 다시 제출하기</>}
                                </button>
                            </div>

                            <button onClick={() => {
                                sessionStorage.setItem('mf_name', name.trim());
                                sessionStorage.setItem('mf_haengbun', haengbun);
                                sessionStorage.removeItem('mf_phone');
                                router.push('/magic-frame/track');
                            }}
                                className="w-full py-4 bg-white border-2 border-indigo-200 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                                <Package size={16} /> 주문 현황 보기
                            </button>

                            <div className="flex flex-col gap-2 pt-2">
                                <a href={KAKAO_CHANNEL_URL} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-400 text-white font-bold rounded-xl hover:bg-amber-500 transition-colors">
                                    <MessageCircle size={16} /> 카카오톡 채널 문의
                                </a>
                                <a href={`mailto:${SUPPORT_EMAIL}`}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                                    <Mail size={16} /> 이메일 문의
                                </a>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="form"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-slate-800 mb-2">{sourceLabel} 구매자 본인 확인</h1>
                                <p className="text-base text-slate-400">이름과 행번을 입력해 주세요</p>
                            </div>

                            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 space-y-5">
                                <div>
                                    <label className="text-sm font-bold text-slate-500 mb-2 block">이름</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input value={name} onChange={e => setName(e.target.value)}
                                            placeholder="홍길동"
                                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none transition-all" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-slate-500 mb-2 block">행번</label>
                                    <div className="relative">
                                        <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            value={haengbun}
                                            onChange={e => setHaengbun(e.target.value.replace(/[^0-9]/g, '').slice(0, 7))}
                                            placeholder="행번 7자리 입력"
                                            maxLength={7}
                                            type="tel"
                                            inputMode="numeric"
                                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="text-red-500 text-sm flex items-center gap-1">
                                        <AlertCircle size={12} /> {error}
                                    </motion.p>
                                )}

                                <button type="submit" disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                    {loading ? <><Loader2 size={18} className="animate-spin" /> 확인 중...</>
                                        : <>사진 편집하기 <ArrowRight size={18} /></>}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MagicFrameLayout>
    );
}

export default function MagicFrameLogin() {
    return (
        <Suspense>
            <MagicFrameLoginInner />
        </Suspense>
    );
}
