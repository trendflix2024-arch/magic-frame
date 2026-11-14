'use client';

import { CSSProperties, cloneElement } from 'react';
import { Blob, Icon, TopBar, TrialBanner } from '../atoms';
import { PHOTOS } from '../data';
import { useBrandStore } from '../store';

const cards = [
    {
        id: 'collage' as const,
        icon: <Icon.collage />,
        title: '콜라주 메이커',
        tag: '인기',
        desc: '여러 장의 사진을 한 액자에. 커플의 추억을 한 화면에 담아보세요.',
        preview: 'collage',
    },
    {
        id: 'crop' as const,
        icon: <Icon.image />,
        title: '개별 사진 크롭',
        desc: '한 장의 사진을 더 깊고 풍부하게. 필터, 문구, 액자까지 한 번에.',
        preview: 'crop',
    },
    {
        id: 'gallery' as const,
        icon: <Icon.heart />,
        title: '샘플 갤러리',
        desc: '다른 분들이 만든 액자를 둘러보고 영감을 얻어보세요.',
        preview: 'gallery',
    },
];

export function ModeSelectScreen() {
    const store = useBrandStore();

    return (
        <div className="mj-screen scrollable">
            <Blob x="-100" y="-80" size={360} color="rgba(196,181,253,0.35)" />
            <Blob x="70%" y="50%" size={300} color="rgba(249,168,196,0.3)" />

            <div style={{ position: 'relative', zIndex: 1 }}>
                <TopBar
                    currentStep={1}
                    backLabel="홈으로"
                    onBack={() => store.set({ currentScreen: 'landing' })}
                />
                <TrialBanner />

                <div style={{ padding: '56px 80px 40px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
                    <h1 style={{ fontSize: 36, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
                        어떻게 시작해볼까요?
                    </h1>
                    <p style={{ fontSize: 15, color: 'var(--ink-600)', marginTop: 12, lineHeight: 1.6 }}>
                        원하는 스타일을 골라주세요. 언제든 다른 모드로 전환할 수 있어요.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22, padding: '0 80px 60px', maxWidth: 1200, margin: '0 auto' }}>
                    {cards.map((c, i) => (
                        <button
                            key={c.id}
                            className="mj-card mj-card-hover mj-fade-up"
                            style={{
                                animationDelay: `${i * 0.06}s`,
                                padding: 0,
                                textAlign: 'left',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                                border: '1px solid var(--ink-200)',
                                borderRadius: 'var(--r-xl)',
                                background: 'rgba(255,255,255,0.7)',
                            }}
                            onClick={() => {
                                if (c.id === 'gallery') store.set({ currentScreen: 'gallery' });
                                else store.set({ mode: c.id, currentScreen: c.id });
                            }}
                        >
                            {c.tag && (
                                <span
                                    className="mj-badge mj-badge-brand"
                                    style={{ position: 'absolute', top: 16, right: 16, fontSize: 11, padding: '3px 9px' }}
                                >{c.tag}</span>
                            )}
                            <div style={{ height: 200, background: 'var(--bg-cream-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                {c.preview === 'collage' && <CollagePreview />}
                                {c.preview === 'crop' && <CropPreview />}
                                {c.preview === 'gallery' && <GalleryPreview />}
                            </div>
                            <div style={{ padding: 24 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10, background: 'var(--brand-50)', color: 'var(--brand-700)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                                }}>
                                    {cloneElement(c.icon, { width: 18, height: 18 })}
                                </div>
                                <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{c.title}</div>
                                <div style={{ fontSize: 13, color: 'var(--ink-600)', lineHeight: 1.55 }}>{c.desc}</div>
                                <div style={{ marginTop: 16, color: 'var(--brand-700)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    시작하기 <Icon.arrow />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div style={{ padding: '0 80px 64px', maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-700)' }}>이번 주 인기 작품</div>
                        <button className="mj-btn mj-btn-ghost mj-btn-sm" onClick={() => store.set({ currentScreen: 'gallery' })}>
                            전체 보기 <Icon.arrow />
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
                        {[PHOTOS.couple1, PHOTOS.couple2, PHOTOS.couple3, PHOTOS.couple4, PHOTOS.couple5, PHOTOS.couple6].map((p, i) => (
                            <div
                                key={i}
                                style={{
                                    aspectRatio: '1',
                                    borderRadius: 10,
                                    backgroundImage: `url(${p})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    boxShadow: 'var(--shadow-sm)',
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

const tileStyle = (p: string, extra: CSSProperties = {}): CSSProperties => ({
    aspectRatio: '1',
    backgroundImage: `url(${p})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: 2,
    ...extra,
});

function CollagePreview() {
    return (
        <div
            style={{
                width: 130,
                padding: 8,
                background: 'white',
                borderRadius: 4,
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                transform: 'rotate(-3deg)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 4,
            }}
        >
            <div style={tileStyle(PHOTOS.couple1)} />
            <div style={tileStyle(PHOTOS.couple2)} />
            <div style={tileStyle(PHOTOS.couple3)} />
            <div style={tileStyle(PHOTOS.couple4)} />
        </div>
    );
}

function CropPreview() {
    return (
        <div
            style={{
                width: 110,
                padding: '8px 8px 28px',
                background: 'white',
                borderRadius: 4,
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                transform: 'rotate(2deg)',
                fontFamily: 'var(--font-script)',
                textAlign: 'center',
            }}
        >
            <div style={{ width: '100%', aspectRatio: '3/4', backgroundImage: `url(${PHOTOS.couple5})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 2 }} />
            <div style={{ marginTop: 6, fontSize: 12, color: '#4a3d68' }}>너와 함께</div>
        </div>
    );
}

function GalleryPreview() {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, width: 150 }}>
            {[PHOTOS.couple6, PHOTOS.family1, PHOTOS.couple2, PHOTOS.couple4, PHOTOS.family2, PHOTOS.couple3].map((p, i) => (
                <div key={i} style={tileStyle(p, { borderRadius: 3 })} />
            ))}
        </div>
    );
}
