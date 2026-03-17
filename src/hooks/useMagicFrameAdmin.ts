"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ADMIN_TOKEN_KEY } from '@/lib/admin-token';

const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

export function useMagicFrameAdmin() {
    const { data: session, status } = useSession();
    const [sessionAdmin, setSessionAdmin] = useState(false);

    useEffect(() => {
        const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
        setSessionAdmin(!!token);
    }, []);

    const loading = status === 'loading';
    const isAdmin = sessionAdmin || (status === 'authenticated' && adminEmails.includes(session?.user?.email || ''));

    return { isAdmin, loading };
}
