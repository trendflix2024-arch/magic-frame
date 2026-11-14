import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
    title: '매직액자',
    description: '나만의 사진으로 만드는 특별한 액자',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Jua&family=Do+Hyeon&family=Noto+Sans+KR:wght@400;700&family=Noto+Serif+KR:wght@400;700&family=Black+Han+Sans&family=Nanum+Pen+Script&family=Nanum+Brush+Script&family=Gowun+Batang:wght@400;700&family=Hi+Melody&family=East+Sea+Dokdo&family=Poor+Story&family=Yeon+Sung&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
