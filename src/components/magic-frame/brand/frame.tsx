'use client';

import { CSSProperties, ReactNode } from 'react';
import type { FinishId, FrameColorId } from './data';

/**
 * SoftFrame — 기존 매직액자 CollageMaker 의 외곽 흰 카드 형태와 동일.
 * 에디터 미리보기/주문 썸네일 등 "디지털 화면 상의 액자" 자리에 사용.
 *
 * 참고: src/components/magic-frame/CollageMaker.tsx:721-735
 */
export function SoftFrame({
    width,
    height,
    bgColor = '#FFFFFF',
    radius = 12,
    pad = 16,
    children,
    style = {},
}: {
    width: number | string;
    height: number | string;
    bgColor?: string;
    radius?: number;
    pad?: number;
    children?: ReactNode;
    style?: CSSProperties;
}) {
    return (
        <div className="mj-soft-frame" style={{ padding: pad, ...style }}>
            <div
                className="mj-soft-frame-inner"
                style={{ width, height, backgroundColor: bgColor, borderRadius: radius }}
            >
                {children}
            </div>
        </div>
    );
}

/**
 * WallFrame — "벽에 걸렸을 때" 미리보기 전용. 디자인의 mj-frame(원목 액자)
 * 본체를 유지하되, 안쪽 매트 영역은 SoftFrame 흐름과 자연스럽게 연결되도록
 * 단순한 매트지 배경만 둔다.
 *
 * 사용처: FramePreview 화면 한 곳.
 */
export function WallFrame({
    color,
    finish,
    children,
    padding = 18,
    matBg = '#fdfaf4',
    matPad = 22,
    style = {},
}: {
    color: FrameColorId;
    finish: FinishId;
    children: ReactNode;
    padding?: number;
    matBg?: string;
    matPad?: number;
    style?: CSSProperties;
}) {
    return (
        <div
            className={`mj-frame color-${color} finish-${finish}`}
            style={{ padding, transition: 'background .2s', ...style }}
        >
            <div style={{ background: matBg, padding: matPad }}>{children}</div>
        </div>
    );
}
