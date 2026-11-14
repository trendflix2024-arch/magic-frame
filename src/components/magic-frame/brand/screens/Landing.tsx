'use client';

import { cloneElement } from 'react';
import { Blob, Footer, Icon, Polaroid, TopBar } from '../atoms';
import { PHOTOS } from '../data';
import { useBrandStore } from '../store';

export function LandingScreen() {
    const store = useBrandStore();

    return (
        <div className="mj-screen scrollable mj-paper">
            <Blob x="-120" y="-100" size={420} color="rgba(167,139,250,0.4)" />
            <Blob x="60%" y="-80" size={340} color="rgba(249,168,196,0.35)" />
            <Blob x="50%" y="60%" size={380} color="rgba(245,196,168,0.32)" />

            <div style={{ position: 'relative', zIndex: 1 }}>
                <TopBar
                    showSteps={false}
                    right={
                        <>
                            <button className="mj-btn mj-btn-ghost mj-btn-sm" onClick={() => store.set({ currentScreen: 'gallery' })}>
                                샘플 갤러리
                            </button>
                            <button className="mj-btn mj-btn-secondary mj-btn-sm">로그인</button>
                        </>
                    }
                />

                {/* Hero */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 40,
                        padding: '64px 80px 48px',
                        alignItems: 'center',
                        minHeight: 600,
                    }}
                >
                    {/* Left copy */}
                    <div>
                        <div className="mj-badge mj-badge-brand mj-fade-up" style={{ marginBottom: 20 }}>
                            <Icon.heart style={{ color: 'var(--brand-600)' }} />
                            <span>
                                이번 달 <strong style={{ fontWeight: 700 }}>1,243쌍</strong>의 커플이 선택했어요
                            </span>
                        </div>
                        <h1
                            className="mj-fade-up"
                            style={{
                                fontSize: 56,
                                fontWeight: 700,
                                letterSpacing: '-0.03em',
                                lineHeight: 1.15,
                                margin: 0,
                                fontFamily: 'var(--font-display)',
                                animationDelay: '.05s',
                            }}
                        >
                            우리의 이야기를<br />
                            <span
                                style={{
                                    background: 'var(--brand-grad)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                            >매직액자</span>로 담다
                        </h1>
                        <p
                            className="mj-fade-up"
                            style={{
                                fontSize: 16.5,
                                color: 'var(--ink-600)',
                                marginTop: 18,
                                lineHeight: 1.6,
                                maxWidth: 540,
                                animationDelay: '.1s',
                            }}
                        >
                            사진을 올리면, 마음에 쏙 드는 액자가 됩니다.<br />
                            편집부터 인쇄·배송까지 한 번에 — 평일 14시 전 주문 시 당일 발송.
                        </p>
                        <div className="mj-fade-up" style={{ display: 'flex', gap: 12, marginTop: 32, animationDelay: '.15s' }}>
                            <button className="mj-btn mj-btn-primary mj-btn-lg" onClick={() => store.set({ currentScreen: 'mode' })}>
                                <Icon.sparkle />
                                지금 시작하기
                                <Icon.arrow />
                            </button>
                            <button className="mj-btn mj-btn-secondary mj-btn-lg" onClick={() => store.set({ currentScreen: 'gallery' })}>
                                샘플 먼저 보기
                            </button>
                        </div>
                        <div className="mj-fade-up" style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 28, animationDelay: '.2s' }}>
                            <div style={{ display: 'flex' }}>
                                {[PHOTOS.couple1, PHOTOS.couple2, PHOTOS.couple3, PHOTOS.couple4].map((p, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            backgroundImage: `url(${p})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            border: '2px solid white',
                                            marginLeft: i === 0 ? 0 : -10,
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                        }}
                                    />
                                ))}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--ink-600)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Icon.star key={i} style={{ color: '#f5b942', width: 12, height: 12 }} />
                                    ))}
                                    <strong style={{ color: 'var(--ink-800)', marginLeft: 4 }}>4.9</strong>
                                </div>
                                <div style={{ marginTop: 2, opacity: 0.8 }}>실제 후기 8,400개</div>
                            </div>
                        </div>
                    </div>

                    {/* Right floating polaroids */}
                    <div style={{ position: 'relative', height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div
                            style={{
                                position: 'absolute',
                                right: '6%',
                                top: '0%',
                                opacity: 0.6,
                                transform: 'rotate(8deg) scale(.85)',
                            }}
                        >
                            {/* 작은 미리보기 액자 — 흰 카드 스타일로 통일 */}
                            <div
                                className="mj-soft-frame"
                                style={{ padding: 12 }}
                            >
                                <div
                                    className="mj-soft-frame-inner"
                                    style={{ width: 140, height: 180, borderRadius: 6 }}
                                >
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            backgroundImage: `url(${PHOTOS.couple5})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <Polaroid photo={PHOTOS.couple1} caption="너와의 첫 봄날" rotate={-8} width={210} animDelay={0} animKey={1}
                            style={{ position: 'absolute', left: '6%', top: '8%', zIndex: 3 }} />
                        <Polaroid photo={PHOTOS.couple2} caption="2024.10.12 ♡" rotate={5} width={210} animDelay={0.4} animKey={2}
                            style={{ position: 'absolute', right: '8%', top: '38%', zIndex: 4 }} />
                        <Polaroid photo={PHOTOS.couple3} caption="우리의 첫 여행" rotate={-3} width={210} animDelay={0.8} animKey={3}
                            style={{ position: 'absolute', left: '14%', bottom: '4%', zIndex: 2 }} />
                        <div style={{ position: 'absolute', left: '20%', top: '12%', width: 50, height: 18, background: 'rgba(245,196,168,0.55)', transform: 'rotate(-30deg)', zIndex: 5 }} />
                        <div style={{ position: 'absolute', right: '14%', top: '40%', width: 46, height: 16, background: 'rgba(167,139,250,0.45)', transform: 'rotate(25deg)', zIndex: 5 }} />
                    </div>
                </div>

                {/* Feature cards */}
                <div style={{ padding: '32px 80px 56px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                        {[
                            { icon: <Icon.bolt />, title: '직관적인 편집', desc: '클릭 몇 번이면 끝.\n사진 자르기, 콜라주, 문구 삽입까지.' },
                            { icon: <Icon.printer />, title: '프리미엄 인쇄', desc: '국내 최고급 매트지·유광지.\n빛바램 보정 100년 보장.' },
                            { icon: <Icon.truck />, title: '빠른 제작·배송', desc: '평일 14시 전 주문 시 당일 발송.\n2~3일 안에 도착해요.' },
                        ].map((f, i) => (
                            <div key={i} className="mj-card mj-card-hover" style={{ padding: 28 }}>
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                        background: 'var(--brand-50)',
                                        color: 'var(--brand-700)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: 16,
                                    }}
                                >
                                    {cloneElement(f.icon, { width: 20, height: 20 })}
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, letterSpacing: '-0.01em' }}>{f.title}</div>
                                <div style={{ fontSize: 13.5, color: 'var(--ink-600)', lineHeight: 1.55, whiteSpace: 'pre-line' }}>{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}
