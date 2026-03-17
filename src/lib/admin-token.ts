"use client";

export const ADMIN_TOKEN_KEY = 'magic_frame_admin_token';

export function getAdminToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

/**
 * Drop-in replacement for fetch() that automatically includes
 * the x-admin-token header for admin API routes.
 */
export function adminFetch(url: string, init?: RequestInit): Promise<Response> {
    const token = getAdminToken();
    const headers: Record<string, string> = {};

    // Merge existing headers
    if (init?.headers) {
        const existing = init.headers;
        if (existing instanceof Headers) {
            existing.forEach((val, key) => { headers[key] = val; });
        } else if (Array.isArray(existing)) {
            existing.forEach(([key, val]) => { headers[key] = val; });
        } else {
            Object.assign(headers, existing);
        }
    }

    if (token) headers['x-admin-token'] = token;

    return fetch(url, { ...init, headers });
}
