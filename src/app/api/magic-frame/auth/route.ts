import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isMarketSource } from '@/lib/magic-frame-sources';

const ADMIN_NAME = (process.env.ADMIN_NAME || '').trim();
const ADMIN_PHONE = (process.env.ADMIN_PHONE || '').replace(/[^0-9]/g, '');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

const SOURCES_PATH = 'user-sources.json';

async function recordSource(userId: string, source: string) {
    try {
        const { data } = await supabaseAdmin.storage.from('magic-frame').download(SOURCES_PATH);
        const map: Record<string, string> = data ? JSON.parse(await data.text()) : {};
        map[userId] = source;
        await supabaseAdmin.storage.from('magic-frame').upload(
            SOURCES_PATH,
            Buffer.from(JSON.stringify(map)),
            { contentType: 'application/json', upsert: true }
        );
    } catch { /* non-critical */ }
}

export async function POST(req: NextRequest) {
    try {
        const { name, haengbun, phone, source = 'gajeong' } = await req.json();
        const cleanName = name?.trim() || '';

        if (!cleanName) {
            return NextResponse.json({ error: '이름을 입력해 주세요.' }, { status: 400 });
        }

        // Phone-based auth (market buyers — auto-register if not found)
        if (phone) {
            if (!isMarketSource(source)) {
                return NextResponse.json({ error: '구매처를 선택해 주세요.' }, { status: 400 });
            }
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            if (cleanPhone.length < 10) {
                return NextResponse.json({ error: '올바른 연락처를 입력해 주세요.' }, { status: 400 });
            }

            const { data: existing } = await supabase
                .from('magic_frame_users')
                .select('id, submitted, updated_at')
                .eq('name', cleanName)
                .eq('phone', cleanPhone)
                .single();

            if (existing) {
                await recordSource(existing.id, source);
                if (existing.submitted) {
                    return NextResponse.json({
                        submitted: true, userId: existing.id, updatedAt: existing.updated_at,
                    }, { status: 200 });
                }
                return NextResponse.json({ userId: existing.id, submitted: false });
            }

            const { data: created, error: insertError } = await supabaseAdmin
                .from('magic_frame_users')
                .insert({
                    name: cleanName,
                    phone: cleanPhone,
                    submitted: false,
                    shipping_status: 'pending',
                })
                .select('id')
                .single();

            if (insertError || !created) {
                return NextResponse.json({ error: '사용자 등록 중 오류가 발생했습니다.' }, { status: 500 });
            }

            await recordSource(created.id, source);
            return NextResponse.json({ userId: created.id, submitted: false });
        }

        // Haengbun-based auth (gajeong / admin)
        if (!haengbun?.trim()) {
            return NextResponse.json({ error: '이름과 행번을 입력해 주세요.' }, { status: 400 });
        }

        const cleanHaengbun = haengbun.trim();

        // Check admin credentials (ADMIN_PHONE env var serves as the admin's haengbun)
        if (ADMIN_NAME && ADMIN_PHONE && cleanName === ADMIN_NAME && cleanHaengbun === ADMIN_PHONE) {
            return NextResponse.json({ isAdmin: true, adminToken: ADMIN_TOKEN });
        }

        // Check if user exists by name + haengbun
        const { data: existing } = await supabase
            .from('magic_frame_users')
            .select('id, submitted, image_url, updated_at')
            .eq('name', cleanName)
            .eq('haengbun', cleanHaengbun)
            .single();

        if (!existing) {
            return NextResponse.json({
                error: '등록되지 않은 사용자입니다. 관리자에게 문의해주세요.',
            }, { status: 404 });
        }

        // Record source (non-blocking)
        await recordSource(existing.id, source);

        if (existing.submitted) {
            return NextResponse.json({
                submitted: true,
                userId: existing.id,
                updatedAt: existing.updated_at,
                message: '사진이 확정되어 제작 중에 있습니다. 사진 변경을 원하시면 이메일로 문의해 주세요.',
            }, { status: 200 });
        }

        return NextResponse.json({ userId: existing.id, submitted: false });
    } catch (e: any) {
        console.error('auth route error:', e);
        return NextResponse.json({ error: '인증 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
