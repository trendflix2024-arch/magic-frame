'use client';

import { Icon, SectionLabel, TopBar } from '../atoms';
import { CollageCanvasInner, filterCSS } from '../collage-canvas';
import {
    FINISHES,
    FRAME_COLORS,
    FRAME_SIZES,
    PHOTOS,
    calcPricing,
    findColor,
    findSize,
    fmtKRW,
} from '../data';
import { WallFrame } from '../frame';
import { useBrandStore } from '../store';

export function FramePreviewScreen() {
    const store = useBrandStore();
    const size = findSize(store.frameSize);
    const color = findColor(store.frameColor);
    const pricing = calcPricing(store);

    return (
        <div className="mj-screen scrollable">
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <TopBar
                    currentStep={3}
                    backLabel="편집으로"
                    onBack={() => store.set({ currentScreen: store.mode === 'crop' ? 'crop' : 'collage' })}
                />

                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.4fr 1fr', minHeight: 600 }}>
                    {/* Left wall scene */}
                    <div
                        style={{
                            position: 'relative',
                            overflow: 'hidden',
                            background: 'linear-gradient(170deg, #efe7df 0%, #e6dcd0 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 48,
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                opacity: 0.4,
                                backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%)',
                            }}
                        />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <WallFrame color={color.id} finish={store.finish} padding={18} matPad={22}>
                                {store.mode === 'crop' ? (
                                    <CropResultInner />
                                ) : (
                                    <CollageCanvasInner layout={store.collageLayout} caption={store.collageCaption} />
                                )}
                            </WallFrame>
                            <div
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    bottom: -10,
                                    width: '70%',
                                    height: 14,
                                    transform: 'translateX(-50%)',
                                    background: 'radial-gradient(ellipse, rgba(0,0,0,0.18), transparent 70%)',
                                }}
                            />
                        </div>
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 100,
                                background: 'linear-gradient(180deg, transparent, rgba(180,150,120,0.18))',
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                top: 24,
                                left: 24,
                                fontSize: 11.5,
                                color: 'var(--ink-600)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 10px',
                                background: 'rgba(255,255,255,0.7)',
                                borderRadius: 999,
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            <Icon.sparkle /> 실제 벽에 걸었을 때 미리보기
                        </div>
                    </div>

                    {/* Right options */}
                    <div
                        className="mj-scroll"
                        style={{
                            padding: '32px 32px',
                            borderLeft: '1px solid var(--ink-200)',
                            background: 'rgba(255,255,255,0.5)',
                            overflowY: 'auto',
                        }}
                    >
                        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>
                            액자 옵션
                        </div>
                        <h2
                            style={{
                                fontSize: 22,
                                fontWeight: 700,
                                margin: '4px 0 4px',
                                letterSpacing: '-0.02em',
                                fontFamily: 'var(--font-display)',
                            }}
                        >마음에 드는 모양으로 만들어요</h2>
                        <p style={{ fontSize: 13, color: 'var(--ink-600)', margin: 0 }}>
                            옵션을 바꿀 때마다 미리보기가 함께 바뀝니다.
                        </p>

                        <SectionLabel style={{ marginTop: 28 }}>액자 사이즈</SectionLabel>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                            {FRAME_SIZES.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => store.set({ frameSize: s.id })}
                                    style={{
                                        padding: '14px 16px',
                                        borderRadius: 12,
                                        cursor: 'pointer',
                                        border: `1.5px solid ${store.frameSize === s.id ? 'var(--brand-500)' : 'var(--ink-200)'}`,
                                        background: store.frameSize === s.id ? 'var(--brand-50)' : 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        textAlign: 'left',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: store.frameSize === s.id ? 'var(--brand-700)' : 'var(--ink-900)' }}>
                                            {s.label}
                                            {s.id === 'M' && (
                                                <span
                                                    style={{
                                                        marginLeft: 8,
                                                        fontSize: 10.5,
                                                        padding: '2px 7px',
                                                        borderRadius: 999,
                                                        background: 'var(--accent-gold)',
                                                        color: 'white',
                                                        fontWeight: 600,
                                                    }}
                                                >인기</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{s.dims}</div>
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: store.frameSize === s.id ? 'var(--brand-700)' : 'var(--ink-700)' }}>
                                        {fmtKRW(s.price)}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <SectionLabel style={{ marginTop: 24 }}>프레임 색상</SectionLabel>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 10 }}>
                            {FRAME_COLORS.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => store.set({ frameColor: c.id })}
                                    style={{
                                        padding: 8,
                                        borderRadius: 10,
                                        cursor: 'pointer',
                                        border: `1.5px solid ${store.frameColor === c.id ? 'var(--brand-500)' : 'var(--ink-200)'}`,
                                        background: store.frameColor === c.id ? 'var(--brand-50)' : 'white',
                                        textAlign: 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '100%',
                                            height: 32,
                                            borderRadius: 6,
                                            background: c.swatch,
                                            border: c.id === 'white' ? '1px solid var(--ink-200)' : 'none',
                                        }}
                                    />
                                    <div
                                        style={{
                                            fontSize: 11.5,
                                            fontWeight: 500,
                                            marginTop: 6,
                                            color: store.frameColor === c.id ? 'var(--brand-700)' : 'var(--ink-700)',
                                        }}
                                    >{c.label}</div>
                                </button>
                            ))}
                        </div>

                        <SectionLabel style={{ marginTop: 24 }}>마감재</SectionLabel>
                        <div className="mj-seg" style={{ marginTop: 10 }}>
                            {FINISHES.map(f => (
                                <button
                                    key={f.id}
                                    className={`mj-seg-btn ${store.finish === f.id ? 'active' : ''}`}
                                    onClick={() => store.set({ finish: f.id })}
                                >{f.label}{f.id === 'glossy' && ' (+4,000원)'}</button>
                            ))}
                        </div>

                        <SectionLabel style={{ marginTop: 24 }}>수량</SectionLabel>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                            <button
                                className="mj-btn mj-btn-secondary"
                                style={{ width: 36, height: 36, padding: 0 }}
                                onClick={() => store.set({ qty: Math.max(1, store.qty - 1) })}
                            ><Icon.minus /></button>
                            <div style={{ fontSize: 18, fontWeight: 600, minWidth: 30, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{store.qty}</div>
                            <button
                                className="mj-btn mj-btn-secondary"
                                style={{ width: 36, height: 36, padding: 0 }}
                                onClick={() => store.set({ qty: store.qty + 1 })}
                            ><Icon.plus /></button>
                        </div>

                        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--ink-200)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                                <span style={{ fontSize: 13, color: 'var(--ink-600)' }}>예상 금액 (사이즈 {size.label})</span>
                                <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand-700)', fontVariantNumeric: 'tabular-nums' }}>
                                    {fmtKRW(pricing.total)}
                                </span>
                            </div>
                            <button
                                className="mj-btn mj-btn-primary mj-btn-lg mj-btn-block"
                                onClick={() => store.set({ currentScreen: 'order' })}
                            >
                                주문서 작성하기 <Icon.arrow />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CropResultInner() {
    const s = useBrandStore();
    return (
        <div style={{ textAlign: 'center' }}>
            <div
                style={{
                    width: s.cropAspect === '4:3' ? 340 : 280,
                    aspectRatio: s.cropAspect === '4:3' ? '4 / 3' : '3 / 4',
                    backgroundImage: `url(${PHOTOS.couple2})`,
                    backgroundSize: `${s.cropZoom}%`,
                    backgroundPosition: 'center',
                    filter: filterCSS(s),
                    borderRadius: 2,
                }}
            />
            <div
                style={{
                    marginTop: 12,
                    fontFamily: 'var(--font-script)',
                    color: '#4a3d68',
                    fontSize: 22,
                    lineHeight: 1.1,
                }}
            >{s.cropCaption}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>{s.cropDate}</div>
        </div>
    );
}
