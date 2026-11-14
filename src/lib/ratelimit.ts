import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const hasUpstash = !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// In-memory fallback (dev / missing env). Vercel serverless instances do NOT
// share this, so production MUST use Upstash for reliable rate limiting.
const memStore = new Map<string, number[]>();
function memCheck(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const times = (memStore.get(key) || []).filter(t => now - t < windowMs);
    if (times.length >= limit) {
        memStore.set(key, times);
        return false;
    }
    times.push(now);
    memStore.set(key, times);
    return true;
}

const upstashTrackLimiter = hasUpstash
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        prefix: 'mf:track',
        analytics: false,
    })
    : null;

export async function checkTrackLimit(ip: string): Promise<boolean> {
    if (upstashTrackLimiter) {
        const { success } = await upstashTrackLimiter.limit(ip);
        return success;
    }
    return memCheck(`track:${ip}`, 10, 60_000);
}

export function getClientIp(req: Request): string {
    const fwd = req.headers.get('x-forwarded-for');
    if (fwd) return fwd.split(',')[0].trim();
    const real = req.headers.get('x-real-ip');
    return real || 'unknown';
}
