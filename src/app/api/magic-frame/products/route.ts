import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { MAGIC_FRAME_PRODUCTS } from '@/lib/magic-frame-config';

// GET: Public — list active products
export async function GET() {
    try {
        const { data: products, error } = await supabaseAdmin
            .from('magic_frame_products')
            .select('id, name, description, price, emoji, image_url, detail_url')
            .eq('active', true)
            .order('sort_order', { ascending: true });

        if (error) {
            // Fallback to hardcoded if table doesn't exist yet
            console.warn('Products table error, using fallback:', error.message);
            return NextResponse.json({ products: MAGIC_FRAME_PRODUCTS });
        }

        // Fallback if table is empty
        if (!products?.length) {
            return NextResponse.json({ products: MAGIC_FRAME_PRODUCTS });
        }

        return NextResponse.json({ products });
    } catch {
        return NextResponse.json({ products: MAGIC_FRAME_PRODUCTS });
    }
}
