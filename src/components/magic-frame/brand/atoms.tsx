'use client';

import { CSSProperties, Fragment, ReactNode, SVGProps } from 'react';

/* ──────────────────────────────────────────
   Icon set — 디자인 원본의 Icon 객체 이식
   ────────────────────────────────────────── */
export const Icon = {
    arrow: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
            <path d="M3 7h8m-3-3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    back: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
            <path d="M11 7H3m3-3L3 7l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    sparkle: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
            <path d="M7 1l1.4 3.6L12 6 8.4 7.4 7 11 5.6 7.4 2 6l3.6-1.4z M11 10.5l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5z" fill="currentColor" />
        </svg>
    ),
    check: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
            <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    image: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
            <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="6" cy="7" r="1" fill="currentColor" />
            <path d="M2.5 11l3-3 4 4L11 10l3 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
    ),
    collage: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
            <rect x="2" y="2" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
            <rect x="8.5" y="2" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
            <rect x="2" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
            <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
        </svg>
    ),
    text: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
            <path d="M3 4V3h8v1M7 3v8m-2 0h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    crop: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
            <path d="M3 1v10h10M5 3h6v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    ),
    filter: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
            <circle cx="5" cy="5" r="3" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.4" />
        </svg>
    ),
    heart: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
            <path d="M8 13s-5-3.2-5-7a3 3 0 015-2 3 3 0 015 2c0 3.8-5 7-5 7z" fill="currentColor" />
        </svg>
    ),
    star: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
            <path d="M7 1l1.7 3.8L12.5 5.5l-3 2.7.8 4-3.3-2-3.3 2 .8-4-3-2.7L4.3 4.8z" fill="currentColor" />
        </svg>
    ),
    truck: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
            <path d="M1 4h8v6H1zM9 6h3l2 2v2h-5z" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="4" cy="11" r="1.4" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="12" cy="11" r="1.4" stroke="currentColor" strokeWidth="1.3" />
        </svg>
    ),
    shield: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
            <path d="M7 1l5 2v4c0 3-2.5 5-5 6-2.5-1-5-3-5-6V3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
    ),
    close: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    ),
    plus: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
            <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    ),
    minus: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
            <path d="M3 7h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    ),
    upload: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
            <path d="M7 9V2m-3 3l3-3 3 3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    bolt: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
            <path d="M8 1L3 8h3l-1 5 5-7H7z" fill="currentColor" />
        </svg>
    ),
    printer: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
            <path d="M4 6V2h8v4M4 11H2V7h12v4h-2M4 9h8v5H4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
    ),
    gift: (p: SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
            <path d="M2 5h10v8H2zM2 5h10M7 5v8M5 5c-1-1-2-3 0-3s2 3 2 3M9 5c1-1 2-3 0-3s-2 3-2 3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
    ),
    cog: (p: SVGProps<SVGSVGElement>) => (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}>
            <circle cx="8" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
    ),
};

/* ──────────────────────────────────────────
   Logo
   ────────────────────────────────────────── */
export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
    const fs = size === 'lg' ? 22 : 17;
    const m = size === 'lg' ? 34 : 28;
    return (
        <div className="mj-logo" style={{ fontSize: fs }}>
            <span className="mj-logo-mark" style={{ width: m, height: m, borderRadius: 9 }}>
                <svg width={m * 0.55} height={m * 0.55} viewBox="0 0 16 16" fill="none">
                    <path
                        d="M8 1.5l1.6 4 4 .5-3 2.8.9 4.2L8 11l-3.5 2 .9-4.2-3-2.8 4-.5z"
                        fill="white"
                    />
                </svg>
            </span>
            <span>매직액자</span>
        </div>
    );
}

/* ──────────────────────────────────────────
   Step indicator
   ────────────────────────────────────────── */
export function StepIndicator({ current = 1 }: { current?: number }) {
    const steps = ['업로드', '편집', '확인', '주문'];
    return (
        <div className="mj-steps">
            {steps.map((label, i) => {
                const n = i + 1;
                const status = n < current ? 'done' : n === current ? 'active' : '';
                return (
                    <Fragment key={label}>
                        <span className={`mj-step ${status}`}>
                            <span className="mj-step-num">
                                {n < current ? (
                                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                ) : n}
                            </span>
                            <span>{label}</span>
                        </span>
                        {i < steps.length - 1 && <span className="mj-step-divider" />}
                    </Fragment>
                );
            })}
        </div>
    );
}

/* ──────────────────────────────────────────
   TopBar
   ────────────────────────────────────────── */
export function TopBar({
    currentStep,
    backLabel,
    showSteps = true,
    onBack,
    right,
}: {
    currentStep?: number;
    backLabel?: string;
    showSteps?: boolean;
    onBack?: () => void;
    right?: ReactNode;
}) {
    return (
        <div className="mj-topbar">
            <div className="mj-topbar-left">
                {backLabel ? (
                    <button className="mj-back-btn" onClick={onBack}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M9 3L4 7l5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {backLabel}
                    </button>
                ) : (
                    <Logo />
                )}
            </div>
            {showSteps && <StepIndicator current={currentStep} />}
            <div className="mj-topbar-right">
                {right ?? (
                    <>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>도움이 필요하세요?</span>
                        <button className="mj-btn mj-btn-secondary mj-btn-sm">카카오톡 문의</button>
                    </>
                )}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────
   Polaroid
   ────────────────────────────────────────── */
export function Polaroid({
    photo,
    caption,
    rotate = 0,
    width = 180,
    animDelay = 0,
    animKey = 1,
    style = {},
}: {
    photo: string;
    caption?: string;
    rotate?: number;
    width?: number;
    animDelay?: number;
    animKey?: 1 | 2 | 3;
    style?: CSSProperties;
}) {
    const animName = animKey === 1 ? 'mjb-float-1' : animKey === 2 ? 'mjb-float-2' : 'mjb-float-3';
    return (
        <div
            className="mj-polaroid"
            style={{
                width,
                transform: `rotate(${rotate}deg)`,
                animation: `${animName} 6s ease-in-out infinite`,
                animationDelay: `${animDelay}s`,
                ...style,
            }}
        >
            <div
                className="mj-polaroid-photo"
                style={{ backgroundImage: `url(${photo})` }}
            />
            {caption && <div className="mj-polaroid-caption">{caption}</div>}
        </div>
    );
}

/* ──────────────────────────────────────────
   Blob — ambient background decor
   ────────────────────────────────────────── */
export function Blob({
    x,
    y,
    size = 360,
    color = 'rgba(167,139,250,0.35)',
    blur = 80,
}: {
    x: string | number;
    y: string | number;
    size?: number;
    color?: string;
    blur?: number;
}) {
    return (
        <div
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: size,
                height: size,
                background: color,
                borderRadius: '50%',
                filter: `blur(${blur}px)`,
                pointerEvents: 'none',
            }}
        />
    );
}

/* ──────────────────────────────────────────
   Notification — 체험 모드
   ────────────────────────────────────────── */
export function TrialBanner() {
    return (
        <div
            style={{
                background: 'linear-gradient(90deg, rgba(245,196,168,0.18), rgba(249,168,196,0.18))',
                borderBottom: '1px solid rgba(212,184,138,0.3)',
                padding: '10px 32px',
                fontSize: 12.5,
                color: 'var(--ink-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
            }}
        >
            <span style={{ fontSize: 14 }}>✨</span>
            <span>
                <strong style={{ color: 'var(--brand-700)' }}>체험 모드</strong> · 로그인 없이 모든 편집 기능을 미리 사용해보세요
            </span>
        </div>
    );
}

/* ──────────────────────────────────────────
   Footer
   ────────────────────────────────────────── */
export function Footer() {
    return (
        <div
            style={{
                padding: '20px 32px',
                borderTop: '1px solid var(--ink-200)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
                color: 'var(--ink-500)',
                background: 'rgba(255,255,255,0.4)',
            }}
        >
            <span>© 2026 매직액자 · All rights reserved</span>
            <div style={{ display: 'flex', gap: 16 }}>
                <a style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M5 5.5h4M5 8h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    카카오톡 채널
                </a>
                <a style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <rect x="1.5" y="3" width="11" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M2 4l5 4 5-4" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                    이메일 문의
                </a>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────
   Small layout helpers
   ────────────────────────────────────────── */
export function SectionLabel({ children, style = {} }: { children: ReactNode; style?: CSSProperties }) {
    return (
        <div
            style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '.04em',
                textTransform: 'uppercase',
                color: 'var(--ink-500)',
                ...style,
            }}
        >
            {children}
        </div>
    );
}

export function SliderRow({
    label,
    value,
    children,
}: {
    label: string;
    value: string;
    children: ReactNode;
}) {
    return (
        <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-700)', fontWeight: 500, marginBottom: 6 }}>
                <span>{label}</span>
                <span style={{ color: 'var(--ink-500)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
            </div>
            {children}
        </div>
    );
}

export function Field({
    placeholder,
    defaultValue,
    style = {},
}: {
    placeholder?: string;
    defaultValue?: string;
    style?: CSSProperties;
}) {
    return (
        <input
            type="text"
            placeholder={placeholder}
            defaultValue={defaultValue}
            style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--ink-200)',
                borderRadius: 8,
                fontSize: 13,
                fontFamily: 'inherit',
                background: 'white',
                color: 'var(--ink-900)',
                ...style,
            }}
        />
    );
}

export function PriceRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: 'var(--ink-600)' }}>{label}</span>
            <span style={{ color: 'var(--ink-800)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        </div>
    );
}

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink-800)' }}>{value}</div>
        </div>
    );
}
