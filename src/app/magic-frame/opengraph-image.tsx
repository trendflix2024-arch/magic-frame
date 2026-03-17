import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '매직액자 - 나만의 사진을 액자로';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '1200px',
                    height: '630px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(160deg, #eef2ff 0%, #f5f3ff 40%, #faf5ff 70%, #eef2ff 100%)',
                }}
            >
                {/* Icon */}
                <div
                    style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 30px rgba(99,102,241,0.35)',
                        marginBottom: '32px',
                    }}
                >
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                        <path d="M12 3l1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5L12 3z" fill="white" />
                        <path d="M18 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="white" fillOpacity="0.7" />
                        <path d="M6 16l.75 1.5L8.25 18.25l-1.5.75L6 20.5l-.75-1.5L3.75 18.25l1.5-.75L6 16z" fill="white" fillOpacity="0.5" />
                    </svg>
                </div>

                {/* Title */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <span style={{ color: '#1e1b4b', fontSize: '64px', fontWeight: 900, letterSpacing: '-2px' }}>
                        매직액자
                    </span>
                    <span style={{ color: '#6366f1', fontSize: '28px', fontWeight: 700 }}>
                        나만의 사진을 액자로
                    </span>
                </div>

                {/* Description */}
                <span style={{ color: '#64748b', fontSize: '22px', fontWeight: 600, textAlign: 'center' }}>
                    거울 액자로 나만의 무드를 만드세요
                </span>

                {/* Features */}
                <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
                    {['사진 크롭', '콜라주', '문구 삽입'].map((label) => (
                        <div
                            key={label}
                            style={{
                                padding: '12px 28px',
                                background: 'white',
                                borderRadius: '100px',
                                border: '1.5px solid #e0e7ff',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <span style={{ color: '#4f46e5', fontSize: '18px', fontWeight: 700 }}>{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        ),
        { ...size }
    );
}
