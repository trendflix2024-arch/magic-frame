"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface MFSession {
    userId: string;
    name: string;
    phone: string;
}

export function useMagicFrameAuth(requireAuth = true) {
    const router = useRouter();
    const [session, setSession] = useState<MFSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const raw = localStorage.getItem('magic_frame_session');
        if (raw) {
            try {
                setSession(JSON.parse(raw));
            } catch {
                localStorage.removeItem('magic_frame_session');
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!loading && requireAuth && !session) {
            router.replace('/magic-frame/market-login');
        }
    }, [loading, session, requireAuth, router]);

    const login = (data: MFSession) => {
        localStorage.setItem('magic_frame_session', JSON.stringify(data));
        setSession(data);
    };

    const logout = () => {
        localStorage.removeItem('magic_frame_session');
        setSession(null);
    };

    return { session, loading, login, logout };
}
