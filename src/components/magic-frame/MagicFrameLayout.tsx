"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Mail, MessageCircle, LogOut } from 'lucide-react';
import { KAKAO_CHANNEL_URL, SUPPORT_EMAIL } from '@/lib/magic-frame-config';

export function MagicFrameLayout({
    children,
    mainClassName,
    hideFooter,
}: {
    children: React.ReactNode;
    mainClassName?: string;
    hideFooter?: boolean;
}) {
    const router = useRouter();
    const [hasSession, setHasSession] = useState(false);

    useEffect(() => {
        const check = () => {
            try {
                const raw = localStorage.getItem('magic_frame_session');
                setHasSession(!!(raw && JSON.parse(raw)?.userId));
            } catch {
                setHasSession(false);
            }
        };
        check();
        window.addEventListener('storage', check);
        return () => window.removeEventListener('storage', check);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('magic_frame_session');
        setHasSession(false);
        router.push('/magic-frame');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="w-20" />
                    <Link href="/magic-frame" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                            <Sparkles size={16} className="text-white" />
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            매직액자
                        </span>
                    </Link>
                    <div className="flex justify-end">
                        {hasSession && (
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
                                title="로그아웃"
                            >
                                <LogOut size={13} />
                                로그아웃
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className={`flex-1 ${mainClassName ?? ''}`}>{children}</main>

            {/* Footer */}
            {!hideFooter && <footer className="bg-white border-t border-slate-200 py-6">
                <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
                    <p className="text-xs text-slate-400 font-medium">문의하기</p>
                    <div className="flex items-center justify-center gap-4">
                        <a href={KAKAO_CHANNEL_URL}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-600 transition-colors">
                            <MessageCircle size={13} /> 카카오톡 채널
                        </a>
                        <span className="text-slate-200">|</span>
                        <a href={`mailto:${SUPPORT_EMAIL}`}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors">
                            <Mail size={13} /> 이메일 문의
                        </a>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-2">© 2026 매직액자. All rights reserved.</p>
                </div>
            </footer>}
        </div>
    );
}
