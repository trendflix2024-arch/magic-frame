'use client';

import { useEffect, useState } from 'react';
import { Blob, DetailRow, Icon, TopBar } from '../atoms';
import { calcPricing, findColor, findSize, fmtKRW } from '../data';
import { useBrandStore } from '../store';

export function OrderCompleteScreen() {
    const store = useBrandStore();
    const size = findSize(store.frameSize);
    const color = findColor(store.frameColor);
    const pricing = calcPricing(store);

    // 주문번호는 화면 최초 마운트 시 한 번 생성 (다크 모드 토글로 재계산되지 않도록).
    const [orderNum] = useState(() => 'MJ-' + String(Math.floor(Math.random() * 90000) + 10000));

    // 화면이 첫 렌더되면 콘솔에 데모 안내(아무 동작도 하지 않지만, 의도 명시).
    useEffect(() => {
        // intentionally empty
    }, []);

    return (
        <div className="mj-screen scrollable">
            <Blob x="-80" y="-60" size={300} color="rgba(196,181,253,0.35)" />
            <Blob x="70%" y="40%" size={280} color="rgba(184,212,192,0.3)" />
            <TopBar currentStep={4} showSteps />

            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    padding: '64px 80px',
                    maxWidth: 760,
                    margin: '0 auto',
                    textAlign: 'center',
                }}
            >
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        margin: '0 auto 24px',
                        background: 'linear-gradient(135deg, #b8d4c0, #a78bfa)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 12px 36px rgba(124,58,237,0.25)',
                    }}
                >
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <path d="M8 16l5 5 11-12" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
                    주문이 완료되었어요!
                </h1>
                <p style={{ fontSize: 15, color: 'var(--ink-600)', marginTop: 12, lineHeight: 1.6 }}>
                    정성껏 만들어 빠르게 보내드릴게요.<br />
                    진행 상황은 카카오톡으로 알려드려요.
                </p>

                <div className="mj-card" style={{ marginTop: 32, padding: 24, textAlign: 'left' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 16,
                            paddingBottom: 16,
                            borderBottom: '1px dashed var(--ink-200)',
                        }}
                    >
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 4 }}>주문 번호</div>
                            <div style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{orderNum}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 4 }}>결제 금액</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-700)' }}>{fmtKRW(pricing.total)}</div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <DetailRow label="액자" value={`${size.label} · ${color.label} · ${store.finish === 'glossy' ? '유광' : '매트'}`} />
                        <DetailRow label="수량" value={`${store.qty}개`} />
                        <DetailRow label="발송 예정" value="2026.04.28 (화)" />
                        <DetailRow label="도착 예정" value="2026.04.30 (목) 무렵" />
                    </div>
                </div>

                <div
                    style={{
                        background: 'rgba(167,139,250,0.1)',
                        borderRadius: 14,
                        padding: '14px 18px',
                        marginTop: 16,
                        fontSize: 12.5,
                        color: 'var(--brand-700)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        justifyContent: 'center',
                    }}
                >
                    <Icon.gift /> 첫 주문 감사 쿠폰이 카카오톡으로 도착했어요
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 32, justifyContent: 'center' }}>
                    <button
                        className="mj-btn mj-btn-secondary"
                        onClick={() => store.set({ currentScreen: 'landing' })}
                    >홈으로</button>
                    <button
                        className="mj-btn mj-btn-primary"
                        onClick={() => store.set({ currentScreen: 'mode' })}
                    >
                        다른 액자도 만들기 <Icon.arrow />
                    </button>
                </div>
            </div>
        </div>
    );
}
