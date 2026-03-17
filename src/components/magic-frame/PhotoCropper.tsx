"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { ImagePlus, ZoomIn, Type, RotateCcw, Check, SlidersHorizontal } from 'lucide-react';

interface CropperProps {
    onFinalize: (blob: Blob) => void;
}

const FONTS = [
    { label: '본고딕 (기본)', value: 'sans-serif' },
    { label: '나눔명조', value: '"Nanum Myeongjo", serif' },
    { label: '세리프', value: 'Georgia, serif' },
];

const TEXT_COLORS = [
    { label: '화이트', value: '#FFFFFF' },
    { label: '블랙', value: '#000000' },
    { label: '레드', value: '#EF4444' },
    { label: '옐로우', value: '#FACC15' },
];

const TEXT_POSITIONS = [
    { label: '상단', value: 'top' },
    { label: '중앙', value: 'center' },
    { label: '하단', value: 'bottom' },
];

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

    // Text overlay
    const [text, setText] = useState('');
    const [font, setFont] = useState('sans-serif');
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [textPos, setTextPos] = useState('bottom');
    const [textSize, setTextSize] = useState(24);

    const fileRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

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
        setText('');
        setFont('sans-serif');
        setTextColor('#FFFFFF');
        setTextPos('bottom');
        setTextSize(24);
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

        // Text overlay
        if (text.trim()) {
            const fontSize = textSize * scaleX;
            ctx.font = `bold ${fontSize}px ${font}`;
            ctx.textAlign = 'center';

            // Shadow
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillStyle = textColor;

            let y = outputH / 2;
            if (textPos === 'top') y = fontSize + 40;
            if (textPos === 'bottom') y = outputH - 40;

            ctx.fillText(text.trim(), outputW / 2, y);
            ctx.shadowColor = 'transparent';
        }

        return new Promise(resolve => {
            canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.92);
        });
    }, [imageSrc, zoom, panOffset, filterValues, text, font, textColor, textPos, textSize, isPortrait, previewW, previewH]);

    const handleFinalize = async () => {
        const blob = await renderFinal();
        if (blob) onFinalize(blob);
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
                                {text.trim() && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                        style={{
                                            alignItems: textPos === 'top' ? 'flex-start' : textPos === 'bottom' ? 'flex-end' : 'center',
                                            padding: '20px',
                                        }}>
                                        <p style={{
                                            fontFamily: font,
                                            fontSize: `${textSize}px`,
                                            color: textColor,
                                            fontWeight: 'bold',
                                            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                                            textAlign: 'center',
                                        }}>{text}</p>
                                    </div>
                                )}
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
                    <label className="text-xs font-medium text-slate-500 mb-2 block">크롭 비율</label>
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
                        <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <ZoomIn size={12} /> 확대/축소
                        </label>
                        <span className="text-xs text-slate-400">{zoom}%</span>
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
                    <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                        <SlidersHorizontal size={13} /> 이미지 필터
                    </h4>

                    {/* Presets */}
                    <div className="flex gap-1.5 mb-3 flex-wrap">
                        {FILTER_PRESETS.map(p => (
                            <button key={p.label} onClick={() => applyPreset(p)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${activePreset === p.label
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
                                <label className="text-xs text-slate-400">밝기</label>
                                <span className="text-xs text-slate-400">{filterValues.brightness}%</span>
                            </div>
                            <input type="range" min={50} max={150} value={filterValues.brightness}
                                onChange={e => handleFilterChange('brightness', Number(e.target.value))}
                                className="w-full accent-indigo-600" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-0.5">
                                <label className="text-xs text-slate-400">대비</label>
                                <span className="text-xs text-slate-400">{filterValues.contrast}%</span>
                            </div>
                            <input type="range" min={50} max={150} value={filterValues.contrast}
                                onChange={e => handleFilterChange('contrast', Number(e.target.value))}
                                className="w-full accent-indigo-600" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-0.5">
                                <label className="text-xs text-slate-400">채도</label>
                                <span className="text-xs text-slate-400">{filterValues.saturate}%</span>
                            </div>
                            <input type="range" min={0} max={200} value={filterValues.saturate}
                                onChange={e => handleFilterChange('saturate', Number(e.target.value))}
                                className="w-full accent-indigo-600" />
                        </div>
                    </div>
                </div>

                {/* Text overlay */}
                <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                        <Type size={13} /> 텍스트 추가 (선택)
                    </h4>
                    <input value={text} onChange={e => setText(e.target.value)}
                        placeholder="문구를 입력하세요"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none mb-3" />

                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">서체</label>
                            <select value={font} onChange={e => setFont(e.target.value)}
                                className="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs">
                                {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">색상</label>
                            <div className="flex gap-1.5">
                                {TEXT_COLORS.map(c => (
                                    <button key={c.value} onClick={() => setTextColor(c.value)}
                                        className={`w-7 h-7 rounded-full border ${textColor === c.value ? 'ring-2 ring-indigo-500 ring-offset-1' : 'border-slate-200'}`}
                                        style={{ backgroundColor: c.value }} title={c.label} />
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-xs text-slate-400 mb-1 block">위치</label>
                                <select value={textPos} onChange={e => setTextPos(e.target.value)}
                                    className="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs">
                                    {TEXT_POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-slate-400 mb-1 block">크기</label>
                                <input type="range" min={12} max={48} value={textSize}
                                    onChange={e => setTextSize(Number(e.target.value))}
                                    className="w-full accent-indigo-600 mt-2" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="space-y-2 pt-2">
                    <button onClick={handleFinalize} disabled={!imageSrc}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                        <Check size={16} /> 사진 확정하기
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
