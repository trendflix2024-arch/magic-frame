import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

function isAdmin(email: string | null | undefined) {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
}

// GET: List submitted users
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const sort = url.searchParams.get('sort') || 'recent'; // recent | name

    let query = supabase
        .from('magic_frame_users')
        .select('id, name, phone, submitted, image_url, image_type, updated_at, created_at');

    if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
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

// PATCH: Reset user submission (allow re-submit)
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { userId } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
        }

        // Check shipping status — only allow reset at 사진접수(pending) stage
        const { data: user, error: fetchError } = await supabase
            .from('magic_frame_users')
            .select('submitted, shipping_status')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
        }

        if (user.shipping_status && user.shipping_status !== 'pending') {
            return NextResponse.json({ error: '제작중 이후 단계에서는 재제출을 허용할 수 없습니다.' }, { status: 400 });
        }

        const { error } = await supabase
            .from('magic_frame_users')
            .update({
                submitted: false,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// DELETE: Delete user record entirely
export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { userId } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
        }

        // Get user info to delete storage file
        const { data: user } = await supabase
            .from('magic_frame_users')
            .select('name, phone')
            .eq('id', userId)
            .single();

        if (user) {
            const filename = `${user.name}_${user.phone}.jpg`;
            await supabase.storage.from('magic-frame').remove([filename]);
        }

        const { error } = await supabase
            .from('magic_frame_users')
            .delete()
            .eq('id', userId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
