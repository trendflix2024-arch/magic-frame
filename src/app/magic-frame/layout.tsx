import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "매직액자 - 나만의 사진을 액자로",
    description: "거울 액자로 나만의 무드를 만드세요. 사진 편집부터 제출까지 한 번에.",
    openGraph: {
        title: "매직액자 - 나만의 사진을 액자로",
        description: "거울 액자로 나만의 무드를 만드세요. 사진 편집부터 제출까지 한 번에.",
        type: "website",
        locale: "ko_KR",
        siteName: "매직액자",
    },
    twitter: {
        card: "summary",
        title: "매직액자 - 나만의 사진을 액자로",
        description: "거울 액자로 나만의 무드를 만드세요. 사진 편집부터 제출까지 한 번에.",
    },
};

export default function MagicFrameRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
