'use client';

import { CSSProperties } from 'react';
import { PHOTOS } from './data';
import { SoftFrame } from './frame';
import type { CollageLayoutId, CollageRatio, CollageStyleId } from './store';

const RATIO_MAP: Record<CollageRatio, string> = {
    '1:1': '1',
    '4:5': '4/5',
    '3:4': '3/4',
    '2:3': '2/3',
};

function captionFamily(style: CollageStyleId) {
    if (style === 'classic') return 'var(--font-serif)';
    if (style === 'minimal') return 'var(--font-sans)';
    return 'var(--font-script)';
}

function photoCellStyle(photo: string, style: CollageStyleId, extra: CSSProperties = {}): CSSProperties {
    return {
        backgroundImage: `url(${photo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: style === 'minimal' ? 2 : 4,
        ...extra,
    };
}

/**
 * CollageCanvas — 콜라주 메이커 화면의 좌측 큰 미리보기.
 * 외곽은 SoftFrame(흰 카드) + 안쪽 매트 + 사진 그리드 + 캡션.
 */
export function CollageCanvas({
    layout,
    style,
    caption,
    ratio,
    photos = [PHOTOS.couple1, PHOTOS.couple2, PHOTOS.couple3, PHOTOS.couple4],
    width = 380,
}: {
    layout: CollageLayoutId;
    style: CollageStyleId;
    caption: string;
    ratio: CollageRatio;
    photos?: string[];
    width?: number;
}) {
    const matBg = style === 'polaroid' ? '#f8f1e3' : style === 'minimal' ? '#ffffff' : '#fdfaf4';
    const matPad = style === 'minimal' ? 26 : style === 'polaroid' ? 18 : 22;

    return (
        <SoftFrame width={width + matPad * 2} height="auto" bgColor={matBg} pad={16} radius={8}>
            <div style={{ padding: matPad }}>
                <div
                    className={
                        layout === 'grid4' ? 'lyt-grid4' :
                        layout === 'pair'  ? 'lyt-pair'  :
                        layout === 'mosaic' ? 'lyt-mosaic' : 'lyt-strip'
                    }
                    style={{
                        width,
                        aspectRatio: RATIO_MAP[ratio] || '4/5',
                        display: 'grid',
                        gap: 10,
                    }}
                >
                    {layout === 'pair' && (
                        <>
                            <div style={photoCellStyle(photos[0], style)} />
                            <div style={photoCellStyle(photos[1] || photos[0], style)} />
                        </>
                    )}
                    {layout === 'grid4' && [0, 1, 2, 3].map(i => (
                        <div key={i} style={photoCellStyle(photos[i % photos.length], style)} />
                    ))}
                    {layout === 'mosaic' && (
                        <>
                            <div style={photoCellStyle(photos[0], style, { gridColumn: '1', gridRow: '1 / 3' })} />
                            <div style={photoCellStyle(photos[1] || photos[0], style, { gridColumn: '2', gridRow: '1' })} />
                            <div style={photoCellStyle(photos[2] || photos[0], style, { gridColumn: '2', gridRow: '2' })} />
                        </>
                    )}
                    {layout === 'strip' && [0, 1, 2].map(i => (
                        <div key={i} style={photoCellStyle(photos[i % photos.length], style)} />
                    ))}
                </div>
                {caption && (
                    <div
                        style={{
                            marginTop: 18,
                            fontFamily: captionFamily(style),
                            color: '#4a3d68',
                            textAlign: style === 'minimal' ? 'left' : 'center',
                            fontSize: style === 'polaroid' ? 22 : 16,
                            fontWeight: 400,
                            letterSpacing: style === 'minimal' ? '.1em' : 0,
                        }}
                    >
                        {caption}
                    </div>
                )}
            </div>
        </SoftFrame>
    );
}

/**
 * CollageCanvasInner — WallFrame 안쪽에 들어가는 콜라주만(외곽 흰 카드 없음).
 */
export function CollageCanvasInner({
    layout,
    caption,
    width = 320,
    photos = [PHOTOS.couple1, PHOTOS.couple2, PHOTOS.couple3, PHOTOS.couple4],
}: {
    layout: CollageLayoutId;
    caption: string;
    width?: number;
    photos?: string[];
}) {
    return (
        <div>
            <div
                className={
                    layout === 'grid4' ? 'lyt-grid4' :
                    layout === 'pair'  ? 'lyt-pair'  :
                    layout === 'mosaic' ? 'lyt-mosaic' : 'lyt-strip'
                }
                style={{ width, aspectRatio: '4/5', display: 'grid', gap: 8 }}
            >
                {layout === 'pair' && (
                    <>
                        <div style={photoCellStyle(photos[0], 'classic', { borderRadius: 3 })} />
                        <div style={photoCellStyle(photos[1] || photos[0], 'classic', { borderRadius: 3 })} />
                    </>
                )}
                {layout === 'grid4' && [0, 1, 2, 3].map(i => (
                    <div key={i} style={photoCellStyle(photos[i % photos.length], 'classic', { borderRadius: 3 })} />
                ))}
                {layout === 'mosaic' && (
                    <>
                        <div style={photoCellStyle(photos[0], 'classic', { gridColumn: '1', gridRow: '1 / 3', borderRadius: 3 })} />
                        <div style={photoCellStyle(photos[1] || photos[0], 'classic', { gridColumn: '2', gridRow: '1', borderRadius: 3 })} />
                        <div style={photoCellStyle(photos[2] || photos[0], 'classic', { gridColumn: '2', gridRow: '2', borderRadius: 3 })} />
                    </>
                )}
                {layout === 'strip' && [0, 1, 2].map(i => (
                    <div key={i} style={photoCellStyle(photos[i % photos.length], 'classic', { borderRadius: 3 })} />
                ))}
            </div>
            {caption && (
                <div
                    style={{
                        marginTop: 16,
                        fontFamily: 'var(--font-script)',
                        color: '#4a3d68',
                        textAlign: 'center',
                        fontSize: 22,
                    }}
                >
                    {caption}
                </div>
            )}
        </div>
    );
}

/* ──────────────────────────────────────────
   Layout thumbnails — 우측 컨트롤 패널의 4 종 미니 아이콘
   ────────────────────────────────────────── */
export function LayoutThumb({ id }: { id: CollageLayoutId }) {
    const wrap: CSSProperties = {
        width: '100%',
        aspectRatio: '4/5',
        background: 'var(--ink-100)',
        borderRadius: 4,
        padding: 4,
        display: 'grid',
        gap: 3,
    };
    const cell: CSSProperties = { background: 'var(--brand-200)', borderRadius: 2 };
    if (id === 'pair') {
        return (
            <div style={{ ...wrap, gridTemplateColumns: '1fr 1fr' }}>
                <div style={cell} /><div style={cell} />
            </div>
        );
    }
    if (id === 'grid4') {
        return (
            <div style={{ ...wrap, gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }}>
                <div style={cell} /><div style={cell} /><div style={cell} /><div style={cell} />
            </div>
        );
    }
    if (id === 'mosaic') {
        return (
            <div style={{ ...wrap, gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr' }}>
                <div style={{ ...cell, gridRow: '1/3' }} />
                <div style={cell} />
                <div style={cell} />
            </div>
        );
    }
    return (
        <div style={{ ...wrap, gridTemplateColumns: 'repeat(3, 1fr)', alignItems: 'center' }}>
            <div style={{ ...cell, aspectRatio: '1' }} />
            <div style={{ ...cell, aspectRatio: '1' }} />
            <div style={{ ...cell, aspectRatio: '1' }} />
        </div>
    );
}

/* ──────────────────────────────────────────
   Filter CSS preset — Crop 화면용
   ────────────────────────────────────────── */
export function filterCSS(s: {
    cropFilter: string;
    cropBrightness?: number;
    cropContrast?: number;
    cropSaturation?: number;
}) {
    const presets: Record<string, string> = {
        original: '',
        warm: 'sepia(0.15) saturate(1.1) hue-rotate(-8deg)',
        cool: 'saturate(0.9) hue-rotate(15deg) brightness(1.02)',
        mono: 'grayscale(1) contrast(1.05)',
        vintage: 'sepia(0.35) saturate(0.85) contrast(0.95)',
    };
    return `${presets[s.cropFilter] ?? ''} brightness(${(s.cropBrightness ?? 100) / 100}) contrast(${(s.cropContrast ?? 100) / 100}) saturate(${(s.cropSaturation ?? 100) / 100})`;
}
