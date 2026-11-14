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
    shipping_status: string | null;
    address: string | null;
    submitted: boolean;
};

// Fetch existing users that match any haengbun OR phone in the file.
// Avoids the PostgREST 1000-row default cap by querying the targeted set in chunks.
async function fetchMatchingUsers(haengbuns: string[], phones: string[]): Promise<ExistingUser[]> {
    const all: ExistingUser[] = [];
    const seenIds = new Set<string>();
    const SELECT = 'id, name, haengbun, phone, shipping_status, address, submitted';

    for (const c of chunk(haengbuns, 500)) {
        if (c.length === 0) continue;
        const { data, error } = await supabaseAdmin
            .from('magic_frame_users')
            .select(SELECT)
            .in('haengbun', c);
        if (error) throw new Error(error.message);
        for (const u of (data || []) as ExistingUser[]) {
            if (!seenIds.has(u.id)) { seenIds.add(u.id); all.push(u); }
        }
    }

    for (const c of chunk(phones, 500)) {
        if (c.length === 0) continue;
        const { data, error } = await supabaseAdmin
            .from('magic_frame_users')
            .select(SELECT)
            .in('phone', c);
        if (error) throw new Error(error.message);
        for (const u of (data || []) as ExistingUser[]) {
            if (!seenIds.has(u.id)) { seenIds.add(u.id); all.push(u); }
        }
    }

    return all;
}

// POST: Preview CSV import — match entries against existing users
export async function POST(req: NextRequest) {
    if (!await checkAdminAuth(req)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { entries } = await req.json();

        if (!entries?.length) {
            return NextResponse.json({ error: '데이터가 없습니다.' }, { status: 400 });
        }

        // A: dedupe haengbun within the file — keep first occurrence, skip rest
        const seenHaengbun = new Set<string>();
        const dedupedEntries: any[] = [];
        let skippedDuplicates = 0;
        for (const entry of entries) {
            const hb = (entry.haengbun || '').trim();
            if (hb && seenHaengbun.has(hb)) {
                skippedDuplicates++;
                continue;
            }
            if (hb) seenHaengbun.add(hb);
            dedupedEntries.push(entry);
        }

        // Targeted query: only fetch DB rows whose haengbun/phone appear in the file
        const haengbunList = Array.from(new Set(
            dedupedEntries.map(e => (e.haengbun || '').trim()).filter(Boolean)
        ));
        const phoneList = Array.from(new Set(
            dedupedEntries
                .filter(e => !(e.haengbun || '').trim() && e.phone)
                .map(e => normalizePhone(e.phone))
                .filter(Boolean)
        ));

        const users = await fetchMatchingUsers(haengbunList, phoneList);

        // Build lookup map: haengbun key (primary) + name|phone key (fallback)
        const userMap = new Map<string, ExistingUser>();
        for (const u of users) {
            if (u.haengbun) {
                userMap.set(`hb|${u.haengbun.trim()}`, u);
            }
            if (u.phone) {
                userMap.set(`ph|${u.name}|${normalizePhone(u.phone)}`, u);
            }
        }

        // C: skip rows where DB has same haengbun but different name (potential takeover)
        const conflictDetails: string[] = [];
        const safeEntries = dedupedEntries.filter((entry: any) => {
            const hb = (entry.haengbun || '').trim();
            const name = (entry.name || '').trim();
            if (!hb || !name) return true;
            const dbUser = userMap.get(`hb|${hb}`);
            if (dbUser && dbUser.name.trim() !== name) {
                conflictDetails.push(`행번 ${hb} (엑셀: ${name}, 기존: ${dbUser.name})`);
                return false;
            }
            return true;
        });
        const skippedConflicts = conflictDetails.length;

        // D: skip rows where DB already has this haengbun (or name+phone) — only insert truly new entries
        let skippedExisting = 0;
        const results = safeEntries
            .map((entry: any) => {
                const cleanHaengbun = (entry.haengbun || '').trim();
                const cleanName = (entry.name || '').trim();
                const cleanPhone = normalizePhone(entry.phone || '');

                const matched = cleanHaengbun
                    ? userMap.get(`hb|${cleanHaengbun}`)
                    : userMap.get(`ph|${cleanName}|${cleanPhone}`);

                if (matched) {
                    skippedExisting++;
                    return null;
                }

                return {
                    name: cleanName,
                    haengbun: cleanHaengbun,
                    phone: cleanPhone,
                    address: (entry.address || '').trim(),
                    postal_code: (entry.postal_code || '').trim(),
                    address_detail: (entry.address_detail || '').trim(),
                    matched: false,
                    isNew: true,
                    userId: null,
                    currentStatus: null,
                    alreadyHasAddress: false,
                };
            })
            .filter((r: any) => r !== null);

        return NextResponse.json({
            results,
            summary: {
                total: results.length,
                matched: 0,
                newUsers: results.length,
                skippedDuplicates,
                skippedExisting,
                skippedConflicts,
                conflicts: conflictDetails,
            },
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// PUT: Confirm import — bulk insert new entries (and update existing if any)
export async function PUT(req: NextRequest) {
    if (!await checkAdminAuth(req)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { matches } = await req.json();

        if (!matches?.length) {
            return NextResponse.json({ error: '적용할 데이터가 없습니다.' }, { status: 400 });
        }

        const errors: string[] = [];
        let createdCount = 0;
        let updatedCount = 0;

        // Split: new (bulk INSERT) vs existing (per-row UPDATE)
        const newRows: any[] = [];
        const updates: any[] = [];

        for (const m of matches) {
            const { userId, name, haengbun, phone, address, postal_code, address_detail, isNew } = m;
            if (isNew) {
                if (!name || !haengbun) {
                    errors.push(`${name || '이름없음'}: 필수 데이터 누락 (성함, 행번 필요)`);
                    continue;
                }
                newRows.push({
                    name: String(name).trim(),
                    haengbun: String(haengbun).trim(),
                    phone: normalizePhone(phone || '') || null,
                    address: address || null,
                    postal_code: postal_code || null,
                    address_detail: address_detail || null,
                    submitted: false,
                    shipping_status: 'pending',
                });
            } else {
                if (!userId) {
                    errors.push(`${name || userId}: userId 누락`);
                    continue;
                }
                const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
                if (phone) updateData.phone = normalizePhone(phone);
                if (address) {
                    updateData.address = address;
                    updateData.postal_code = postal_code || null;
                    updateData.address_detail = address_detail || null;
                }
                updates.push({ userId, name, updateData });
            }
        }

        // Bulk INSERT in chunks of 500 — avoids per-row latency that caused timeout at ~1100 rows
        for (const c of chunk(newRows, 500)) {
            const { data, error } = await supabaseAdmin
                .from('magic_frame_users')
                .insert(c)
                .select('id');
            if (error) {
                errors.push(`bulk insert (${c.length}건): ${error.message}`);
            } else {
                createdCount += data?.length ?? 0;
            }
        }

        for (const u of updates) {
            const { error } = await supabaseAdmin
                .from('magic_frame_users')
                .update(u.updateData)
                .eq('id', u.userId);
            if (error) errors.push(`${u.name || u.userId}: ${error.message}`);
            else updatedCount++;
        }

        return NextResponse.json({
            success: true,
            applied: updatedCount + createdCount,
            created: createdCount,
            updated: updatedCount,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
