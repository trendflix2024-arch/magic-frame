// 구매처(출처) 목록 — 로그인 화면 선택칸, 서버 검증, 관리자 필터가 모두 여기서 읽는다.
// 새 구매처는 MARKET_SOURCES 에 한 줄 추가하면 된다. key 는 user-sources.json 에 저장되므로 바꾸지 말 것.

export interface SourceOption {
    key: string;
    label: string;
    badge: string; // 관리자 주문 카드 배지 클래스
}

const DEFAULT_BADGE = 'bg-slate-100 text-slate-600';

// 이름+연락처로 로그인하는 구매처 (market-login)
export const MARKET_SOURCES: SourceOption[] = [
    { key: 'naver',   label: '네이버',         badge: 'bg-green-100 text-green-700' },
    { key: 'coupang', label: '쿠팡',           badge: 'bg-orange-100 text-orange-600' },
    { key: 'lotteon', label: '롯데온',         badge: DEFAULT_BADGE },
    { key: '11st',    label: '11번가',         badge: DEFAULT_BADGE },
    { key: 'gmarket', label: 'G마켓',          badge: DEFAULT_BADGE },
    { key: 'auction', label: '옥션',           badge: DEFAULT_BADGE },
    { key: 'kakao',   label: '카카오쇼핑',     badge: DEFAULT_BADGE },
    { key: 'ohou',    label: '오늘의집',       badge: DEFAULT_BADGE },
    { key: 'direct',  label: '전화·문자 주문', badge: DEFAULT_BADGE },
    { key: 'etc',     label: '기타',           badge: DEFAULT_BADGE },
];

const SOURCE_BY_KEY = new Map(MARKET_SOURCES.map(s => [s.key, s]));

export function getSource(key: string | null | undefined): SourceOption | null {
    return key ? SOURCE_BY_KEY.get(key) ?? null : null;
}

export function isMarketSource(key: unknown): key is string {
    return typeof key === 'string' && MARKET_SOURCES.some(s => s.key === key);
}
