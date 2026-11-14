import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkAdminAuth } from '@/lib/admin-auth';

function normalizePhone(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
}

function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

type ExistingUser = {
    id: string;
    name: string;
    haengbun: string | null;
    phone: string | null;
    tracking_number: string | null;
    shipping_carrier: string | null;
    shipping_status: string | null;
};

// PostgREST 1000행 cap 회피 — CSV 의 행번/전화 list 로 타겟 조회 (chunked IN)
async function fetchMatchingUsers(haengbuns: string[], phones: string[]): Promise<ExistingUser[]> {
    const all: ExistingUser[] = [];
    const seen = new Set<string>();
    const SELECT = 'id, name, haengbun, phone, tracking_number, shipping_carrier, shipping_status';

    for (const c of chunk(haengbuns, 500)) {
        if (!c.length) continue;
        const { data, error } = await supabaseAdmin
            .from('magic_frame_users')
            .select(SELECT)
            .in('haengbun', c);
        if (error) throw new Error(error.message);
        for (const u of (data || []) as ExistingUser[]) {
            if (!seen.has(u.id)) { seen.add(u.id); all.push(u); }
        }
    }

    for (const c of chunk(phones, 500)) {
        if (!c.length) continue;
        const { data, error } = await supabaseAdmin
            .from('magic_frame_users')
            .select(SELECT)
            .in('phone', c);
        if (error) throw new Error(error.message);
        for (const u of (data || []) as ExistingUser[]) {
            if (!seen.has(u.id)) { seen.add(u.id); all.push(u); }
        }
    }

    return all;
}

// POST: Preview — match CSV entries against existing users
export async function POST(req: NextRequest) {
    if (!await checkAdminAuth(req)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { entries } = await req.json();

        if (!entries?.length) {
            return NextResponse.json({ error: '데이터가 없습니다.' }, { status: 400 });
        }

        const haengbunList = Array.from(new Set(
            entries.map((e: any) => (e.haengbun || '').trim()).filter(Boolean)
        )) as string[];
        const phoneList = Array.from(new Set(
            entries
                .filter((e: any) => !(e.haengbun || '').trim() && e.phone)
                .map((e: any) => normalizePhone(e.phone))
                .filter(Boolean)
        )) as string[];

        const users = await fetchMatchingUsers(haengbunList, phoneList);

        const userMap = new Map<string, ExistingUser>();
        for (const u of users) {
            if (u.haengbun) userMap.set(`hb|${u.haengbun.trim()}`, u);
            if (u.phone) userMap.set(`ph|${u.name}|${normalizePhone(u.phone)}`, u);
        }

        const results = entries.map((entry: any) => {
            const cleanHaengbun = (entry.haengbun || '').trim();
            const cleanPhone = normalizePhone(entry.phone || '');
            const cleanName = (entry.name || '').trim();
            const matched = cleanHaengbun
                ? userMap.get(`hb|${cleanHaengbun}`)
                : userMap.get(`ph|${cleanName}|${cleanPhone}`);

            return {
                name: cleanName,
                phone: cleanPhone,
                tracking_number: (entry.tracking_number || '').trim(),
                shipping_carrier: (entry.shipping_carrier || 'CJ대한통운').trim(),
                matched: !!matched,
                userId: matched?.id || null,
                currentStatus: matched?.shipping_status || null,
                alreadyHasTracking: !!matched?.tracking_number,
                existingTracking: matched?.tracking_number || null,
            };
        });

        const matchedCount = results.filter((r: any) => r.matched).length;
        const notFoundCount = results.filter((r: any) => !r.matched).length;
        const alreadyHasTrackingCount = results.filter((r: any) => r.alreadyHasTracking).length;

        return NextResponse.json({
            results,
            summary: {
                total: results.length,
                matched: matchedCount,
                notFound: notFoundCount,
                alreadyHasTracking: alreadyHasTrackingCount,
            },
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// PUT: Apply — update tracking numbers for matched users
export async function PUT(req: NextRequest) {
    if (!await checkAdminAuth(req)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { matches } = await req.json();

        if (!matches?.length) {
            return NextResponse.json({ error: '적용할 데이터가 없습니다.' }, { status: 400 });
        }

        let updatedCount = 0;
        const errors: string[] = [];
        const now = new Date().toISOString();

        const valid = matches.filter((m: any) => {
            if (!m.userId || !m.tracking_number) {
                errors.push(`${m.name || m.userId}: 필수 데이터 누락`);
                return false;
            }
            return true;
        });

        // Vercel 10s 타임아웃 회피 — 50건 청크로 병렬 update
        for (const c of chunk(valid, 50)) {
            const settled = await Promise.all(c.map(async (m: any) => {
                const { error } = await supabaseAdmin
                    .from('magic_frame_users')
                    .update({
                        tracking_number: m.tracking_number,
                        shipping_carrier: m.shipping_carrier || 'CJ대한통운',
                        shipping_status: 'shipped',
                        submitted: true,  // 발송완료 탭 노출 보장
                        shipped_at: now,
                        updated_at: now,
                    })
                    .eq('id', m.userId);
                return { name: m.name || m.userId, error };
            }));
            for (const r of settled) {
                if (r.error) errors.push(`${r.name}: ${r.error.message}`);
                else updatedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            applied: updatedCount,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
