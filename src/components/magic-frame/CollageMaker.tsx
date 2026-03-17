"use client";

import { useState, useRef, useCallback } from 'react';
import { Plus, RotateCcw, Check, X, LayoutGrid, Circle } from 'lucide-react';

interface CollageProps {
    onFinalize: (blob: Blob) => void;
}

const BG_COLORS = [
    { label: '화이트', value: '#FFFFFF', border: true },
    { label: '블랙', value: '#000000' },
    { label: '그레이', value: '#E2E8F0' },
    { label: '핑크', value: '#FBD5D5' },
    { label: '라벤더', value: '#DDD6FE' },
];

interface CellDef {
    x: number; y: number; w: number; h: number; // 0~1 비율
}

interface Layout {
    key: string;
    slots: number;
    cells: CellDef[];
}

const LAYOUTS: Layout[] = [
    // 1장
    {
        key: 'full',
        slots: 1,
        cells: [{ x: 0, y: 0, w: 1, h: 1 }],
    },
    // 2장
    {
        key: '2-lr',
        slots: 2,
        cells: [
            { x: 0, y: 0, w: 0.5, h: 1 },
            { x: 0.5, y: 0, w: 0.5, h: 1 },
        ],
    },
    {
        key: '2-tb',
        slots: 2,
        cells: [
            { x: 0, y: 0, w: 1, h: 0.5 },
            { x: 0, y: 0.5, w: 1, h: 0.5 },
        ],
    },
    // 3장
    {
        key: '3-1t2b',
        slots: 3,
        cells: [
            { x: 0, y: 0, w: 1, h: 0.5 },
            { x: 0, y: 0.5, w: 0.5, h: 0.5 },
            { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
        ],
    },
    {
        key: '3-2t1b',
        slots: 3,
        cells: [
            { x: 0, y: 0, w: 0.5, h: 0.5 },
            { x: 0.5, y: 0, w: 0.5, h: 0.5 },
            { x: 0, y: 0.5, w: 1, h: 0.5 },
        ],
    },
    {
        key: '3-vert',
        slots: 3,
        cells: [
            { x: 0, y: 0, w: 1, h: 1 / 3 },
            { x: 0, y: 1 / 3, w: 1, h: 1 / 3 },
            { x: 0, y: 2 / 3, w: 1, h: 1 / 3 },
        ],
    },
    // 4장
    {
        key: '4-grid',
        slots: 4,
        cells: [
            { x: 0, y: 0, w: 0.5, h: 0.5 },
            { x: 0.5, y: 0, w: 0.5, h: 0.5 },
            { x: 0, y: 0.5, w: 0.5, h: 0.5 },
            { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
        ],
    },
    {
        key: '4-1l3r',
        slots: 4,
        cells: [
            { x: 0, y: 0, w: 0.5, h: 1 },
            { x: 0.5, y: 0, w: 0.5, h: 1 / 3 },
            { x: 0.5, y: 1 / 3, w: 0.5, h: 1 / 3 },
            { x: 0.5, y: 2 / 3, w: 0.5, h: 1 / 3 },
        ],
    },
    {
        key: '4-3l1r',
        slots: 4,
        cells: [
            { x: 0, y: 0, w: 0.5, h: 1 / 3 },
            { x: 0, y: 1 / 3, w: 0.5, h: 1 / 3 },
            { x: 0, y: 2 / 3, w: 0.5, h: 1 / 3 },
            { x: 0.5, y: 0, w: 0.5, h: 1 },
        ],
    },
    {
        key: '4-1t3b',
        slots: 4,
        cells: [
            { x: 0, y: 0, w: 1, h: 0.5 },
            { x: 0, y: 0.5, w: 1 / 3, h: 0.5 },
            { x: 1 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
            { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
        ],
    },
];

function drawRoundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
) {
    if (r <= 0) { ctx.rect(x, y, w, h); return; }
    const rr = Math.min(r, w / 2, h / 2);
    if (typeof (ctx as unknown as { roundRect?: unknown }).roundRect === 'function') {
        (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(x, y, w, h, rr);
    } else {
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
    }
}

export function CollageMaker({ onFinalize }: CollageProps) {
    const [layout, setLayout] = useState<string>('4-grid');
    const [images, setImages] = useState<(string | null)[]>([null, null, null, null]);
    const [ratio, setRatio] = useState<'3:4' | '4:3'>('3:4');
    const [spacing, setSpacing] = useState(8);
    const [bgColor, setBgColor] = useState('#000000');
    const [cornerRadius, setCornerRadius] = useState(8);
    const [filterSlots, setFilterSlots] = useState<number | null>(null);
    const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

    const currentLayout = LAYOUTS.find(l => l.key === layout) ?? LAYOUTS[6];
    const filteredLayouts = filterSlots === null
        ? LAYOUTS
        : LAYOUTS.filter(l => l.slots === filterSlots);
    const slotImages = images.slice(0, currentLayout.slots);
    const hasAnyImage = slotImages.some(Boolean);

    const isPortrait = ratio === '3:4';
    const previewW = isPortrait ? 300 : 400;
    const previewH = isPortrait ? 400 : 300;

    const handleLayoutChange = (newKey: string) => {
        setLayout(newKey);
        const newSlots = LAYOUTS.find(l => l.key === newKey)!.slots;
        setImages(prev => {
            const next = [...prev];
            while (next.length < newSlots) next.push(null);
            return next;
        });
    };

    const handleFilterChange = (slots: number | null) => {
        setFilterSlots(slots);
        if (slots !== null && currentLayout.slots !== slots) {
            const first = LAYOUTS.find(l => l.slots === slots);
            if (first) handleLayoutChange(first.key);
        }
    };

    const handleAddImage = (index: number) => {
        fileRefs.current[index]?.click();
    };

    const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setImages(prev => {
                const next = [...prev];
                next[index] = reader.result as string;
                return next;
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const removeImage = (index: number) => {
        setImages(prev => {
            const next = [...prev];
            next[index] = null;
            return next;
        });
    };

    const reset = () => {
        setImages(Array(currentLayout.slots).fill(null));
        setSpacing(8);
        setBgColor('#000000');
        setCornerRadius(8);
    };

    const renderCollage = useCallback(async (): Promise<Blob | null> => {
        const outputW = isPortrait ? 2400 : 3200;
        const outputH = isPortrait ? 3200 : 2400;
        const gap = spacing * (outputW / previewW);
        const crScaled = cornerRadius * (outputW / previewW);

        const canvas = document.createElement('canvas');
        canvas.width = outputW;
        canvas.height = outputH;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, outputW, outputH);

        const positions = currentLayout.cells.map(c => ({
            x: c.x * outputW + gap / 2,
            y: c.y * outputH + gap / 2,
            w: c.w * outputW - gap,
            h: c.h * outputH - gap,
        }));

        const loadImg = (src: string): Promise<HTMLImageElement> =>
            new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });

        for (let i = 0; i < positions.length; i++) {
            if (!images[i]) continue;
            try {
                const img = await loadImg(images[i]!);
                const { x: cx, y: cy, w: cellW, h: cellH } = positions[i];
                const imgRatio = img.width / img.height;
                const cellRatio = cellW / cellH;
                let sw = img.width, sh = img.height, sx = 0, sy = 0;
                if (imgRatio > cellRatio) {
                    sw = img.height * cellRatio;
                    sx = (img.width - sw) / 2;
                } else {
                    sh = img.width / cellRatio;
                    sy = (img.height - sh) / 2;
                }
                ctx.save();
                ctx.beginPath();
                drawRoundRect(ctx, cx, cy, cellW, cellH, crScaled);
                ctx.clip();
                ctx.drawImage(img, sx, sy, sw, sh, cx, cy, cellW, cellH);
                ctx.restore();
            } catch { /* skip bad images */ }
        }

        return new Promise(resolve => {
            canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.92);
        });
    }, [images, bgColor, spacing, isPortrait, currentLayout, cornerRadius, previewW]);

    const handleFinalize = async () => {
        const blob = await renderCollage();
        if (blob) onFinalize(blob);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Preview */}
            <div className="flex-1 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 inline-block">
                    <div
                        className="relative overflow-hidden"
                        style={{
                            width: previewW,
                            height: previewH,
                            backgroundColor: bgColor,
                            borderRadius: 12,
                        }}
                    >
                        {currentLayout.cells.map((c, i) => {
                            const img = slotImages[i] ?? null;
                            const cellStyle: React.CSSProperties = {
                                position: 'absolute',
                                left: c.x * previewW + spacing / 2,
                                top: c.y * previewH + spacing / 2,
                                width: c.w * previewW - spacing,
                                height: c.h * previewH - spacing,
                                borderRadius: cornerRadius,
                                overflow: 'hidden',
                            };
                            return (
                                <div
                                    key={i}
                                    className="border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors group"
                                    onClick={() => !img && handleAddImage(i)}
                                    style={{
                                        ...cellStyle,
                                        backgroundColor: img
                                            ? 'transparent'
                                            : bgColor === '#FFFFFF' ? '#f8fafc' : 'rgba(255,255,255,0.1)',
                                    }}
                                >
                                    {img ? (
                                        <>
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                            <button
                                                onClick={e => { e.stopPropagation(); removeImage(i); }}
                                                className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} className="text-white" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <Plus size={18} className={bgColor === '#000000' ? 'text-white/50 mx-auto' : 'text-slate-400 mx-auto'} />
                                            <p className={`text-[10px] mt-0.5 ${bgColor === '#000000' ? 'text-white/50' : 'text-slate-400'}`}>사진 추가</p>
                                        </div>
                                    )}
                                    <input
                                        ref={el => { fileRefs.current[i] = el; }}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => handleFileChange(i, e)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="lg:w-72 space-y-5 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm h-fit">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="text-base">&#9881;</span> 콜라주 설정
                </h3>

                {/* Layout */}
                <div>
                    <label className="text-xs font-medium text-slate-500 mb-2 block flex items-center gap-1">
                        <LayoutGrid size={12} /> 레이아웃
                    </label>
                    {/* Filter Tabs */}
                    <div className="flex gap-1 mb-3 bg-slate-100 rounded-lg p-1">
                        {([null, 1, 2, 3, 4] as (number | null)[]).map(s => (
                            <button
                                key={s ?? 'all'}
                                onClick={() => handleFilterChange(s)}
                                className={`flex-1 py-1 rounded-md text-[11px] font-bold transition-all ${
                                    filterSlots === s
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {s === null ? '전체' : `${s}장`}
                            </button>
                        ))}
                    </div>
                    {/* Thumbnail Grid */}
                    <div className="grid grid-cols-5 gap-2">
                        {filteredLayouts.map(l => {
                            const isSelected = layout === l.key;
                            return (
                                <button
                                    key={l.key}
                                    onClick={() => handleLayoutChange(l.key)}
                                    className={`relative rounded-lg overflow-hidden transition-all ${
                                        isSelected
                                            ? 'ring-2 ring-indigo-500 ring-offset-1'
                                            : 'ring-1 ring-slate-200 hover:ring-indigo-300'
                                    }`}
                                    style={{ aspectRatio: isPortrait ? '3/4' : '4/3' }}
                                >
                                    <div className="absolute inset-0 bg-slate-100">
                                        {l.cells.map((c, i) => (
                                            <div
                                                key={i}
                                                className="absolute rounded-[2px]"
                                                style={{
                                                    left: `${c.x * 100 + 4}%`,
                                                    top: `${c.y * 100 + 4}%`,
                                                    width: `${c.w * 100 - 8}%`,
                                                    height: `${c.h * 100 - 8}%`,
                                                    backgroundColor: isSelected ? '#818cf8' : '#94a3b8',
                                                }}
                                            />
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Ratio */}
                <div>
                    <label className="text-xs font-medium text-slate-500 mb-2 block">콜라주 비율</label>
                    <div className="flex gap-2">
                        {(['3:4', '4:3'] as const).map(r => (
                            <button
                                key={r}
                                onClick={() => setRatio(r)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                    ratio === r
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200'
                                }`}
                            >
                                {r === '3:4' ? '3 : 4 (세로)' : '4 : 3 (가로)'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Spacing */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-slate-500">여백</label>
                        <span className="text-xs text-slate-400">{spacing}px</span>
                    </div>
                    <input
                        type="range" min={0} max={20} value={spacing}
                        onChange={e => setSpacing(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                    />
                </div>

                {/* Corner Radius */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <Circle size={10} /> 모서리 둥글기
                        </label>
                        <span className="text-xs text-slate-400">{cornerRadius}px</span>
                    </div>
                    <input
                        type="range" min={0} max={40} value={cornerRadius}
                        onChange={e => setCornerRadius(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                    />
                </div>

                {/* BG Color */}
                <div>
                    <label className="text-xs font-medium text-slate-500 mb-2 block">배경색</label>
                    <div className="flex gap-2">
                        {BG_COLORS.map(c => (
                            <button
                                key={c.value}
                                onClick={() => setBgColor(c.value)}
                                className={`w-9 h-9 rounded-full transition-all ${
                                    bgColor === c.value ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                                } ${c.border ? 'border border-slate-200' : ''}`}
                                style={{ backgroundColor: c.value }}
                                title={c.label}
                            />
                        ))}
                    </div>
                </div>

                {/* Buttons */}
                <div className="space-y-2 pt-2">
                    <button
                        onClick={handleFinalize}
                        disabled={!hasAnyImage}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        <Check size={16} /> 사진 확정하기
                    </button>
                    <button
                        onClick={reset}
                        className="w-full py-3 text-slate-400 font-medium rounded-xl hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <RotateCcw size={14} /> 초기화
                    </button>
                </div>
            </div>
        </div>
    );
}
