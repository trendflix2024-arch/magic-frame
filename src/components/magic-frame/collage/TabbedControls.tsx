"use client";

import { useState } from 'react';
import { LayoutGrid, Palette, Type } from 'lucide-react';
import type { ControlsProps } from './types';
import { LayoutSection, RatioSection, StyleSection, TextSection, ActionsSection } from './sections';

type Tab = 'layout' | 'style' | 'text';

const TABS: { key: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { key: 'layout', label: '레이아웃', icon: LayoutGrid },
    { key: 'style', label: '스타일', icon: Palette },
    { key: 'text', label: '텍스트', icon: Type },
];

export function TabbedControls(props: ControlsProps) {
    const [tab, setTab] = useState<Tab>('layout');

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* 탭 헤더 — sticky */}
            <div className="flex border-b border-slate-200 bg-white sticky top-0 z-20">
                {TABS.map(({ key, label, icon: Icon }) => {
                    const isActive = tab === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-bold transition-colors border-b-2 ${
                                isActive
                                    ? 'text-indigo-600 border-indigo-600'
                                    : 'text-slate-400 border-transparent hover:text-slate-600'
                            }`}
                        >
                            <Icon size={14} />
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* 탭 컨텐츠 */}
            <div className="p-5 space-y-5">
                {tab === 'layout' && (
                    <>
                        <LayoutSection {...props} />
                        <RatioSection {...props} />
                    </>
                )}
                {tab === 'style' && <StyleSection {...props} />}
                {tab === 'text' && <TextSection {...props} />}
            </div>

            {/* 액션 — 항상 하단 */}
            <div className="border-t border-slate-100 p-5">
                <ActionsSection {...props} />
            </div>
        </div>
    );
}
