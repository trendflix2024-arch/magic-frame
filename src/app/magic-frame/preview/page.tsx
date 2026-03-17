"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Crop, ImageIcon, Sparkles, ArrowRight, ArrowLeft, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { MagicFrameLayout } from '@/components/magic-frame/MagicFrameLayout';
import { CollageMaker } from '@/components/magic-frame/CollageMaker';
import { PhotoCropper } from '@/components/magic-frame/PhotoCropper';
import { Gallery } from '@/components/magic-frame/Gallery';

type Tool = 'collage' | 'crop' | 'gallery';

export default function MagicFramePreviewPage() {
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFinalize = (blob: Blob) => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(blob));
        setShowOrderModal(true);
    };

    const toolTitles: Record<string, string> = { collage: '콜라주 메이커', crop: '개별 사진 크롭', gallery: '샘플 갤러리' };

    return (
        <MagicFrameLayout>
            {/* 체험 모드 배너 */}
            <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 text-center">
                <p className="text-xs text-amber-700 font-medium">
                    체험 모드 — 편집 기능을 자유롭게 사용해보세요
                </p>
            </div>

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
                        <p className="text-center text-sm font-medium text-slate-500 mb-5 break-keep">
                            어떤 방식으로 편집할까요?
                        </p>

                        {/* 콜라주 메이커 */}
                        <motion.button
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0, duration: 0.3 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setSelectedTool('collage')}
                            className="w-full bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm text-left"
                        >
                            <div className="bg-gradient-to-br from-violet-50 to-purple-100 px-5 pt-5 pb-3">
                                <div className="grid grid-cols-2 gap-1.5">
                                    <div className="h-16 rounded-xl bg-gradient-to-br from-violet-300 to-purple-400 opacity-80" />
                                    <div className="h-16 rounded-xl bg-gradient-to-br from-indigo-200 to-blue-300 opacity-80" />
                                    <div className="h-16 rounded-xl bg-gradient-to-br from-pink-200 to-rose-300 opacity-80" />
                                    <div className="h-16 rounded-xl bg-gradient-to-br from-amber-200 to-orange-300 opacity-80" />
                                </div>
                            </div>
                            <div className="px-4 py-3.5 flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                                    <Layers size={16} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-slate-800 text-sm">콜라주 메이커</p>
                                    <p className="text-xs text-slate-400 mt-0.5">최대 4장을 한 액자에 배치해요</p>
                                </div>
                                <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />
                            </div>
                        </motion.button>

                        {/* 개별 사진 크롭 */}
                        <motion.button
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08, duration: 0.3 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setSelectedTool('crop')}
                            className="w-full bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm text-left"
                        >
                            <div className="bg-gradient-to-br from-sky-50 to-blue-100 px-5 pt-5 pb-3 flex justify-center">
                                <div className="relative w-28 h-36">
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-sky-100 rounded-xl" />
                                    {/* 크롭 핸들 */}
                                    <div className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-sky-500 rounded-tl-sm" />
                                    <div className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-sky-500 rounded-tr-sm" />
                                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-sky-500 rounded-bl-sm" />
                                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-sky-500 rounded-br-sm" />
                                    {/* 가이드 라인 */}
                                    <div className="absolute inset-x-0 top-1/2 h-px bg-sky-400/25" />
                                    <div className="absolute inset-y-0 left-1/2 w-px bg-sky-400/25" />
                                </div>
                            </div>
                            <div className="px-4 py-3.5 flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                                    <Crop size={16} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-slate-800 text-sm">개별 사진 크롭</p>
                                    <p className="text-xs text-slate-400 mt-0.5">3:4, 4:3 비율로 정밀하게 편집해요</p>
                                </div>
                                <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />
                            </div>
                        </motion.button>

                        {/* 샘플 갤러리 */}
                        <motion.button
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.16, duration: 0.3 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setSelectedTool('gallery')}
                            className="w-full bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm text-left"
                        >
                            <div className="bg-gradient-to-br from-pink-50 to-rose-100 px-5 pt-5 pb-3">
                                <div className="flex gap-1.5">
                                    <div className="flex-1 flex flex-col gap-1.5">
                                        <div className="h-14 rounded-xl bg-gradient-to-br from-pink-300 to-rose-400 opacity-80" />
                                        <div className="h-8 rounded-xl bg-gradient-to-br from-violet-300 to-purple-400 opacity-80" />
                                    </div>
                                    <div className="flex-1 flex flex-col gap-1.5">
                                        <div className="h-8 rounded-xl bg-gradient-to-br from-sky-300 to-blue-400 opacity-80" />
                                        <div className="h-14 rounded-xl bg-gradient-to-br from-amber-200 to-orange-300 opacity-80" />
                                    </div>
                                    <div className="flex-1 flex flex-col gap-1.5">
                                        <div className="h-11 rounded-xl bg-gradient-to-br from-emerald-200 to-teal-300 opacity-80" />
                                        <div className="h-11 rounded-xl bg-gradient-to-br from-fuchsia-200 to-pink-300 opacity-80" />
                                    </div>
                                </div>
                            </div>
                            <div className="px-4 py-3.5 flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                                    <ImageIcon size={16} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-slate-800 text-sm">샘플 갤러리</p>
                                    <p className="text-xs text-slate-400 mt-0.5">완성된 예시 작품들을 확인해요</p>
                                </div>
                                <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />
                            </div>
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
                        {/* 뒤로가기 */}
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

                        {/* 편집 영역 */}
                        <div className="max-w-5xl mx-auto px-4 py-6">
                            {selectedTool === 'collage' && (
                                <CollageMaker onFinalize={(blob) => handleFinalize(blob)} />
                            )}
                            {selectedTool === 'crop' && (
                                <PhotoCropper onFinalize={(blob) => handleFinalize(blob)} />
                            )}
                            {selectedTool === 'gallery' && (
                                <Gallery isAdmin={false} />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 주문 유도 모달 */}
            <AnimatePresence>
                {showOrderModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
                        >
                            <button
                                onClick={() => setShowOrderModal(false)}
                                className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            {previewUrl && (
                                <div className="rounded-xl overflow-hidden border border-slate-200 mb-5 shadow-md">
                                    <img src={previewUrl} alt="편집된 사진 미리보기" className="w-full" />
                                </div>
                            )}

                            <div className="text-center space-y-2 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                    <Sparkles size={22} className="text-white" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800">이렇게 만들어져요!</h3>
                                <p className="text-sm text-slate-500 leading-relaxed break-keep">
                                    실제 주문은 간단한 본인 확인 후<br />바로 진행할 수 있어요
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Link
                                    href="/magic-frame/login"
                                    className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-base rounded-xl shadow-lg shadow-indigo-300/50 active:scale-[0.98] transition-transform"
                                >
                                    <Sparkles size={16} className="text-white/90" />
                                    주문하러 가기
                                    <ArrowRight size={16} />
                                </Link>
                                <button
                                    onClick={() => setShowOrderModal(false)}
                                    className="w-full py-3 text-slate-400 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors active:scale-[0.98]"
                                >
                                    계속 편집하기
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </MagicFrameLayout>
    );
}
