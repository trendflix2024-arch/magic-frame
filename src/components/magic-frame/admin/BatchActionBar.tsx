"use client";

import { useState } from 'react';
import { CheckSquare, ChevronDown, X, Loader2 } from 'lucide-react';

const SHIPPING_STATUS_OPTIONS = [
    { value: 'pending', label: '접수대기' },
    { value: 'new_order', label: '신규접수' },
    { value: 'preparing', label: '발송준비' },
    { value: 'shipped', label: '발송완료' },
];

interface BatchActionBarProps {
    selectedCount: number;
    onStatusChange: (status: string) => Promise<void>;
    onClearSelection: () => void;
}

export function BatchActionBar({ selectedCount, onStatusChange, onClearSelection }: BatchActionBarProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleStatusChange = async (status: string) => {
        setLoading(true);
        setOpen(false);
        try {
            await onStatusChange(status);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-indigo-600 text-white rounded-xl p-3 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-bold">
                <CheckSquare size={16} />
                <span>{selectedCount}건 선택됨</span>
            </div>

            <div className="flex items-center gap-2">
                {/* Status change dropdown */}
                <div className="relative">
                    <button onClick={() => setOpen(!open)} disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={12} />}
                        상태 변경
                    </button>
                    {open && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                            <div className="absolute right-0 bottom-full mb-1 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-20 min-w-[120px]">
                                {SHIPPING_STATUS_OPTIONS.map(opt => (
                                    <button key={opt.value}
                                        onClick={() => handleStatusChange(opt.value)}
                                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Clear selection */}
                <button onClick={onClearSelection}
                    className="flex items-center gap-1 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors">
                    <X size={12} /> 해제
                </button>
            </div>
        </div>
    );
}
