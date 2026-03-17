import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

function isAdmin(email: string | null | undefined) {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
}

function normalizePhone(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
}

// POST: Preview — match CSV entries against existing users
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (process.env.NODE_ENV !== 'development' && !isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { entries } = await req.json();

        if (!entries?.length) {
            return NextResponse.json({ error: '데이터가 없습니다.' }, { status: 400 });
        }

        const { data: users, error } = await supabaseAdmin
            .from('magic_frame_users')
            .select('id, name, phone, tracking_number, shipping_carrier, shipping_status');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const userMap = new Map<string, typeof users[0]>();
        for (const u of users || []) {
            const key = `${u.name}|${normalizePhone(u.phone)}`;
            userMap.set(key, u);
        }

        const results = entries.map((entry: any) => {
            const cleanPhone = normalizePhone(entry.phone || '');
            const cleanName = (entry.name || '').trim();
            const key = `${cleanName}|${cleanPhone}`;
            const matched = userMap.get(key);

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
    const session = await getServerSession(authOptions);
    if (process.env.NODE_ENV !== 'development' && !isAdmin(session?.user?.email)) {
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

        for (const match of matches) {
            const { userId, tracking_number, shipping_carrier } = match;

            if (!userId || !tracking_number) {
                errors.push(`${match.name || userId}: 필수 데이터 누락`);
                continue;
            }

            const { error } = await supabaseAdmin
                .from('magic_frame_users')
                .update({
                    tracking_number,
                    shipping_carrier: shipping_carrier || 'CJ대한통운',
                    shipping_status: 'shipped',
                    shipped_at: now,
                    updated_at: now,
                })
                .eq('id', userId);

            if (error) {
                errors.push(`${match.name || userId}: ${error.message}`);
            } else {
                updatedCount++;
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
