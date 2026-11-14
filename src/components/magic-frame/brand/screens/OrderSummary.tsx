'use client';

import { Field, Icon, PriceRow, SectionLabel, TopBar } from '../atoms';
import {
    PHOTOS,
    calcPricing,
    calcShipDates,
    findColor,
    findSize,
    fmtDateShort,
    fmtKRW,
} from '../data';
import { SoftFrame } from '../frame';
import { useBrandStore } from '../store';

const PAY_METHODS = [
    { id: 'kakao', label: '카카오페이' },
    { id: 'naver', label: '네이버페이' },
    { id: 'card',  label: '신용카드' },
];

export function OrderSummaryScreen() {
    const store = useBrandStore();
    const size = findSize(store.frameSize);
    const color = findColor(store.frameColor);
    const pricing = calcPricing(store);

    return (
        <div className="mj-screen scrollable">
            <TopBar
                currentStep={4}
                backLabel="옵션 선택"
                onBack={() => store.set({ currentScreen: 'preview' })}
            />

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr',
                    gap: 32,
                    padding: '40px 64px 64px',
                    maxWidth: 1200,
                    margin: '0 auto',
                }}
            >
                {/* Left form */}
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>주문서 작성</h1>
                    <p style={{ fontSize: 13.5, color: 'var(--ink-600)', marginTop: 8 }}>
                        평일 14:00 이전 주문 시 <strong style={{ color: 'var(--brand-700)' }}>당일 발송</strong>해드려요.
                    </p>

                    <div className="mj-card" style={{ padding: 24, marginTop: 20 }}>
                        <SectionLabel>받는 분</SectionLabel>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                            <Field placeholder="이름" defaultValue="김지수" />
                            <Field placeholder="휴대전화" defaultValue="010-1234-5678" />
                        </div>
                        <SectionLabel style={{ marginTop: 18 }}>배송지</SectionLabel>
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <Field placeholder="우편번호" defaultValue="04524" style={{ width: 120 }} />
                            <button className="mj-btn mj-btn-secondary mj-btn-sm">주소 검색</button>
                        </div>
                        <Field placeholder="기본 주소" defaultValue="서울 중구 세종대로 110" style={{ marginTop: 8 }} />
                        <Field placeholder="상세 주소 (동/호수 등)" style={{ marginTop: 8 }} />
                        <Field placeholder="배송 메모 (선택)" defaultValue="문 앞에 놓아주세요" style={{ marginTop: 8 }} />
                    </div>

                    <div className="mj-card" style={{ padding: 24, marginTop: 16 }}>
                        <SectionLabel>결제 방법</SectionLabel>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
                            {PAY_METHODS.map((p, i) => (
                                <button
                                    key={p.id}
                                    style={{
                                        padding: '12px 10px',
                                        borderRadius: 10,
                                        cursor: 'pointer',
                                        border: `1.5px solid ${i === 0 ? 'var(--brand-500)' : 'var(--ink-200)'}`,
                                        background: i === 0 ? 'var(--brand-50)' : 'white',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: i === 0 ? 'var(--brand-700)' : 'var(--ink-700)',
                                    }}
                                >{p.label}</button>
                            ))}
                        </div>
                    </div>

                    <div
                        className="mj-card"
                        style={{
                            padding: 16,
                            marginTop: 16,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            background: 'rgba(167,139,250,0.08)',
                        }}
                    >
                        <Icon.shield style={{ color: 'var(--brand-700)', width: 18, height: 18 }} />
                        <div style={{ fontSize: 12.5, color: 'var(--ink-700)', lineHeight: 1.5 }}>
                            개인정보는 주문 처리 목적으로만 사용되며, 배송 완료 후 90일 이내 안전하게 폐기됩니다.
                        </div>
                    </div>
                </div>

                {/* Right summary (sticky) */}
                <div style={{ position: 'sticky', top: 88, alignSelf: 'flex-start' }}>
                    <div className="mj-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div
                            style={{
                                padding: 20,
                                background: 'rgba(255,255,255,0.5)',
                                borderBottom: '1px solid var(--ink-200)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                            }}
                        >
                            <SoftFrame width={56} height={70} pad={4} radius={4}>
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        backgroundImage: `url(${store.mode === 'collage' ? PHOTOS.couple1 : PHOTOS.couple2})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                />
                            </SoftFrame>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>
                                    매직액자 · {store.mode === 'collage' ? '콜라주' : '단일 사진'}
                                </div>
                                <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 4 }}>
                                    {size.label} · {color.label}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
                                    {store.finish === 'glossy' ? '유광' : '매트'} · 수량 {store.qty}개
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: 20 }}>
                            <PriceRow label={`액자 ${size.label} × ${store.qty}`} value={fmtKRW(pricing.subtotal)} />
                            {pricing.finishFee > 0 && (
                                <PriceRow label={`유광 마감 × ${store.qty}`} value={`+${fmtKRW(pricing.finishFee)}`} />
                            )}
                            <PriceRow
                                label="배송비"
                                value={
                                    pricing.shipping === 0
                                        ? <span style={{ color: 'var(--brand-700)', fontWeight: 600 }}>무료</span>
                                        : fmtKRW(pricing.shipping)
                                }
                            />
                            {pricing.shipping === 0 && (
                                <div style={{ fontSize: 11.5, color: 'var(--brand-700)', marginTop: -4, marginBottom: 8 }}>
                                    6만원 이상 무료배송 적용
                                </div>
                            )}
                            <hr className="mj-divider" style={{ margin: '14px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontSize: 14, fontWeight: 600 }}>총 결제 금액</span>
                                <span
                                    style={{
                                        fontSize: 22,
                                        fontWeight: 700,
                                        color: 'var(--brand-700)',
                                        fontVariantNumeric: 'tabular-nums',
                                    }}
                                >{fmtKRW(pricing.total)}</span>
                            </div>
                            <div
                                style={{
                                    marginTop: 12,
                                    padding: 10,
                                    borderRadius: 8,
                                    background: 'rgba(184,212,192,0.2)',
                                    border: '1px solid rgba(184,212,192,0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 12,
                                    color: '#3a6e4a',
                                }}
                            >
                                <Icon.truck /> <span>{fmtDateShort(calcShipDates().arrive)} 무렵 도착 예정</span>
                            </div>
                            <button
                                className="mj-btn mj-btn-primary mj-btn-lg mj-btn-block"
                                style={{ marginTop: 14 }}
                                onClick={() => store.set({ currentScreen: 'complete' })}
                            >
                                {fmtKRW(pricing.total)} 결제하기
                            </button>
                            <div style={{ fontSize: 11, color: 'var(--ink-500)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
                                결제 시 <a style={{ color: 'var(--brand-600)', cursor: 'pointer' }}>이용약관</a> 및{' '}
                                <a style={{ color: 'var(--brand-600)', cursor: 'pointer' }}>개인정보처리방침</a>에 동의한 것으로 간주됩니다.
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-500)', lineHeight: 1.6, padding: '0 8px' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <Icon.gift style={{ color: 'var(--brand-600)', marginTop: 2, flexShrink: 0 }} />
                            <span>주문 후 액자 제작 영상이 카카오톡으로 전송됩니다.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
