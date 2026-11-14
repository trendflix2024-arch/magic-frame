"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminFetch } from '@/lib/admin-token';

interface SingleRegisterModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const INITIAL = { name: '', haengbun: '', phone: '', address: '', postal_code: '', address_detail: '' };

export function SingleRegisterModal({ open, onClose, onSuccess }: SingleRegisterModalProps) {
    const [form, setForm] = useState(INITIAL);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const canSubmit = form.name.trim() && form.haengbun.trim() && !loading;

    const handleClose = () => {
        setForm(INITIAL);
        setError('');
        setDone(false);
        onClose();
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await adminFetch('/api/magic-frame/admin/shipping/import', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matches: [{
                        ...form,
                        name: form.name.trim(),
                        haengbun: form.haengbun.trim(),
                        phone: form.phone.replace(/[^0-9]/g, '') || null,
                        isNew: true,
                        userId: null,
                    }],
                }),
            });
            const data = await res.json();
            if (!res.ok || data.errors?.length) {
                setError(data.errors?.[0] || data.error || '등록에 실패했습니다.');
                return;
            }
            setDone(true);
            onSuccess();
        } catch {
            setError('네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <UserPlus size={18} className="text-indigo-500" />
                                <h3 className="font-bold text-slate-800">고객 개별 등록</h3>
                            </div>
                            <button onClick={handleClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>

                        {done ? (
                            <div className="px-5 py-10 text-center space-y-3">
                                <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
                                <p className="font-semibold text-slate-700">등록 완료</p>
                                <p className="text-sm text-slate-500">{form.name} ({form.haengbun}) 고객이 등록되었습니다.</p>
                                <button onClick={handleClose}
                                    className="mt-2 px-6 py-2 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors">
                                    닫기
                                </button>
                            </div>
                        ) : (
                            <div className="px-5 py-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="성함 *" value={form.name} onChange={v => set('name', v)} placeholder="홍길동" />
                                    <Field label="행번 *" value={form.haengbun} onChange={v => set('haengbun', v)} placeholder="A-01" />
                                </div>
                                <Field label="연락처" value={form.phone} onChange={v => set('phone', v)} placeholder="010-1234-5678" />
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-2">
                                        <Field label="주소" value={form.address} onChange={v => set('address', v)} placeholder="서울시 강남구..." />
                                    </div>
                                    <Field label="우편번호" value={form.postal_code} onChange={v => set('postal_code', v)} placeholder="06000" />
                                </div>
                                <Field label="상세주소" value={form.address_detail} onChange={v => set('address_detail', v)} placeholder="101동 202호" />

                                {error && (
                                    <div className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 rounded-lg p-2.5">
                                        <AlertCircle size={12} /> {error}
                                    </div>
                                )}

                                <button onClick={handleSubmit} disabled={!canSubmit}
                                    className="w-full py-2.5 text-sm font-bold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={14} />}
                                    등록하기
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
    return (
        <label className="block">
            <span className="text-xs font-medium text-slate-500 mb-1 block">{label}</span>
            <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none transition-shadow" />
        </label>
    );
}
