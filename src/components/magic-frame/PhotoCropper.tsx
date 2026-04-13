"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { ImagePlus, ZoomIn, Type, RotateCcw, Check, SlidersHorizontal, Save, Plus, Trash2 } from 'lucide-react';
import {
    FONTS,
    DEFAULT_FONT,
    TEXT_COLORS,
    TEXT_PRESETS,
    DATE_FORMAT_KEYS,
    formatPickedDate,
    todayIso,
} from './textPresets';

export interface TextLayer {
    id: string;
    content: string;
    font: string;
    color: string;
    size: number;
    x: number;
    y: number;
}

interface CropperProps {
    onFinalize: (blob: Blob) => void;
}

interface FilterValues {
    brightness: number;
    contrast: number;
    saturate: number;
}

const FILTER_PRESETS: { label: string; values: FilterValues }[] = [
    { label: '원본', values: { brightness: 100, contrast: 100, saturate: 100 } },
    { label: '따뜻하게', values: { brightness: 105, contrast: 105, saturate: 130 } },
    { label: '차갑게', values: { brightness: 105, contrast: 110, saturate: 80 } },
    { label: '흑백', values: { brightness: 100, contrast: 110, saturate: 0 } },
    { label: '빈티지', values: { brightness: 95, contrast: 120, saturate: 70 } },
];

function buildFilterString(f: FilterValues) {
    return `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%)`;
}

export function PhotoCropper({ onFinalize }: CropperProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [ratio, setRatio] = useState<'3:4' | '4:3'>('3:4');
    const [zoom, setZoom] = useState(100);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

    // Image filter
    const [filterValues, setFilterValues] = useState<FilterValues>({ brightness: 100, contrast: 100, saturate: 100 });
    const [activePreset, setActivePreset] = useState('원본');

    // Text overlay (다중 레이어)
    const [texts, setTexts] = useState<TextLayer[]>([]);
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
    const [pickedDate, setPickedDate] = useState<string>(() => todayIso());
    const selectedText = texts.find(t => t.id === selectedTextId) ?? null;

    const [savedToast, setSavedToast] = useState(false);

    const fileRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const textDragRef = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);

    const addText = () => {
        const id = (crypto as any).randomUUID ? crypto.randomUUID() : `t-${Date.now()}-${Math.random()}`;
        const newText: TextLayer = {
            id,
            content: '문구 입력',
            font: DEFAULT_FONT,
            color: '#FFFFFF',
            size: 24,
            x: 0.5,
            y: 0.5,
        };
        setTexts(prev => [...prev, newText]);
        setSelectedTextId(id);
    };

    const updateText = (id: string, patch: Partial<TextLayer>) =>
        setTexts(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));

    const deleteText = (id: string) => {
        setTexts(prev => prev.filter(t => t.id !== id));
        setSelectedTextId(prev => prev === id ? null : prev);
    };

    const handleTextPointerDown = (e: React.PointerEvent, id: string) => {
        e.stopPropagation();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setSelectedTextId(id);
        const t = texts.find(x => x.id === id);
        if (!t) return;
        textDragRef.current = { id, sx: e.clientX, sy: e.clientY, ox: t.x, oy: t.y };
    };
    const handleTextPointerMove = (e: React.PointerEvent) => {
        e.stopPropagation();
        const d = textDragRef.current;
        if (!d || !previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        const dx = (e.clientX - d.sx) / rect.width;
        const dy = (e.clientY - d.sy) / rect.height;
        updateText(d.id, {
            x: Math.max(0, Math.min(1, d.ox + dx)),
            y: Math.max(0, Math.min(1, d.oy + dy)),
        });
    };
    const handleTextPointerUp = (e: React.PointerEvent) => {
        e.stopPropagation();
        textDragRef.current = null;
    };

    // 임시 저장 불러오기
    useEffect(() => {
        try {
            const saved = localStorage.getItem('magic_frame_crop_draft');
            if (!saved) return;
            const draft = JSON.parse(saved);
            if (draft.imageSrc) setImageSrc(draft.imageSrc);
            if (draft.ratio) setRatio(draft.ratio);
            if (draft.zoom) setZoom(draft.zoom);
            if (draft.panOffset) setPanOffset(draft.panOffset);
            if (draft.filterValues) setFilterValues(draft.filterValues);
            if (draft.activePreset) setActivePreset(draft.activePreset);
            if (Array.isArray(draft.texts)) setTexts(draft.texts);
        } catch { /* ignore */ }
    }, []);

    const handleTempSave = () => {
        const draft = { imageSrc, ratio, zoom, panOffset, filterValues, activePreset, texts };
        localStorage.setItem('magic_frame_crop_draft', JSON.stringify(draft));
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2000);
    };

    const isPortrait = ratio === '3:4';
    const previewW = isPortrait ? 320 : 400;
    const previewH = isPortrait ? Math.round(320 * 4 / 3) : 300;

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result as string);
            setZoom(100);
            setPanOffset({ x: 0, y: 0 });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const replaceImage = () => fileRef.current?.click();

    const reset = () => {
        setImageSrc(null);
        setZoom(100);
        setPanOffset({ x: 0, y: 0 });
        setFilterValues({ brightness: 100, contrast: 100, saturate: 100 });
        setActivePreset('원본');
        setTexts([]);
        setSelectedTextId(null);
        localStorage.removeItem('magic_frame_crop_draft');
    };

    const handleFilterChange = (key: keyof FilterValues, value: number) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
        setActivePreset('');
    };

    const applyPreset = (preset: typeof FILTER_PRESETS[number]) => {
        setFilterValues(preset.values);
        setActivePreset(preset.label);
    };

    // Pinch zoom
    const touchesRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const pinchStartDist = useRef(0);
    const pinchStartZoom = useRef(100);

    const getTouchDist = (touches: Map<number, { x: number; y: number }>) => {
        const pts = Array.from(touches.values());
        if (pts.length < 2) return 0;
        const dx = pts[1].x - pts[0].x;
        const dy = pts[1].y - pts[0].y;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Wheel zoom
    useEffect(() => {
        const el = previewRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            if (!imageSrc) return;
            e.preventDefault();
            setZoom(prev => Math.min(300, Math.max(100, prev - e.deltaY * 0.5)));
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [imageSrc]);

    // Pan + pinch handlers
    const handlePointerDown = (e: React.PointerEvent) => {
        if (!imageSrc) return;
        touchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        if (touchesRef.current.size === 1) {
            setIsDragging(true);
            dragStart.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
        } else if (touchesRef.current.size === 2) {
            setIsDragging(false);
            pinchStartDist.current = getTouchDist(touchesRef.current);
            pinchStartZoom.current = zoom;
        }
    };
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!imageSrc) return;
        touchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (touchesRef.current.size === 2) {
            const dist = getTouchDist(touchesRef.current);
            if (pinchStartDist.current > 0) {
                const scale = dist / pinchStartDist.current;
                setZoom(Math.min(300, Math.max(100, Math.round(pinchStartZoom.current * scale))));
            }
        } else if (isDragging && touchesRef.current.size === 1) {
            const dx = e.clientX - dragStart.current.x;
            const dy = e.clientY - dragStart.current.y;
            setPanOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
        }
    };
    const handlePointerUp = (e: React.PointerEvent) => {
        touchesRef.current.delete(e.pointerId);
        if (touchesRef.current.size < 2) {
            pinchStartDist.current = 0;
        }
        if (touchesRef.current.size === 0) {
            setIsDragging(false);
        }
    };

    const renderFinal = useCallback(async (): Promise<Blob | null> => {
        if (!imageSrc) return null;

        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image();
            i.crossOrigin = 'anonymous';
            i.onload = () => resolve(i);
            i.onerror = reject;
            i.src = imageSrc;
        });

        // Output size based on original image resolution
        const targetRatio = isPortrait ? 3 / 4 : 4 / 3;
        let outputW: number, outputH: number;
        if (img.width / img.height > targetRatio) {
            outputH = img.height;
            outputW = Math.round(img.height * targetRatio);
        } else {
            outputW = img.width;
            outputH = Math.round(img.width / targetRatio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = outputW;
        canvas.height = outputH;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, outputW, outputH);

        // Scale factor from preview to output
        const scaleX = outputW / previewW;
        const scaleY = outputH / previewH;

        const scale = zoom / 100;
        const imgW = img.width;
        const imgH = img.height;

        // Cover fit: scale image to cover preview
        const coverScale = Math.max(previewW / imgW, previewH / imgH) * scale;
        const drawW = imgW * coverScale * scaleX;
        const drawH = imgH * coverScale * scaleY;
        const drawX = (outputW - drawW) / 2 + panOffset.x * scaleX;
        const drawY = (outputH - drawH) / 2 + panOffset.y * scaleY;

        ctx.filter = buildFilterString(filterValues);
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.filter = 'none';

        // 웹폰트가 캔버스에서 제대로 렌더되도록 사용된 폰트 로드를 대기
        if (typeof document !== 'undefined' && (document as any).fonts?.load) {
            const pairs = Array.from(new Set(
                texts.filter(t => t.content.trim()).map(t => `400 ${Math.round(t.size * scaleX)}px ${t.font}`)
            ));
            await Promise.all(pairs.map(f => (document as any).fonts.load(f))).catch(() => { });
        }

        // Text overlays (다중 레이어)
        for (const t of texts) {
            if (!t.content.trim()) continue;
            const fontSize = t.size * scaleX;
            ctx.font = `400 ${fontSize}px ${t.font}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillStyle = t.color;
            ctx.fillText(t.content.trim(), t.x * outputW, t.y * outputH);
        }
        ctx.shadowColor = 'transparent';

        return new Promise(resolve => {
            canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.92);
        });
    }, [imageSrc, zoom, panOffset, filterValues, texts, isPortrait, previewW, previewH]);

    const handleFinalize = async () => {
        const blob = await renderFinal();
        if (blob) {
            localStorage.removeItem('magic_frame_crop_draft');
            onFinalize(blob);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Preview */}
            <div className="flex-1 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 inline-block">
                    <div ref={previewRef}
                        className="rounded-xl overflow-hidden relative select-none"
                        style={{ width: `${previewW}px`, height: `${previewH}px`, backgroundColor: '#1e293b', touchAction: 'none' }}
                        onClick={() => !imageSrc && fileRef.current?.click()}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}>
                        {imageSrc ? (
                            <>
                                <img src={imageSrc} alt="preview" draggable={false}
                                    className="absolute pointer-events-none"
                                    style={{
                                        width: '100%', height: '100%',
                                        objectFit: 'cover',
                                        transform: `scale(${zoom / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                                        filter: buildFilterString(filterValues),
                                        cursor: 'grab',
                                    }} />
                                {texts.map(t => (
                                    <div
                                        key={t.id}
                                        className={`absolute select-none cursor-grab active:cursor-grabbing ${
                                            selectedTextId === t.id ? 'outline outline-2 outline-dashed outline-indigo-400 rounded' : ''
                                        }`}
                                        style={{
                                            left: `${t.x * 100}%`,
                                            top: `${t.y * 100}%`,
                                            transform: 'translate(-50%, -50%)',
                                            touchAction: 'none',
                                            padding: 6,
                                            zIndex: 20,
                                        }}
                                        onPointerDown={e => handleTextPointerDown(e, t.id)}
                                        onPointerMove={handleTextPointerMove}
                                        onPointerUp={handleTextPointerUp}
                                        onPointerCancel={handleTextPointerUp}
                                    >
                                        <p style={{
                                            fontFamily: t.font,
                                            fontSize: `${t.size}px`,
                                            color: t.color,
                                            fontWeight: 400,
                                            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                                            textAlign: 'center',
                                            whiteSpace: 'nowrap',
                                            margin: 0,
                                        }}>{t.content}</p>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                                <ImagePlus size={48} className="text-slate-500 mb-3" />
                                <p className="text-sm text-slate-400 font-medium">사진을 클릭하여 업로드</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

            {/* Controls */}
            <div className="lg:w-72 space-y-5 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm h-fit">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="text-base">&#9986;</span> 사진 크롭
                </h3>

                {/* Ratio */}
                <div>
                    <label className="text-sm font-medium text-slate-500 mb-2 block">크롭 비율</label>
                    <div className="flex gap-2">
                        {(['3:4', '4:3'] as const).map(r => (
                            <button key={r} onClick={() => setRatio(r)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${ratio === r
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200'}`}>
                                {r === '3:4' ? '3 : 4 (세로)' : '4 : 3 (가로)'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Zoom */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-slate-500 flex items-center gap-1">
                            <ZoomIn size={12} /> 확대/축소
                        </label>
                        <span className="text-sm text-slate-400">{zoom}%</span>
                    </div>
                    <input type="range" min={100} max={300} value={zoom}
                        onChange={e => setZoom(Number(e.target.value))}
                        className="w-full accent-indigo-600" />
                </div>

                {/* Image replace */}
                {imageSrc && (
                    <button onClick={replaceImage}
                        className="w-full py-2.5 bg-white text-indigo-600 border border-indigo-200 font-medium rounded-xl hover:bg-indigo-50 transition-all text-sm flex items-center justify-center gap-1.5">
                        <ImagePlus size={14} /> 이미지 교체
                    </button>
                )}

                {/* Image filters */}
                <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                        <SlidersHorizontal size={13} /> 이미지 필터
                    </h4>

                    {/* Presets */}
                    <div className="flex gap-1.5 mb-3 flex-wrap">
                        {FILTER_PRESETS.map(p => (
                            <button key={p.label} onClick={() => applyPreset(p)}
                                className={`px-2.5 py-1.5 rounded-lg text-sm font-bold transition-all border ${activePreset === p.label
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200'}`}>
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Sliders */}
                    <div className="space-y-2.5">
                        <div>
                            <div className="flex items-center justify-between mb-0.5">
                                <label className="text-sm text-slate-400">밝기</label>
                                <span className="text-sm text-slate-400">{filterValues.brightness}%</span>
                            </div>
                            <input type="range" min={50} max={150} value={filterValues.brightness}
                                onChange={e => handleFilterChange('brightness', Number(e.target.value))}
                                className="w-full accent-indigo-600" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-0.5">
                                <label className="text-sm text-slate-400">대비</label>
                                <span className="text-sm text-slate-400">{filterValues.contrast}%</span>
                            </div>
                            <input type="range" min={50} max={150} value={filterValues.contrast}
                                onChange={e => handleFilterChange('contrast', Number(e.target.value))}
                                className="w-full accent-indigo-600" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-0.5">
                                <label className="text-sm text-slate-400">채도</label>
                                <span className="text-sm text-slate-400">{filterValues.saturate}%</span>
                            </div>
                            <input type="range" min={0} max={200} value={filterValues.saturate}
                                onChange={e => handleFilterChange('saturate', Number(e.target.value))}
                                className="w-full accent-indigo-600" />
                        </div>
                    </div>
                </div>

                {/* Text layers */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                            <Type size={13} /> 텍스트 <span className="text-[10px] font-medium text-slate-400">(선택)</span>
                        </h4>
                        <button onClick={addText}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                            <Plus size={12} /> 추가
                        </button>
                    </div>

                    {texts.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-2 leading-relaxed">
                            &quot;추가&quot; 버튼으로 문구를 만들고<br />
                            프리뷰에서 드래그해 옮기세요
                        </p>
                    )}

                    {texts.length > 1 && (
                        <div className="flex gap-1 flex-wrap">
                            {texts.map((t, i) => (
                                <button key={t.id} onClick={() => setSelectedTextId(t.id)}
                                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${selectedTextId === t.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                                    T{i + 1}
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedText && (
                        <>
                            <div>
                                <label className="text-sm text-slate-400 mb-1 block">추천 문구</label>
                                <select
                                    value=""
                                    onChange={e => {
                                        if (!e.target.value) return;
                                        updateText(selectedText.id, { content: e.target.value });
                                        e.target.value = "";
                                    }}
                                    className="w-full px-2 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                                >
                                    <option value="">✨ 선물 문구 선택하기...</option>
                                    {TEXT_PRESETS.map(group => (
                                        <optgroup key={group.category} label={group.category}>
                                            {group.items.map(p => (
                                                <option key={p.label} value={p.content}>{p.label}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-slate-400 mb-1 block">추천 날짜</label>
                                <div className="flex gap-2 mb-1.5">
                                    <input
                                        type="date"
                                        value={pickedDate}
                                        onChange={e => setPickedDate(e.target.value || todayIso())}
                                        className="flex-1 px-2 py-2 rounded-lg border border-slate-200 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setPickedDate(todayIso())}
                                        className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50"
                                    >
                                        오늘
                                    </button>
                                </div>
                                <select
                                    value=""
                                    onChange={e => {
                                        if (!e.target.value) return;
                                        updateText(selectedText.id, { content: e.target.value });
                                        e.target.value = "";
                                    }}
                                    className="w-full px-2 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                                >
                                    <option value="">📅 날짜 형식 선택...</option>
                                    {DATE_FORMAT_KEYS.map(key => {
                                        const formatted = formatPickedDate(pickedDate, key);
                                        return <option key={key} value={formatted}>{formatted}</option>;
                                    })}
                                </select>
                            </div>
                            <input
                                value={selectedText.content}
                                onChange={e => updateText(selectedText.id, { content: e.target.value })}
                                placeholder="문구를 입력하세요"
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                            />
                            <div>
                                <label className="text-sm text-slate-400 mb-1 block">서체</label>
                                <select
                                    value={selectedText.font}
                                    onChange={e => updateText(selectedText.id, { font: e.target.value })}
                                    className="w-full px-2 py-2 rounded-lg border border-slate-200 text-sm"
                                    style={{ fontFamily: selectedText.font }}>
                                    {FONTS.map(f => (
                                        <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-slate-400 mb-1 block">색상</label>
                                <div className="flex gap-1.5">
                                    {TEXT_COLORS.map(c => (
                                        <button key={c.value}
                                            onClick={() => updateText(selectedText.id, { color: c.value })}
                                            className={`w-7 h-7 rounded-full border ${selectedText.color === c.value ? 'ring-2 ring-indigo-500 ring-offset-1' : 'border-slate-200'}`}
                                            style={{ backgroundColor: c.value }} title={c.label} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-sm text-slate-400">크기</label>
                                    <span className="text-sm text-slate-400">{selectedText.size}px</span>
                                </div>
                                <input type="range" min={12} max={48} value={selectedText.size}
                                    onChange={e => updateText(selectedText.id, { size: Number(e.target.value) })}
                                    className="w-full accent-indigo-600" />
                            </div>
                            <button onClick={() => deleteText(selectedText.id)}
                                className="w-full py-2.5 bg-red-50 text-red-500 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5">
                                <Trash2 size={13} /> 이 문구 삭제
                            </button>
                        </>
                    )}
                </div>

                {/* Buttons */}
                <div className="space-y-2 pt-2">
                    <button onClick={handleFinalize} disabled={!imageSrc}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                        <Check size={16} /> 사진 확정하기
                    </button>
                    <button onClick={handleTempSave} disabled={!imageSrc}
                        className="w-full py-3 bg-white text-indigo-600 border border-indigo-200 font-medium rounded-xl hover:bg-indigo-50 transition-all disabled:opacity-40 flex items-center justify-center gap-2 text-sm">
                        <Save size={14} /> {savedToast ? '저장 완료!' : '임시 저장하기'}
                    </button>
                    <button onClick={reset}
                        className="w-full py-3 text-slate-400 font-medium rounded-xl hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm">
                        <RotateCcw size={14} /> 초기화
                    </button>
                </div>
            </div>
        </div>
    );
}
