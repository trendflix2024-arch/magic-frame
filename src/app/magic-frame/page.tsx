"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Image, Layers, Type } from 'lucide-react';
import { MagicFrameLayout } from '@/components/magic-frame/MagicFrameLayout';

export default function MagicFrameLanding() {
    return (
        <MagicFrameLayout hideFooter>
            {/* 단일 화면 — 스크롤 불필요 */}
            <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 overflow-hidden">
                {/* Background glow blobs */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-200/40 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-purple-200/30 rounded-full blur-2xl" />
                </div>

                {/* CSS 액자 모형 */}
                <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
                    className="relative mb-7 z-10"
                >
                    <div className="w-44 h-56 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-[5px] shadow-2xl shadow-indigo-300/50">
                        <div className="w-full h-full rounded-xl bg-white p-1.5">
                            <div className="w-full h-full rounded-lg bg-gradient-to-br from-slate-100 via-indigo-50 to-purple-100 relative overflow-hidden">
                                <div className="absolute inset-0 flex flex-col justify-end p-3 gap-1.5">
                                    <div className="h-1.5 w-3/4 bg-white/60 rounded-full" />
                                    <div className="h-1.5 w-1/2 bg-white/40 rounded-full" />
                                </div>
                                <div className="absolute top-3 right-3">
                                    <Sparkles size={18} className="text-indigo-400/70" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-3 bg-indigo-300/25 rounded-full blur-md" />
                </motion.div>

                {/* 텍스트 */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.45 }}
                    className="text-center space-y-3 z-10 max-w-xs"
                >
                    <h1 className="text-[1.85rem] font-black text-slate-900 leading-[1.2] tracking-tight break-keep">
                        나만의 사진으로<br />
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-500 bg-clip-text text-transparent">
                            매직액자
                        </span>를 만드세요
                    </h1>
                    <p className="text-sm text-slate-500 leading-relaxed break-keep">
                        사진 편집부터 주문까지 한 번에
                    </p>
                </motion.div>

                {/* 기능 요약 pills */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    className="flex items-center gap-2 mt-6 z-10 flex-wrap justify-center"
                >
                    {[
                        { icon: Image, label: '사진 크롭' },
                        { icon: Layers, label: '콜라주' },
                        { icon: Type, label: '문구 삽입' },
                    ].map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-slate-100 rounded-full px-3 py-1.5 shadow-sm">
                            <f.icon size={13} className="text-indigo-500" />
                            <span className="text-xs font-medium text-slate-600">{f.label}</span>
                        </div>
                    ))}
                </motion.div>

            </section>

            {/* Sticky CTA Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
                <div className="max-w-lg mx-auto px-4 pb-safe pb-4 pointer-events-auto">
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-2xl shadow-indigo-200/50 border border-white/60">
                        <Link
                            href="/magic-frame/login"
                            className="flex items-center justify-center gap-2.5 w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-base rounded-xl shadow-lg shadow-indigo-300/50 active:scale-[0.98] transition-transform"
                        >
                            <Sparkles size={18} className="text-white/90" />
                            지금 시작하기
                            <ArrowRight size={18} />
                        </Link>
                        <Link
                            href="/magic-frame/preview"
                            className="flex items-center justify-center gap-1.5 w-full py-3 text-slate-500 text-sm font-medium rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all mt-1"
                        >
                            편집툴 먼저 체험해보기
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>
        </MagicFrameLayout>
    );
}
