'use client';

import { Icon, TopBar } from '../atoms';
import { PHOTOS } from '../data';
import { useBrandStore, GalleryFilter } from '../store';

const works = [
    { p: PHOTOS.couple1, c: '둘만의 첫 봄', cat: 'couple', author: '지수님 ♡ 민호님' },
    { p: PHOTOS.couple2, c: '결혼 1주년', cat: 'couple', author: '서연님 ♡ 지훈님' },
    { p: PHOTOS.couple3, c: '제주에서', cat: 'couple', author: '하늘님 ♡ 도현님' },
    { p: PHOTOS.family1, c: '엄마, 아빠와', cat: 'family', author: '김씨네 가족' },
    { p: PHOTOS.couple4, c: '눈 내리던 날', cat: 'couple', author: '예린님 ♡ 우진님' },
    { p: PHOTOS.couple5, c: '우리의 매일', cat: 'couple', author: '소영님 ♡ 태현님' },
    { p: PHOTOS.family2, c: '할머니 칠순', cat: 'birthday', author: '박씨네 가족' },
    { p: PHOTOS.couple6, c: '도쿄 여행 ✈', cat: 'couple', author: '나래님 ♡ 정우님' },
    { p: PHOTOS.family3, c: '아이의 백일', cat: 'family', author: '이씨네 세 식구' },
];

const filters: { id: GalleryFilter; label: string }[] = [
    { id: 'all',      label: '전체' },
    { id: 'couple',   label: '커플' },
    { id: 'family',   label: '가족' },
    { id: 'birthday', label: '기념일' },
];

export function GalleryScreen() {
    const store = useBrandStore();
    const filter = store.galleryFilter;
    const filtered = filter === 'all' ? works : works.filter(w => w.cat === filter);

    return (
        <div className="mj-screen scrollable">
            <TopBar
                showSteps={false}
                backLabel="닫기"
                onBack={() => store.set({ currentScreen: 'mode' })}
                right={
                    <button
                        className="mj-btn mj-btn-primary mj-btn-sm"
                        onClick={() => store.set({ currentScreen: 'mode' })}
                    >
                        나도 만들어보기 <Icon.arrow />
                    </button>
                }
            />

            <div style={{ padding: '48px 80px 24px', textAlign: 'center' }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
                    실제 고객들의 매직액자
                </h1>
                <p style={{ fontSize: 14.5, color: 'var(--ink-600)', marginTop: 10 }}>
                    허락받은 작품만 모았어요. 마음에 드는 스타일이 있다면 그대로 만들어볼 수 있어요.
                </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '0 24px 24px' }}>
                {filters.map(f => (
                    <button
                        key={f.id}
                        className={`mj-btn ${filter === f.id ? 'mj-btn-primary' : 'mj-btn-secondary'} mj-btn-sm`}
                        onClick={() => store.set({ galleryFilter: f.id })}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 28,
                    padding: '8px 80px 64px',
                    maxWidth: 1100,
                    margin: '0 auto',
                }}
            >
                {filtered.map((w, i) => {
                    const tilt = (i % 3 === 1 ? 2 : i % 3 === 2 ? -2 : 1) * (i % 2 ? -1 : 1);
                    return (
                        <div key={`${w.p}-${i}`} className="mj-fade-up" style={{ animationDelay: `${i * 0.04}s`, textAlign: 'center' }}>
                            <div className="mj-polaroid" style={{ width: '100%', transform: `rotate(${tilt}deg)` }}>
                                <div className="mj-polaroid-photo" style={{ backgroundImage: `url(${w.p})`, aspectRatio: '4/5' }} />
                                <div className="mj-polaroid-caption">{w.c}</div>
                            </div>
                            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-500)' }}>{w.author}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
