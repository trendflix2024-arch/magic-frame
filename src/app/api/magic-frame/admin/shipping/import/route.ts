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

// POST: Preview CSV import — match entries against existing users
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { entries } = await req.json();

        if (!entries?.length) {
            return NextResponse.json({ error: '데이터가 없습니다.' }, { status: 400 });
        }

        // Fetch all users (not just submitted)
        const { data: users, error } = await supabaseAdmin
            .from('magic_frame_users')
            .select('id, name, phone, shipping_status, address, submitted');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Build lookup map: normalized "name|phone" → user
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
                address: (entry.address || '').trim(),
                postal_code: (entry.postal_code || '').trim(),
                address_detail: (entry.address_detail || '').trim(),
                matched: !!matched,
                isNew: !matched,
                userId: matched?.id || null,
                currentStatus: matched?.shipping_status || null,
                alreadyHasAddress: !!matched?.address,
            };
        });

        const matchedCount = results.filter((r: any) => r.matched).length;
        const newCount = results.filter((r: any) => r.isNew).length;

        return NextResponse.json({
            results,
            summary: {
                total: results.length,
                matched: matchedCount,
                newUsers: newCount,
            },
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// PUT: Confirm import — apply matched addresses
export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { matches } = await req.json();

        if (!matches?.length) {
            return NextResponse.json({ error: '적용할 데이터가 없습니다.' }, { status: 400 });
        }

        let updatedCount = 0;
        let createdCount = 0;
        const errors: string[] = [];

        for (const match of matches) {
            const { userId, name, phone, address, postal_code, address_detail, isNew } = match;

            if (isNew) {
                // Create new user
                if (!name || !phone) {
                    errors.push(`${name || '이름없음'}: 필수 데이터 누락`);
                    continue;
                }
                const { error } = await supabaseAdmin
                    .from('magic_frame_users')
                    .insert({
                        name: name.trim(),
                        phone: normalizePhone(phone),
                        address: address || null,
                        postal_code: postal_code || null,
                        address_detail: address_detail || null,
                        submitted: false,
                        shipping_status: 'pending',
                    });

                if (error) {
                    errors.push(`${name}: ${error.message}`);
                } else {
                    createdCount++;
                }
            } else {
                // Update existing user
                if (!userId) {
                    errors.push(`${name || userId}: userId 누락`);
                    continue;
                }

                const updateData: Record<string, any> = {
                    updated_at: new Date().toISOString(),
                };
                if (address) {
                    updateData.address = address;
                    updateData.postal_code = postal_code || null;
                    updateData.address_detail = address_detail || null;
                }

                const { error } = await supabaseAdmin
                    .from('magic_frame_users')
                    .update(updateData)
                    .eq('id', userId);

                if (error) {
                    errors.push(`${name || userId}: ${error.message}`);
                } else {
                    updatedCount++;
                }
            }
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
