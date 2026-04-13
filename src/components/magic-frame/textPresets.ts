export const FONTS = [
    { label: '주아', value: "'Jua', sans-serif" },
    { label: '도현', value: "'Do Hyeon', sans-serif" },
    { label: '본고딕', value: "'Noto Sans KR', sans-serif" },
    { label: '본명조', value: "'Noto Serif KR', serif" },
    { label: '블랙한산스', value: "'Black Han Sans', sans-serif" },
    { label: '나눔펜', value: "'Nanum Pen Script', cursive" },
    { label: '나눔붓', value: "'Nanum Brush Script', cursive" },
    { label: '고운바탕', value: "'Gowun Batang', serif" },
    { label: '하이멜로디', value: "'Hi Melody', cursive" },
    { label: '동해독도', value: "'East Sea Dokdo', cursive" },
    { label: '푸어스토리', value: "'Poor Story', cursive" },
    { label: '연성', value: "'Yeon Sung', cursive" },
];

export const DEFAULT_FONT = FONTS[0].value;

export const TEXT_COLORS = [
    { label: '화이트', value: '#FFFFFF' },
    { label: '블랙', value: '#000000' },
    { label: '레드', value: '#EF4444' },
    { label: '옐로우', value: '#FACC15' },
];

interface TextPreset { label: string; content: string }
interface PresetGroup { category: string; items: TextPreset[] }

export const TEXT_PRESETS: PresetGroup[] = [
    { category: '💐 가정의 달 (5월)', items: [
        { label: '어버이날 - 사랑합니다 부모님', content: '사랑합니다 부모님 💐' },
        { label: '어버이날 - 늘 감사합니다', content: '늘 감사합니다' },
        { label: '어버이날 - 오래오래 건강하세요', content: '오래오래 건강하세요' },
        { label: '어버이날 - 낳아주셔서 감사합니다', content: '낳아주셔서 감사합니다' },
        { label: '어버이날 - 엄마 아빠 사랑해요', content: '엄마 아빠 사랑해요' },
        { label: '어버이날 - Thanks Mom & Dad', content: 'Thanks Mom & Dad' },
        { label: '어린이날 - 사랑하는 우리 아이', content: '사랑하는 우리 아이 💕' },
        { label: '어린이날 - 행복하게 자라렴', content: '행복하게 자라렴' },
        { label: "어린이날 - Happy Children's Day", content: "Happy Children's Day" },
        { label: '스승의날 - 감사합니다 선생님', content: '감사합니다 선생님 🌹' },
        { label: '스승의날 - 스승의 은혜', content: '스승의 은혜는 하늘 같아서' },
        { label: '부부의날 - 영원히 함께', content: '영원히 함께 💑' },
    ]},
    { category: '🎂 생일', items: [
        { label: '생일 축하해', content: '생일 축하해 🎉' },
        { label: 'Happy Birthday', content: 'Happy Birthday' },
        { label: '행복한 생일 되세요', content: '행복한 생일 되세요' },
        { label: '축 생일', content: '축 생일' },
    ]},
    { category: '💕 사랑/연인', items: [
        { label: '사랑해', content: '사랑해' },
        { label: 'I Love You', content: 'I Love You' },
        { label: '영원히 함께', content: '영원히 함께' },
        { label: 'Forever Together', content: 'Forever Together' },
        { label: '우리의 기억', content: '우리의 기억' },
    ]},
    { category: '💍 결혼/웨딩', items: [
        { label: 'Just Married', content: 'Just Married' },
        { label: '결혼을 축하합니다', content: '결혼을 축하합니다' },
        { label: '축 결혼', content: '축 결혼' },
        { label: 'Our Wedding Day', content: 'Our Wedding Day' },
    ]},
    { category: '👨‍👩‍👧 가족', items: [
        { label: 'Our Family', content: 'Our Family' },
        { label: '우리 가족', content: '우리 가족' },
        { label: '소중한 우리', content: '소중한 우리' },
        { label: 'Home Sweet Home', content: 'Home Sweet Home' },
    ]},
    { category: '🤝 친구/우정', items: [
        { label: 'Best Friends', content: 'Best Friends' },
        { label: '영원한 우정', content: '영원한 우정' },
        { label: '함께라서 행복해', content: '함께라서 행복해' },
    ]},
    { category: '🍼 아이/돌·백일', items: [
        { label: '축 백일', content: '축 백일' },
        { label: '축 첫돌', content: '축 첫돌' },
        { label: 'Welcome Baby', content: 'Welcome Baby' },
        { label: 'Our Little One', content: 'Our Little One' },
    ]},
    { category: '🎓 졸업/입학', items: [
        { label: '축 졸업', content: '축 졸업' },
        { label: 'Congratulations', content: 'Congratulations' },
        { label: '새로운 시작', content: '새로운 시작' },
    ]},
    { category: '🗓️ 기념일', items: [
        { label: 'Our Anniversary', content: 'Our Anniversary' },
        { label: '우리의 날', content: '우리의 날' },
        { label: '함께한 시간', content: '함께한 시간' },
    ]},
    { category: '✨ 일반', items: [
        { label: '소중한 순간', content: '소중한 순간' },
        { label: '행복한 하루', content: '행복한 하루' },
        { label: 'Memories', content: 'Memories' },
        { label: 'With Love', content: 'With Love' },
        { label: 'Thank You', content: 'Thank You' },
    ]},
];

export const DATE_FORMAT_KEYS = [
    'ymd_dot', 'ymd_kor', 'ymd_dash',
    'eng_long', 'eng_short',
    'ym_kor', 'since_y', 'since_ymd',
] as const;

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function formatPickedDate(iso: string, key: typeof DATE_FORMAT_KEYS[number]): string {
    const [y, mStr, dStr] = iso.split('-');
    if (!y || !mStr || !dStr) return iso;
    const m = Number(mStr), d = Number(dStr);
    switch (key) {
        case 'ymd_dot':   return `${y}.${mStr}.${dStr}`;
        case 'ymd_kor':   return `${y}년 ${m}월 ${d}일`;
        case 'ymd_dash':  return `${y}-${mStr}-${dStr}`;
        case 'eng_long':  return `${MONTHS_EN[m - 1]} ${d}, ${y}`;
        case 'eng_short': return `${d} ${MONTHS_EN[m - 1]} ${y}`;
        case 'ym_kor':    return `${y}년 ${m}월`;
        case 'since_y':   return `Since ${y}`;
        case 'since_ymd': return `Since ${y}.${mStr}.${dStr}`;
    }
}

export function todayIso(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
