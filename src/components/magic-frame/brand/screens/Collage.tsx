'use client';

import { useState } from 'react';
import { Blob, Icon, SectionLabel, TopBar } from '../atoms';
import { CollageCanvas, LayoutThumb } from '../collage-canvas';
import { PHOTOS } from '../data';
import { useBrandStore, CollageLayoutId, CollageStyleId, CollageRatio } from '../store';

const LAYOUTS: { id: CollageLayoutId; label: string }[] = [
    { id: 'pair',   label: '커플 한쌍' },
    { id: 'grid4',  label: '그리드 4' },
    { id: 'mosaic', label: '모자이크' },
    { id: 'strip',  label: '필름 스트립' },
];

const STYLES: { id: CollageStyleId; label: string; desc: string }[] = [
    { id: 'classic',  label: '클래식',     desc: '깔끔한 화이트 매트' },
    { id: 'polaroid', label: '폴라로이드', desc: '따뜻한 빈티지 톤' },
    { id: 'minimal',  label: '미니멀',     desc: '여백과 침묵' },
];

const RATIOS: CollageRatio[] = ['1:1', '4:5', '3:4', '2:3'];

const SUGGESTED_CAPTIONS = [
    '우리의 첫 봄, 2025',
    '너와 함께한 모든 순간',
    'forever ours ♡',
    '결혼 1주년을 기념하며',
];

export function CollageScreen() {
    const store = useBrandStore();
    const [tab, setTab] = useState<'layout' | 'style' | 'text'>('layout');

    return (
        <div className="mj-screen">
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <TopBar
                    currentStep={2}
                    backLabel="모드 선택"
                    onBack={() => store.set({ currentScreen: 'mode' })}
                />

                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 360px', minHeight: 0 }}>
                    {/* Left preview */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                        <Blob x="20%" y="10%" size={300} color="rgba(196,181,253,0.25)" />
                        <Blob x="60%" y="60%" size={260} color="rgba(249,168,196,0.2)" />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <CollageCanvas
                                layout={store.collageLayout}
                                style={store.collageStyle}
                                caption={store.collageCaption}
                                ratio={store.collageRatio}
                            />
                            <div style={{ marginTop: 18, textAlign: 'center', fontSize: 12, color: 'var(--ink-500)' }}>
                                실시간 미리보기 · 우측에서 옵션을 바꿔보세요
                            </div>
                        </div>
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 24,
                                left: 24,
                                display: 'flex',
                                gap: 6,
                                background: 'rgba(255,255,255,0.85)',
                                padding: 4,
                                borderRadius: 10,
                                boxShadow: 'var(--shadow-sm)',
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            <button className="mj-btn mj-btn-ghost mj-btn-sm" style={{ padding: '6px 8px' }}><Icon.minus /></button>
                            <span style={{ fontSize: 12, padding: '6px 8px', color: 'var(--ink-600)' }}>100%</span>
                            <button className="mj-btn mj-btn-ghost mj-btn-sm" style={{ padding: '6px 8px' }}><Icon.plus /></button>
                        </div>
                    </div>

                    {/* Right controls */}
                    <div
                        className="mj-scroll"
                        style={{
                            borderLeft: '1px solid var(--ink-200)',
                            background: 'rgba(255,255,255,0.6)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0,
                        }}
                    >
                        <div className="mj-tabs" style={{ padding: '4px 16px 0' }}>
                            <button className={`mj-tab ${tab === 'layout' ? 'active' : ''}`} onClick={() => setTab('layout')}>
                                <Icon.collage /> 레이아웃
                            </button>
                            <button className={`mj-tab ${tab === 'style' ? 'active' : ''}`} onClick={() => setTab('style')}>
                                <Icon.sparkle /> 스타일
                            </button>
                            <button className={`mj-tab ${tab === 'text' ? 'active' : ''}`} onClick={() => setTab('text')}>
                                <Icon.text /> 문구
                            </button>
                        </div>

                        <div className="mj-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 16px' }}>
                            {tab === 'layout' && (
                                <>
                                    <SectionLabel>레이아웃</SectionLabel>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                                        {LAYOUTS.map(l => (
                                            <button
                                                key={l.id}
                                                onClick={() => store.set({ collageLayout: l.id })}
                                                style={{
                                                    padding: 12,
                                                    borderRadius: 10,
                                                    cursor: 'pointer',
                                                    border: `1.5px solid ${store.collageLayout === l.id ? 'var(--brand-500)' : 'var(--ink-200)'}`,
                                                    background: store.collageLayout === l.id ? 'var(--brand-50)' : 'white',
                                                    textAlign: 'left',
                                                    transition: 'all .15s',
                                                }}
                                            >
                                                <LayoutThumb id={l.id} />
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        marginTop: 8,
                                                        color: store.collageLayout === l.id ? 'var(--brand-700)' : 'var(--ink-800)',
                                                    }}
                                                >{l.label}</div>
                                            </button>
                                        ))}
                                    </div>

                                    <SectionLabel style={{ marginTop: 24 }}>비율</SectionLabel>
                                    <div className="mj-seg" style={{ marginTop: 8 }}>
                                        {RATIOS.map(r => (
                                            <button
                                                key={r}
                                                className={`mj-seg-btn ${store.collageRatio === r ? 'active' : ''}`}
                                                onClick={() => store.set({ collageRatio: r })}
                                            >{r}</button>
                                        ))}
                                    </div>

                                    <SectionLabel style={{ marginTop: 24 }}>사진 슬롯</SectionLabel>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                                        {[PHOTOS.couple1, PHOTOS.couple2, PHOTOS.couple3, PHOTOS.couple4].map((p, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    aspectRatio: '1',
                                                    borderRadius: 7,
                                                    backgroundImage: `url(${p})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    border: '2px solid var(--brand-300)',
                                                }}
                                            />
                                        ))}
                                        <button
                                            style={{
                                                aspectRatio: '1',
                                                borderRadius: 7,
                                                border: '1.5px dashed var(--ink-300)',
                                                background: 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--ink-500)',
                                                cursor: 'pointer',
                                            }}
                                        ><Icon.plus /></button>
                                    </div>
                                    <button className="mj-btn mj-btn-secondary mj-btn-sm" style={{ width: '100%', marginTop: 10 }}>
                                        <Icon.upload /> 사진 더 올리기
                                    </button>
                                </>
                            )}

                            {tab === 'style' && (
                                <>
                                    <SectionLabel>전체 스타일</SectionLabel>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                                        {STYLES.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => store.set({ collageStyle: s.id })}
                                                style={{
                                                    padding: '10px 12px',
                                                    borderRadius: 10,
                                                    cursor: 'pointer',
                                                    border: `1.5px solid ${store.collageStyle === s.id ? 'var(--brand-500)' : 'var(--ink-200)'}`,
                                                    background: store.collageStyle === s.id ? 'var(--brand-50)' : 'white',
                                                    textAlign: 'left',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: store.collageStyle === s.id ? 'var(--brand-700)' : 'var(--ink-800)' }}>{s.label}</div>
                                                    <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginTop: 2 }}>{s.desc}</div>
                                                </div>
                                                {store.collageStyle === s.id && <Icon.check style={{ color: 'var(--brand-600)' }} />}
                                            </button>
                                        ))}
                                    </div>

                                    <SectionLabel style={{ marginTop: 24 }}>여백</SectionLabel>
                                    <input type="range" className="mj-slider" defaultValue={20} min={0} max={50} style={{ marginTop: 12 }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-500)', marginTop: 4 }}>
                                        <span>없음</span><span>넉넉히</span>
                                    </div>

                                    <SectionLabel style={{ marginTop: 20 }}>모서리 둥글기</SectionLabel>
                                    <input type="range" className="mj-slider" defaultValue={6} min={0} max={20} style={{ marginTop: 12 }} />
                                </>
                            )}

                            {tab === 'text' && (
                                <>
                                    <SectionLabel>문구</SectionLabel>
                                    <input
                                        type="text"
                                        value={store.collageCaption}
                                        onChange={e => store.set({ collageCaption: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            marginTop: 8,
                                            border: '1px solid var(--ink-200)',
                                            borderRadius: 8,
                                            fontSize: 13,
                                            fontFamily: 'inherit',
                                            background: 'white',
                                            color: 'var(--ink-900)',
                                        }}
                                    />

                                    <SectionLabel style={{ marginTop: 20 }}>추천 문구</SectionLabel>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                                        {SUGGESTED_CAPTIONS.map(t => (
                                            <button
                                                key={t}
                                                onClick={() => store.set({ collageCaption: t })}
                                                style={{
                                                    textAlign: 'left',
                                                    padding: '8px 10px',
                                                    borderRadius: 8,
                                                    border: '1px solid var(--ink-200)',
                                                    background: 'white',
                                                    fontSize: 12.5,
                                                    color: 'var(--ink-700)',
                                                    cursor: 'pointer',
                                                    fontFamily: 'var(--font-script)',
                                                }}
                                            >{t}</button>
                                        ))}
                                    </div>

                                    <SectionLabel style={{ marginTop: 20 }}>서체</SectionLabel>
                                    <div className="mj-seg" style={{ marginTop: 8 }}>
                                        {[
                                            { id: 'script', label: '손글씨', f: 'var(--font-script)' },
                                            { id: 'serif',  label: '명조',   f: 'var(--font-serif)' },
                                            { id: 'sans',   label: '고딕',   f: 'var(--font-sans)' },
                                        ].map(f => (
                                            <button
                                                key={f.id}
                                                className={`mj-seg-btn ${f.id === 'script' ? 'active' : ''}`}
                                                style={{ fontFamily: f.f }}
                                            >{f.label}</button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div
                            style={{
                                borderTop: '1px solid var(--ink-200)',
                                padding: 16,
                                background: 'rgba(255,255,255,0.7)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                            }}
                        >
                            <button
                                className="mj-btn mj-btn-primary mj-btn-block"
                                onClick={() => store.set({ currentScreen: 'preview' })}
                            >
                                <Icon.check /> 콜라주 확정하고 다음으로
                            </button>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="mj-btn mj-btn-secondary mj-btn-sm" style={{ flex: 1 }}>임시 저장</button>
                                <button className="mj-btn mj-btn-ghost mj-btn-sm" style={{ flex: 1 }}>초기화</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
