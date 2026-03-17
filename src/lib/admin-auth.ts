import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

/**
 * Returns true if the request is from an authenticated admin.
 * Accepts either:
 *   1. x-admin-token header matching ADMIN_TOKEN env var (name+phone login)
 *   2. NextAuth session with email in ADMIN_EMAILS env var (Google OAuth)
 */
export async function checkAdminAuth(req: NextRequest): Promise<boolean> {
    // 1. Check token-based admin auth (name+phone login)
    if (ADMIN_TOKEN) {
        const token = req.headers.get('x-admin-token');
        if (token === ADMIN_TOKEN) return true;
    }

    // 2. Fall back to NextAuth session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return false;
    return ADMIN_EMAILS.includes(session.user.email);
}
