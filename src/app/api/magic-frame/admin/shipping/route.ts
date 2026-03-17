import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

function isAdmin(email: string | null | undefined) {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
}

const SHIPPING_COLUMNS = 'id, name, phone, submitted, image_url, image_type, updated_at, created_at, shipping_status, address, postal_code, address_detail, tracking_number, shipping_carrier, shipping_memo, shipped_at';

// GET: List submitted users with shipping data
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || 'all';
    const sort = url.searchParams.get('sort') || 'recent';

    let query = supabaseAdmin
        .from('magic_frame_users')
        .select(SHIPPING_COLUMNS)
        .eq('submitted', true);

    if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (status !== 'all') {
        query = query.eq('shipping_status', status);
    }

    if (sort === 'name') {
        query = query.order('name', { ascending: true });
    } else {
        query = query.order('updated_at', { ascending: false, nullsFirst: false });
    }

    const { data: users, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
}

// PATCH: Update shipping info for a single user
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { userId, ...updates } = body;

        if (!userId) {
            return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
        }

        const allowedFields = ['shipping_status', 'tracking_number', 'shipping_carrier', 'shipping_memo', 'address', 'postal_code', 'address_detail'];
        const updateData: Record<string, any> = {};

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                updateData[field] = updates[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: '업데이트할 데이터가 없습니다.' }, { status: 400 });
        }

        // Auto-set shipped_at when transitioning to shipped
        if (updateData.shipping_status === 'shipped') {
            updateData.shipped_at = new Date().toISOString();
        }

        updateData.updated_at = new Date().toISOString();

        const { error } = await supabaseAdmin
            .from('magic_frame_users')
            .update(updateData)
            .eq('id', userId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
