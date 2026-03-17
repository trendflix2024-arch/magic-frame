"use client";

import { useSession } from 'next-auth/react';

const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

export function useMagicFrameAdmin() {
    const { data: session, status } = useSession();
    const loading = status === 'loading';
    const isAdmin = status === 'authenticated' && adminEmails.includes(session?.user?.email || '');

    return { isAdmin, loading };
}
