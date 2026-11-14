"use client";

import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Loader2, Youtube, AlertCircle, CheckCircle2 } from 'lucide-react';
import { adminFetch } from '@/lib/admin-token';

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

export function YoutubeTab() {
    const [videos, setVideos] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [savedToast, setSavedToast] = useState(false);

    useEffect(() => {
        adminFetch('/api/magic-frame/admin/youtube')
            .then(r => r.json())
            .then(d => setVideos(Array.isArray(d.videos) ? d.videos : []))
            .catch(() => setError('영상 목록을 불러올 수 없습니다.'))
            .finally(() => setLoading(false));
    }, []);

    const addVideo = () => setVideos(prev => [...prev, '']);
    const removeVideo = (i: number) => setVideos(prev => prev.filter((_, idx) => idx !== i));
    const updateVideo = (i: number, value: string) =>
        setVideos(prev => prev.map((v, idx) => idx === i ? value : v));

    const save = async () => {
        setSaving(true);
        setError('');
        try {
            const cleaned = videos.map(v => v.trim()).filter(Boolean);
            const invalid = cleaned.find(v => !extractId(v));
            if (invalid) {
                setError(`올바르지 않은 URL: ${invalid}`);
                return;
            }
            const res = await adminFetch('/api/magic-frame/admin/youtube', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videos: cleaned }),
            });
            const data = await res.json();
            if (data.error) {
                setError(data.error);
                return;
            }
            setVideos(data.videos);
            setSavedToast(true);
            setTimeout(() => setSavedToast(false), 2000);
        } catch {
            setError('저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-indigo-500" size={28} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <Youtube size={18} className="text-red-500" />
                    <h3 className="text-base font-bold text-slate-800">사용 가이드 영상 관리</h3>
                </div>
                <p className="text-sm text-slate-500">
                    체험 모드 / 편집 화면 상단에 표시되는 유튜브 영상 URL을 등록합니다. 여러 개 등록 시 가로로 스와이프할 수 있습니다.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    지원 형식: youtube.com/shorts/..., youtu.be/..., youtube.com/watch?v=...
                </p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-500 text-sm rounded-lg p-3 flex items-center gap-2">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            {savedToast && (
                <div className="bg-emerald-50 text-emerald-600 text-sm rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle2 size={14} /> 저장되었습니다.
                </div>
            )}

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                {videos.length === 0 && (
                    <p className="text-center text-sm text-slate-400 py-6">
                        등록된 영상이 없습니다. 아래 버튼으로 추가해주세요.
                    </p>
                )}
                {videos.map((v, i) => {
                    const id = extractId(v);
                    return (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-400 w-6">{i + 1}.</span>
                            <input
                                value={v}
                                onChange={e => updateVideo(i, e.target.value)}
                                placeholder="https://www.youtube.com/shorts/..."
                                className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                            />
                            {id && (
                                <span className="text-xs text-emerald-600 font-bold whitespace-nowrap">✓ {id.slice(0, 6)}</span>
                            )}
                            <button
                                onClick={() => removeVideo(i)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="삭제"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    );
                })}
                <button
                    onClick={addVideo}
                    className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-500 font-medium rounded-xl hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 text-sm"
                >
                    <Plus size={14} /> 영상 추가
                </button>
            </div>

            <button
                onClick={save}
                disabled={saving}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                저장
            </button>
        </div>
    );
}
