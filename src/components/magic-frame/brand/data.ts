export const PHOTOS = {
    couple1: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80',
    couple2: 'https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=600&q=80',
    couple3: 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=600&q=80',
    couple4: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80',
    couple5: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&q=80',
    couple6: 'https://images.unsplash.com/photo-1521543387283-cf76e0f5d9d5?w=600&q=80',
    family1: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&q=80',
    family2: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=600&q=80',
    family3: 'https://images.unsplash.com/photo-1604881991720-f91add269bed?w=600&q=80',
} as const;

export type FrameSizeId = 'S' | 'M' | 'L';
export type FrameColorId = 'natural' | 'walnut' | 'black' | 'white';
export type FinishId = 'matte' | 'glossy';

export const FRAME_SIZES: { id: FrameSizeId; label: string; dims: string; price: number; w: number; h: number }[] = [
    { id: 'S', label: 'S 8×10',  dims: '20 × 25cm', price: 38000, w: 160, h: 200 },
    { id: 'M', label: 'M 11×14', dims: '28 × 36cm', price: 52000, w: 200, h: 260 },
    { id: 'L', label: 'L 16×20', dims: '40 × 50cm', price: 78000, w: 240, h: 320 },
];

export const FRAME_COLORS: { id: FrameColorId; label: string; swatch: string }[] = [
    { id: 'natural', label: '내추럴', swatch: '#c9a87a' },
    { id: 'walnut',  label: '월넛',   swatch: '#6b4a2e' },
    { id: 'black',   label: '블랙',   swatch: '#1a1414' },
    { id: 'white',   label: '화이트', swatch: '#f5f1ea' },
];

export const FINISHES: { id: FinishId; label: string }[] = [
    { id: 'matte',  label: '매트' },
    { id: 'glossy', label: '유광' },
];

export type FontId = 'pretendard' | 'gowun' | 'nanum';

export const FONT_OPTIONS: { value: FontId; label: string }[] = [
    { value: 'pretendard', label: 'Pretendard' },
    { value: 'gowun',      label: 'Gowun Dodum' },
    { value: 'nanum',      label: 'Nanum Pen' },
];

export const FONT_FAMILIES: Record<FontId, string> = {
    pretendard: '"Pretendard", "Pretendard Variable", system-ui, sans-serif',
    gowun:      '"Gowun Dodum", "Pretendard", system-ui, sans-serif',
    nanum:      '"Nanum Pen Script", "Gowun Dodum", "Pretendard", cursive',
};

export function findSize(id: FrameSizeId | string) {
    return FRAME_SIZES.find(s => s.id === id) ?? FRAME_SIZES[1];
}
export function findColor(id: FrameColorId | string) {
    return FRAME_COLORS.find(c => c.id === id) ?? FRAME_COLORS[0];
}

export function calcPricing(opts: { frameSize: FrameSizeId | string; qty: number; finish: FinishId | string }) {
    const size = findSize(opts.frameSize);
    const subtotal = size.price * opts.qty;
    const finishFee = opts.finish === 'glossy' ? 4000 * opts.qty : 0;
    const shipping = subtotal + finishFee >= 60000 ? 0 : 3000;
    const total = subtotal + finishFee + shipping;
    return { unit: size.price, subtotal, finishFee, shipping, total };
}

export function fmtKRW(n: number) {
    return n.toLocaleString('ko-KR') + '원';
}
