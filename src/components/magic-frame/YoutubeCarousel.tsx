"use client";

import { useEffect, useState } from 'react';

function extractId(url: string): string | null {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

export function YoutubeCarousel() {
    const [videos, setVideos] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/magic-frame/youtube')
            .then(r => r.json())
            .then(d => setVideos(Array.isArray(d.videos) ? d.videos : []))
            .catch(() => setVideos([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading || videos.length === 0) return null;

    const ids = videos.map(extractId).filter(Boolean) as string[];
    if (ids.length === 0) return null;

    // 컨테이너: 9:16 세로 (270×480)
    // iframe: 16:9 가로 (853×480) - 컨테이너 높이를 채우도록 가로로 확장하여 사이드를 크롭
    const videoCard = (id: string, i: number) => (
        <div
            key={`${id}-${i}`}
            className="relative snap-center flex-shrink-0 w-[270px] h-[480px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-black"
        >
            <iframe
                width="853"
                height="480"
                src={`https://www.youtube.com/embed/${id}?rel=0&playsinline=1&mute=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute top-0"
                style={{ left: '50%', transform: 'translateX(-50%)' }}
            />
        </div>
    );

    // 단일 영상: 가운데 정렬
    if (ids.length === 1) {
        return <div className="flex justify-center">{videoCard(ids[0], 0)}</div>;
    }

    // 여러 영상: 가로 스와이프
    return (
        <div className="w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
            <div className="flex gap-3 w-max mx-auto">
                {ids.map((id, i) => videoCard(id, i))}
            </div>
        </div>
    );
}
