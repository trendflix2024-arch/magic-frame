"use client";

import Link from 'next/link';
import { ShoppingBag, ArrowRight, Image, Layers, Type } from 'lucide-react';
import { MagicFrameLayout } from '@/components/magic-frame/MagicFrameLayout';
import { AuroraBackground } from '@/components/magic-frame/AuroraBackground';

const features = [
    { icon: Image, label: '사진 크롭 & 편집', desc: '원하는 비율로 정밀하게' },
    { icon: Layers, label: '콜라주 메이커', desc: '최대 9장을 하나의 액자로' },
    { icon: Type, label: '문구 삽입', desc: '특별한 메시지를 더하세요' },
];

export default function MagicFrameLanding() {
    return (
        <MagicFrameLayout hideFooter>
            <AuroraBackground className="px-6 pb-40">
                {/* CSS 액자 모형 */}
                <div className="mb-10">
                    <div className="w-44 h-56 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-[5px] shadow-2xl">
                        <div className="w-full h-full rounded-xl bg-white p-1.5">
                            <div className="w-full h-full rounded-lg bg-gradient-to-br from-slate-100 via-indigo-50 to-purple-100 relative overflow-hidden" />
                        </div>
                    </div>
                </div>

                {/* Headline */}
                <div className="text-center mb-8">
                    <h1 className="text-[2rem] font-black text-slate-900 leading-[1.2] tracking-tight break-keep mb-2">
                        나만의 사진으로<br />
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            매직액자
                        </span>를 만드세요
                    </h1>
                    <p className="text-base text-slate-400 leading-relaxed break-keep">
                        사진 편집부터 주문까지, 한 번에
                    </p>
                </div>

                {/* Feature pills */}
                <div className="flex flex-wrap justify-center gap-2">
                    {features.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-full px-3 py-1.5 shadow-sm">
                            <f.icon size={13} className="text-indigo-500" />
                            <span className="text-sm font-semibold text-slate-700">{f.label}</span>
                        </div>
                    ))}
                </div>
            </AuroraBackground>

            {/* Sticky CTA Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
                <div className="max-w-lg mx-auto px-4 pb-4 pointer-events-auto">
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-100 space-y-2">
                        <Link
                            href="/magic-frame/market-login"
                            className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-200/70 active:scale-[0.98] transition-transform"
                        >
                            <ShoppingBag size={16} className="text-white/90" />
                            구매자 로그인
                            <ArrowRight size={16} />
                        </Link>
                        <Link
                            href="/magic-frame/preview"
                            className="flex items-center justify-center gap-1.5 w-full py-2.5 text-slate-400 text-sm font-medium rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all"
                        >
                            편집툴 먼저 체험해보기
                            <ArrowRight size={12} />
                        </Link>
                    </div>
                </div>
            </div>
        </MagicFrameLayout>
    );
}
