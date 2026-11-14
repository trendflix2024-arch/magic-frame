"use client";

import { useState } from 'react';
import { ShieldAlert, User, KeyRound, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { setAdminToken } from '@/lib/admin-token';

// /magic-frame/admin 에 로그인 없이 들어왔을 때 보여주는 관리자 전용 로그인 폼
export function AdminLoginForm({ onSuccess }: { onSuccess: () => void }) {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim() || !code.trim()) { setError('이름과 관리자 번호를 입력해 주세요.'); return; }

        setLoading(true);
        try {
            const res = await fetch('/api/magic-frame/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), haengbun: code.replace(/[^0-9]/g, '') }),
            });
            const data = await res.json();
            if (data.isAdmin && data.adminToken) {
                setAdminToken(data.adminToken);
                onSuccess();
                return;
            }
            setError(data.error || '관리자 정보가 올바르지 않습니다.');
        } catch {
            setError('네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <ShieldAlert size={22} className="text-indigo-600" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">매직액자 관리자 로그인</h1>
                    <p className="text-sm text-slate-400 mt-1">관리자만 접근할 수 있습니다</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 space-y-4">
                    <div>
                        <label htmlFor="mf-admin-name" className="text-sm font-bold text-slate-500 mb-2 block">이름</label>
                        <div className="relative">
                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input id="mf-admin-name" value={name} onChange={e => setName(e.target.value)}
                                autoComplete="username"
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none transition-all" />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="mf-admin-code" className="text-sm font-bold text-slate-500 mb-2 block">관리자 번호</label>
                        <div className="relative">
                            <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input id="mf-admin-code" value={code} onChange={e => setCode(e.target.value)}
                                type="password" inputMode="numeric" autoComplete="current-password"
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none transition-all" />
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                            <AlertCircle size={12} /> {error}
                        </p>
                    )}

                    <button type="submit" disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                        {loading ? <><Loader2 size={18} className="animate-spin" /> 확인 중...</>
                            : <>로그인 <ArrowRight size={18} /></>}
                    </button>
                </form>
            </div>
        </div>
    );
}
