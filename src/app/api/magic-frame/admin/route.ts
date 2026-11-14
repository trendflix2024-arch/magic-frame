import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkAdminAuth } from '@/lib/admin-auth';
import { photoPathFromUrl } from '@/lib/magic-frame-photo-path';


// GET: List submitted users
export async function GET(req: NextRequest) {
    if (!await checkAdminAuth(req)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const sort = url.searchParams.get('sort') || 'recent'; // recent | name

    let query = supabaseAdmin
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
    if (!await checkAdminAuth(req)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { userId } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
        }

        // Check shipping status — only allow reset at 사진접수(pending) stage
        const { data: user, error: fetchError } = await supabaseAdmin
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

        const { error } = await supabaseAdmin
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
    if (!await checkAdminAuth(req)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { userId } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
        }

        // Get user info to delete storage file
        const { data: user } = await supabaseAdmin
            .from('magic_frame_users')
            .select('name, phone, image_url')
            .eq('id', userId)
            .single();

        // 사진은 DB 에 저장된 주소의 경로로 지운다. 예전 형식(`${userId}.jpg`, 이름_전화번호.jpg)도 함께 지운다.
        const files = [`${userId}.jpg`];
        const currentPath = photoPathFromUrl(user?.image_url);
        if (currentPath && !files.includes(currentPath)) files.push(currentPath);
        if (user) files.push(`${user.name}_${user.phone}.jpg`);
        await supabaseAdmin.storage.from('magic-frame').remove(files);

        const { error } = await supabaseAdmin
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
