export const KAKAO_CHANNEL_URL = 'http://pf.kakao.com/_aGLExj/chat';
export const SUPPORT_EMAIL = 'fms211215@gmail.com';

// ── 함께 배송 가능한 상품 ──

export interface MagicFrameProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    emoji: string;
    image_url?: string | null;
    detail_url?: string | null;
}

export const MAGIC_FRAME_PRODUCTS: MagicFrameProduct[] = [
    { id: 'stand', name: '액자 거치대', description: '매직액자와 딱 맞는 원목 거치대', price: 12000, emoji: '🪵' },
    { id: 'photocard-set', name: '포토카드 세트', description: '내 사진으로 만드는 포토카드 4장', price: 8000, emoji: '🃏' },
    { id: 'gift-box', name: '선물 포장 세트', description: '리본 + 메시지 카드 + 고급 박스', price: 5000, emoji: '🎁' },
    { id: 'cleaning-kit', name: '액자 관리 키트', description: '극세사 천 + 전용 클리너', price: 6000, emoji: '✨' },
];

// ── 택배사 목록 ──

export const SHIPPING_CARRIERS = [
    'CJ대한통운', '한진택배', '로젠택배', '우체국택배', '롯데택배', '경동택배',
];

// ── 택배사별 배송조회 URL ──

export const TRACKING_URLS: Record<string, string> = {
    'CJ대한통운': 'https://trace.cjlogistics.com/next/tracking.html?wblNo=',
    '한진택배': 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mession_type=1&wblnumText2=',
    '로젠택배': 'https://www.ilogen.com/web/personal/trace/',
    '우체국택배': 'https://service.epost.go.kr/trace.RetrieveDomRi498.postal?sid1=',
    '롯데택배': 'https://www.lotteglogis.com/home/reservation/tracking/link?InvNo=',
    '경동택배': 'https://kdexp.com/basicNew.kd?barcode=',
};

// 서버 사이드 금액 검증용
export const PRODUCT_PRICES: Record<string, number> = Object.fromEntries(
    MAGIC_FRAME_PRODUCTS.map(p => [p.id, p.price])
);
