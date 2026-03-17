"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Crop, Loader2, AlertCircle, Check, Send, ArrowLeft, ImageIcon, ChevronRight } from 'lucide-react';
import { MagicFrameLayout } from '@/components/magic-frame/MagicFrameLayout';
import { CollageMaker } from '@/components/magic-frame/CollageMaker';
import { PhotoCropper } from '@/components/magic-frame/PhotoCropper';
import { Gallery } from '@/components/magic-frame/Gallery';
import { useMagicFrameAuth } from '@/hooks/useMagicFrameAuth';
import { useMagicFrameAdmin } from '@/hooks/useMagicFrameAdmin';

type Tool = 'collage' | 'crop' | 'gallery';

export default function MagicFrameEditPage() {
    const router = useRouter();
    const { session, loading: authLoading } = useMagicFrameAuth(true);
    const { isAdmin } = useMagicFrameAdmin();
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

    // Step 1: Confirm photo, Step 2: Send/Upload
    const [confirmedBlob, setConfirmedBlob] = useState<Blob | null>(null);
    const [confirmedType, setConfirmedType] = useState<string>('single');
    const [confirmedPreview, setConfirmedPreview] = useState<string | null>(null);

    // Confirm popup (step 1)
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
    const [pendingType, setPendingType] = useState<string>('single');
    const [pendingPreview, setPendingPreview] = useState<string | null>(null);

    // Upload state (step 2)
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const handleFinalize = (blob: Blob, type: string) => {
        setPendingBlob(blob);
        setPendingType(type);
        setPendingPreview(URL.createObjectURL(blob));
        setShowConfirm(true);
    };

    const handleConfirmPhoto = () => {
        if (!pendingBlob) return;
        if (confirmedPreview) URL.revokeObjectURL(confirmedPreview);
        setConfirmedBlob(pendingBlob);
        setConfirmedType(pendingType);
        setConfirmedPreview(pendingPreview);
        setShowConfirm(false);
        setPendingBlob(null);
        setPendingPreview(null);
        setUploadError('');
    };

    const handleSend = async () => {
        if (!confirmedBlob || !session) return;
        setUploading(true);
        setUploadError('');

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        try {
            const formData = new FormData();
            formData.append('image', confirmedBlob, 'photo.jpg');
            formData.append('userId', session.userId);
            formData.append('imageType', confirmedType);

            const res = await fetch('/api/magic-frame/upload', {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });

            const data = await res.json();
            if (data.error) {
                setUploadError(data.error);
                return;
            }

            sessionStorage.setItem('magic_frame_result', JSON.stringify({
                imageUrl: data.imageUrl,
                name: session.name,
            }));

            router.push('/magic-frame/complete');
        } catch (e: any) {
            if (e.name === 'AbortError') {
                setUploadError('업로드 시간이 초과되었습니다. 다시 시도해 주세요.');
            } else {
                setUploadError('업로드 중 오류가 발생했습니다. 다시 시도해 주세요.');
            }
        } finally {
            clearTimeout(timeout);
            setUploading(false);
        }
    };

    const handleCancelConfirm = () => {
        setShowConfirm(false);
        if (pendingPreview) URL.revokeObjectURL(pendingPreview);
        setPendingPreview(null);
        setPendingBlob(null);
    };

    const handleResetConfirmed = () => {
        if (confirmedPreview) URL.revokeObjectURL(confirmedPreview);
        setConfirmedBlob(null);
        setConfirmedPreview(null);
        setUploadError('');
    };

    const toolTitles: Record<string, string> = { collage: '콜라주 메이커', crop: '개별 사진 크롭', gallery: '갤러리' };

    if (authLoading) {
        return (
            <MagicFrameLayout>
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
            </MagicFrameLayout>
        );
    }

    return (
        <MagicFrameLayout>
            <AnimatePresence mode="wait">
                {selectedTool === null ? (
                    /* ── 선택 화면 ── */
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25 }}
                        className="max-w-sm mx-auto px-4 py-6 space-y-3"
                    >
                        <p className="text-center text-base font-semibold text-slate-700 mb-6 break-keep">
                            어떤 방식으로 편집할까요?
                        </p>

                        {/* 콜라주 메이커 */}
                        <motion.button
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0, duration: 0.3 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setSelectedTool('collage')}
                            className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 text-left border border-slate-100 shadow-sm active:scale-[0.98] transition-transform"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-200/70">
                                <Layers size={24} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-900 text-[15px] leading-snug">콜라주 메이커</p>
                                <p className="text-[13px] text-slate-400 mt-1 break-keep leading-relaxed">최대 4장을 한 액자에 배치해요</p>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
                        </motion.button>

                        {/* 개별 사진 크롭 */}
                        <motion.button
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08, duration: 0.3 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setSelectedTool('crop')}
                            className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 text-left border border-slate-100 shadow-sm active:scale-[0.98] transition-transform"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-200/70">
                                <Crop size={24} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-900 text-[15px] leading-snug">개별 사진 크롭</p>
                                <p className="text-[13px] text-slate-400 mt-1 break-keep leading-relaxed">3:4, 4:3 비율로 정밀하게 편집해요</p>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
                        </motion.button>

                        {/* 갤러리 */}
                        <motion.button
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.16, duration: 0.3 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setSelectedTool('gallery')}
                            className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 text-left border border-slate-100 shadow-sm active:scale-[0.98] transition-transform"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-200/70">
                                <ImageIcon size={24} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-900 text-[15px] leading-snug">갤러리</p>
                                <p className="text-[13px] text-slate-400 mt-1 break-keep leading-relaxed">업로드된 작품들을 확인해요</p>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
                        </motion.button>
                    </motion.div>
                ) : (
                    /* ── 도구 화면 ── */
                    <motion.div
                        key={selectedTool}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                    >
                        {/* 뒤로가기 — 사진 확정 상태가 아닐 때만 표시 */}
                        {!confirmedBlob && (
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-white">
                                <button
                                    onClick={() => setSelectedTool(null)}
                                    className="flex items-center gap-1.5 text-sm text-slate-500 font-medium active:text-slate-800 transition-colors min-h-[44px] pr-3"
                                >
                                    <ArrowLeft size={16} /> 다시 선택
                                </button>
                                {selectedTool && (
                                    <span className="text-sm font-black text-slate-700">{toolTitles[selectedTool]}</span>
                                )}
                            </div>
                        )}

                        {/* Step 2: 사진 확정 후 — 미리보기 + 발송 */}
                        {confirmedBlob && (
                            <motion.div key="confirmed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="max-w-md mx-auto px-4 py-8">
                                <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 text-center space-y-5">
                                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                                        <Check size={28} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-1">사진이 확정되었습니다</h3>
                                        <p className="text-xs text-slate-400">아래 미리보기를 확인 후 발송해 주세요</p>
                                    </div>

                                    {confirmedPreview && (
                                        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-md">
                                            <img src={confirmedPreview} alt="확정된 사진" className="w-full" />
                                        </div>
                                    )}

                                    {uploadError && (
                                        <div className="bg-red-50 rounded-xl p-3 space-y-2">
                                            <p className="text-red-500 text-xs flex items-center justify-center gap-1">
                                                <AlertCircle size={12} /> {uploadError}
                                            </p>
                                            <button onClick={handleSend}
                                                className="text-xs text-red-600 font-bold hover:underline">
                                                다시 시도
                                            </button>
                                        </div>
                                    )}

                                    <div className="space-y-2 pt-2">
                                        <button onClick={handleSend} disabled={uploading}
                                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                            {uploading ? <><Loader2 size={16} className="animate-spin" /> 발송 중...</> : <><Send size={16} /> {uploadError ? '다시 발송하기' : '발송하기'}</>}
                                        </button>
                                        <button onClick={handleResetConfirmed} disabled={uploading}
                                            className="w-full py-3 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                                            <ArrowLeft size={14} /> 다시 편집하기
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* 편집 영역 — 확정 전에만 표시 */}
                        <div className={confirmedBlob ? 'hidden' : ''}>
                            <div className="max-w-5xl mx-auto px-4 py-6">
                                {selectedTool === 'collage' && (
                                    <CollageMaker onFinalize={(blob) => handleFinalize(blob, 'collage')} />
                                )}
                                {selectedTool === 'crop' && (
                                    <PhotoCropper onFinalize={(blob) => handleFinalize(blob, 'single')} />
                                )}
                                {selectedTool === 'gallery' && (
                                    <Gallery isAdmin={isAdmin} />
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirm popup (Step 1) */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">이 사진으로 확정하시겠습니까?</h3>
                            <p className="text-xs text-slate-400 mb-4">확정 후 발송 버튼을 눌러야 제출됩니다</p>

                            {pendingPreview && (
                                <div className="rounded-xl overflow-hidden border border-slate-200 mb-5">
                                    <img src={pendingPreview} alt="미리보기" className="w-full" />
                                </div>
                            )}

                            <div className="space-y-2">
                                <button onClick={handleConfirmPhoto}
                                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                                    <Check size={16} /> 사진 확정하기
                                </button>
                                <button onClick={handleCancelConfirm}
                                    className="w-full py-3 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition-colors">
                                    취소
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </MagicFrameLayout>
    );
}
