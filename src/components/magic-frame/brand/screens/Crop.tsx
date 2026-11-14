'use client';

import { useState } from 'react';
import { Blob, Icon, SectionLabel, SliderRow, TopBar, TrialBanner } from '../atoms';
import { filterCSS } from '../collage-canvas';
import { PHOTOS } from '../data';
import { SoftFrame } from '../frame';
import { useBrandStore, CropAspect, CropFilter } from '../store';

const FILTERS: { id: CropFilter; label: string }[] = [
    { id: 'original', label: '원본' },
    { id: 'warm',     label: '따뜻하게' },
    { id: 'cool',     label: '차갑게' },
    { id: 'mono',     label: '흑백' },
    { id: 'vintage',  label: '빈티지' },
];

export function CropScreen() {
    const store = useBrandStore();
    const [tab, setTab] = useState<'crop' | 'filter' | 'text'>('crop');

    const previewW = store.cropAspect === '4:3' ? 380 : 300;
    const aspect = store.cropAspect === '4:3' ? '4 / 3' : '3 / 4';

    return (
        <div className="mj-screen">
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <TopBar
                    currentStep={2}
                    backLabel="모드 선택"
                    onBack={() => store.set({ currentScreen: 'mode' })}
                />
                <TrialBanner />

                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', minHeight: 0 }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                        <Blob x="20%" y="10%" size={280} color="rgba(196,181,253,0.25)" />
                        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                            <SoftFrame width={previewW} height="auto" pad={16} bgColor="#fdfaf4" radius={6}>
                                <div style={{ padding: 18 }}>
                                    <div
                                        style={{
                                            width: previewW - 36,
                                            aspectRatio: aspect,
                                            backgroundImage: `url(${PHOTOS.couple2})`,
                                            backgroundSize: `${store.cropZoom}%`,
                                            backgroundPosition: 'center',
                                            filter: filterCSS(store),
                                            borderRadius: 2,
                                            transition: 'all .25s ease',
                                        }}
                                    />
                                    <div
                                        style={{
                                            marginTop: 14,
                                            textAlign: 'center',
                                            fontFamily: 'var(--font-script)',
                                            color: '#4a3d68',
                                            fontSize: 22,
                                            lineHeight: 1.1,
                                        }}
                                    >{store.cropCaption}</div>
                                    <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>
                                        {store.cropDate}
                                    </div>
                                </div>
                            </SoftFrame>
                            <div style={{ marginTop: 16, fontSize: 12, color: 'var(--ink-500)' }}>
                                실시간 미리보기 · {store.cropAspect} · 줌 {store.cropZoom}%
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            borderLeft: '1px solid var(--ink-200)',
                            background: 'rgba(255,255,255,0.6)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div className="mj-tabs" style={{ padding: '4px 16px 0' }}>
                            <button className={`mj-tab ${tab === 'crop' ? 'active' : ''}`} onClick={() => setTab('crop')}>
                                <Icon.crop /> 크롭
                            </button>
                            <button className={`mj-tab ${tab === 'filter' ? 'active' : ''}`} onClick={() => setTab('filter')}>
                                <Icon.filter /> 필터
                            </button>
                            <button className={`mj-tab ${tab === 'text' ? 'active' : ''}`} onClick={() => setTab('text')}>
                                <Icon.text /> 문구
                            </button>
                        </div>

                        <div className="mj-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 16px' }}>
                            {tab === 'crop' && (
                                <>
                                    <SectionLabel>크롭 비율</SectionLabel>
                                    <div className="mj-seg" style={{ marginTop: 8 }}>
                                        {(['3:4', '4:3'] as CropAspect[]).map(a => (
                                            <button
                                                key={a}
                                                className={`mj-seg-btn ${store.cropAspect === a ? 'active' : ''}`}
                                                onClick={() => store.set({ cropAspect: a })}
                                            >{a === '3:4' ? '3:4 (세로)' : '4:3 (가로)'}</button>
                                        ))}
                                    </div>

                                    <SliderRow label="확대/축소" value={`${store.cropZoom}%`}>
                                        <input
                                            type="range"
                                            className="mj-slider"
                                            min={50}
                                            max={200}
                                            value={store.cropZoom}
                                            onChange={e => store.set({ cropZoom: Number(e.target.value) })}
                                        />
                                    </SliderRow>
                                    <SliderRow label="밝기" value={`${store.cropBrightness}%`}>
                                        <input
                                            type="range"
                                            className="mj-slider"
                                            min={50}
                                            max={150}
                                            value={store.cropBrightness}
                                            onChange={e => store.set({ cropBrightness: Number(e.target.value) })}
                                        />
                                    </SliderRow>
                                    <SliderRow label="대비" value={`${store.cropContrast}%`}>
                                        <input
                                            type="range"
                                            className="mj-slider"
                                            min={50}
                                            max={150}
                                            value={store.cropContrast}
                                            onChange={e => store.set({ cropContrast: Number(e.target.value) })}
                                        />
                                    </SliderRow>
                                    <SliderRow label="채도" value={`${store.cropSaturation}%`}>
                                        <input
                                            type="range"
                                            className="mj-slider"
                                            min={0}
                                            max={150}
                                            value={store.cropSaturation}
                                            onChange={e => store.set({ cropSaturation: Number(e.target.value) })}
                                        />
                                    </SliderRow>
                                </>
                            )}

                            {tab === 'filter' && (
                                <>
                                    <SectionLabel>이미지 필터</SectionLabel>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                                        {FILTERS.map(f => (
                                            <button
                                                key={f.id}
                                                onClick={() => store.set({ cropFilter: f.id })}
                                                style={{
                                                    padding: 6,
                                                    borderRadius: 9,
                                                    cursor: 'pointer',
                                                    border: `1.5px solid ${store.cropFilter === f.id ? 'var(--brand-500)' : 'var(--ink-200)'}`,
                                                    background: store.cropFilter === f.id ? 'var(--brand-50)' : 'white',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: '100%',
                                                        aspectRatio: '1',
                                                        borderRadius: 5,
                                                        backgroundImage: `url(${PHOTOS.couple2})`,
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                        filter: filterCSS({ cropFilter: f.id, cropBrightness: 100, cropContrast: 100, cropSaturation: 100 }),
                                                    }}
                                                />
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                        marginTop: 6,
                                                        color: store.cropFilter === f.id ? 'var(--brand-700)' : 'var(--ink-700)',
                                                    }}
                                                >{f.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}

                            {tab === 'text' && (
                                <>
                                    <SectionLabel>문구</SectionLabel>
                                    <input
                                        type="text"
                                        value={store.cropCaption}
                                        onChange={e => store.set({ cropCaption: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            marginTop: 8,
                                            border: '1px solid var(--ink-200)',
                                            borderRadius: 8,
                                            fontSize: 13,
                                            background: 'white',
                                            color: 'var(--ink-900)',
                                        }}
                                    />

                                    <SectionLabel style={{ marginTop: 20 }}>날짜</SectionLabel>
                                    <input
                                        type="text"
                                        value={store.cropDate}
                                        onChange={e => store.set({ cropDate: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            marginTop: 8,
                                            border: '1px solid var(--ink-200)',
                                            borderRadius: 8,
                                            fontSize: 13,
                                            background: 'white',
                                            color: 'var(--ink-900)',
                                        }}
                                    />

                                    <SectionLabel style={{ marginTop: 20 }}>문구 위치</SectionLabel>
                                    <div className="mj-seg" style={{ marginTop: 8 }}>
                                        <button className="mj-seg-btn">왼쪽</button>
                                        <button className="mj-seg-btn active">중앙</button>
                                        <button className="mj-seg-btn">오른쪽</button>
                                    </div>

                                    <SectionLabel style={{ marginTop: 20 }}>색상</SectionLabel>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                        {['#4a3d68', '#1a1414', '#a72020', '#d4a818', '#7c3aed'].map((c, i) => (
                                            <button
                                                key={c}
                                                style={{
                                                    width: 26,
                                                    height: 26,
                                                    borderRadius: '50%',
                                                    cursor: 'pointer',
                                                    background: c,
                                                    border: i === 0 ? '2px solid var(--brand-500)' : '1px solid var(--ink-200)',
                                                }}
                                            />
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
                                <Icon.check /> 사진 확정하기
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
