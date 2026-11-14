import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isMarketSource } from '@/lib/magic-frame-sources';

const ADMIN_NAME = (process.env.ADMIN_NAME || '').trim();
const ADMIN_PHONE = (process.env.ADMIN_PHONE || '').replace(/[^0-9]/g, '');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// 구매처는 magic_frame_users.source 컬럼에 저장한다. 다시 로그인하면 마지막에 고른 구매처로 바뀐다.
// 실패해도 로그인은 막지 않는다.
async function recordSource(userId: string, source: string) {
    try {
        await supabaseAdmin.from('magic_frame_users').update({ source }).eq('id', userId);
    } catch { /* non-critical */ }
}

export async function POST(req: NextRequest) {
    try {
        const { name, haengbun, phone, source } = await req.json();
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
                    source,
                    submitted: false,
                    shipping_status: 'pending',
                })
                .select('id')
                .single();

            if (insertError || !created) {
                return NextResponse.json({ error: '사용자 등록 중 오류가 발생했습니다.' }, { status: 500 });
            }

            return NextResponse.json({ userId: created.id, submitted: false });
        }

        // 관리자 로그인 (AdminLoginForm). 가정의 달 종료로 고객용 행번 로그인은 없다.
        // 관리자 번호는 예전 필드명 그대로 haengbun 으로 받고, ADMIN_PHONE 환경변수와 비교한다.
        const adminCode = typeof haengbun === 'string' ? haengbun.trim() : '';
        if (!adminCode) {
            return NextResponse.json({ error: '구매처와 연락처를 입력해 주세요.' }, { status: 400 });
        }

        if (ADMIN_NAME && ADMIN_PHONE && cleanName === ADMIN_NAME && adminCode === ADMIN_PHONE) {
            return NextResponse.json({ isAdmin: true, adminToken: ADMIN_TOKEN });
        }

        return NextResponse.json({ error: '관리자 정보가 올바르지 않습니다.' }, { status: 401 });
    } catch (e: any) {
        console.error('auth route error:', e);
        return NextResponse.json({ error: '인증 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
