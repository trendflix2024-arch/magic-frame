import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

function isAdmin(email: string | null | undefined) {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
}

// GET: All products (including inactive)
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: products, error } = await supabaseAdmin
        .from('magic_frame_products')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: products || [] });
}

// POST: Create new product
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { id, name, description, price, emoji, active, sort_order, image_url, detail_url } = await req.json();

        if (!id?.trim() || !name?.trim() || !price) {
            return NextResponse.json({ error: 'ID, 이름, 가격은 필수입니다.' }, { status: 400 });
        }

        const { error } = await supabaseAdmin.from('magic_frame_products').insert({
            id: id.trim(),
            name: name.trim(),
            description: (description || '').trim(),
            price: Number(price),
            emoji: emoji || '📦',
            active: active !== false,
            sort_order: sort_order ?? 0,
            image_url: image_url || null,
            detail_url: detail_url || null,
        });

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: '이미 존재하는 상품 ID입니다.' }, { status: 400 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// PATCH: Update product
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { id, ...updates } = await req.json();

        if (!id) {
            return NextResponse.json({ error: '상품 ID가 필요합니다.' }, { status: 400 });
        }

        const allowedFields = ['name', 'description', 'price', 'emoji', 'active', 'sort_order', 'image_url', 'detail_url'];
        const updateData: Record<string, any> = {};

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                updateData[field] = field === 'price' ? Number(updates[field]) : updates[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: '업데이트할 데이터가 없습니다.' }, { status: 400 });
        }

        updateData.updated_at = new Date().toISOString();

        const { error } = await supabaseAdmin
            .from('magic_frame_products')
            .update(updateData)
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// DELETE: Remove product
export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: '상품 ID가 필요합니다.' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('magic_frame_products')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
