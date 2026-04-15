"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, RotateCcw, Check, X, LayoutGrid, Circle, Save, ArrowLeftRight, Camera, Type, Trash2 } from 'lucide-react';
import type { TextLayer } from './PhotoCropper';
import { PhotoCropModal } from './PhotoCropModal';
import {
    FONTS,
    DEFAULT_FONT,
    TEXT_COLORS,
    TEXT_PRESETS,
    DATE_FORMAT_KEYS,
    formatPickedDate,
    todayIso,
} from './textPresets';

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
    x: number; y: number; w: number; h: number;
}

interface Layout {
    key: string;
    slots: number;
    cells: CellDef[];
}

interface SlotTransform {
    zoom: number;
    x: number;
    y: number;
}

const DEFAULT_T: SlotTransform = { zoom: 1, x: 0, y: 0 };

const LAYOUTS: Layout[] = [
    { key: 'full', slots: 1, cells: [{ x: 0, y: 0, w: 1, h: 1 }] },
    { key: '2-lr', slots: 2, cells: [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }] },
    { key: '2-tb', slots: 2, cells: [{ x: 0, y: 0, w: 1, h: 0.5 }, { x: 0, y: 0.5, w: 1, h: 0.5 }] },
    {
        key: '3-1t2b', slots: 3, cells: [
            { x: 0, y: 0, w: 1, h: 0.5 },
            { x: 0, y: 0.5, w: 0.5, h: 0.5 },
            { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
        ],
    },
    {
        key: '3-2t1b', slots: 3, cells: [
            { x: 0, y: 0, w: 0.5, h: 0.5 },
            { x: 0.5, y: 0, w: 0.5, h: 0.5 },
            { x: 0, y: 0.5, w: 1, h: 0.5 },
        ],
    },
    {
        key: '3-vert', slots: 3, cells: [
            { x: 0, y: 0, w: 1, h: 1 / 3 },
            { x: 0, y: 1 / 3, w: 1, h: 1 / 3 },
            { x: 0, y: 2 / 3, w: 1, h: 1 / 3 },
        ],
    },
    {
        key: '4-grid', slots: 4, cells: [
            { x: 0, y: 0, w: 0.5, h: 0.5 },
            { x: 0.5, y: 0, w: 0.5, h: 0.5 },
            { x: 0, y: 0.5, w: 0.5, h: 0.5 },
            { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
        ],
    },
    {
        key: '4-1l3r', slots: 4, cells: [
            { x: 0, y: 0, w: 0.5, h: 1 },
            { x: 0.5, y: 0, w: 0.5, h: 1 / 3 },
            { x: 0.5, y: 1 / 3, w: 0.5, h: 1 / 3 },
            { x: 0.5, y: 2 / 3, w: 0.5, h: 1 / 3 },
        ],
    },
    {
        key: '4-3l1r', slots: 4, cells: [
            { x: 0, y: 0, w: 0.5, h: 1 / 3 },
            { x: 0, y: 1 / 3, w: 0.5, h: 1 / 3 },
            { x: 0, y: 2 / 3, w: 0.5, h: 1 / 3 },
            { x: 0.5, y: 0, w: 0.5, h: 1 },
        ],
    },
    {
        key: '4-1t3b', slots: 4, cells: [
            { x: 0, y: 0, w: 1, h: 0.5 },
            { x: 0, y: 0.5, w: 1 / 3, h: 0.5 },
            { x: 1 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
            { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
        ],
    },
    // ── 2슬롯 비대칭 (매거진) ──
    {
        key: '2-lr-wide', slots: 2, cells: [
            { x: 0, y: 0, w: 0.6, h: 1 },
            { x: 0.6, y: 0, w: 0.4, h: 1 },
        ],
    },
    {
        key: '2-tb-wide', slots: 2, cells: [
            { x: 0, y: 0, w: 1, h: 0.6 },
            { x: 0, y: 0.6, w: 1, h: 0.4 },
        ],
    },
    // ── 3슬롯 추가 ──
    {
        key: '3-1l2r', slots: 3, cells: [
            { x: 0, y: 0, w: 0.5, h: 1 },
            { x: 0.5, y: 0, w: 0.5, h: 0.5 },
            { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
        ],
    },
    {
        key: '3-2l1r', slots: 3, cells: [
            { x: 0, y: 0, w: 0.5, h: 0.5 },
            { x: 0, y: 0.5, w: 0.5, h: 0.5 },
            { x: 0.5, y: 0, w: 0.5, h: 1 },
        ],
    },
    {
        key: '3-horiz', slots: 3, cells: [
            { x: 0, y: 0, w: 1 / 3, h: 1 },
            { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
            { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
        ],
    },
    // ── 4슬롯 추가 ──
    {
        key: '4-horiz', slots: 4, cells: [
            { x: 0, y: 0, w: 0.25, h: 1 },
            { x: 0.25, y: 0, w: 0.25, h: 1 },
            { x: 0.5, y: 0, w: 0.25, h: 1 },
            { x: 0.75, y: 0, w: 0.25, h: 1 },
        ],
    },
];

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

function getTouchDist(touches: Map<number, { x: number; y: number }>) {
    const [a, b] = Array.from(touches.values());
    return Math.hypot(a.x - b.x, a.y - b.y);
}

export function CollageMaker({ onFinalize }: CollageProps) {
    const [layout, setLayout] = useState<string>('4-grid');
    const [images, setImages] = useState<(string | null)[]>(Array(4).fill(null));
    const [ratio, setRatio] = useState<'3:4' | '4:3'>('3:4');
    const [spacing, setSpacing] = useState(0);
    const [bgColor, setBgColor] = useState('#FFFFFF');
    const [cornerRadius, setCornerRadius] = useState(0);
    const [filterSlots, setFilterSlots] = useState<number | null>(null);
    const [transforms, setTransforms] = useState<SlotTransform[]>(
        Array(4).fill(null).map(() => ({ ...DEFAULT_T }))
    );
    const [swapMode, setSwapMode] = useState(false);
    const [swapFrom, setSwapFrom] = useState<number | null>(null);
    const [savedToast, setSavedToast] = useState(false);
    const [texts, setTexts] = useState<TextLayer[]>([]);
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
    const [pickedDate, setPickedDate] = useState<string>(() => todayIso());
    const [pendingCrop, setPendingCrop] = useState<{ src: string; index: number; aspect: number } | null>(null);
    const selectedText = texts.find(t => t.id === selectedTextId) ?? null;
    const textDragRef = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);

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
        if (!d || !previewContainerRef.current) return;
        const rect = previewContainerRef.current.getBoundingClientRect();
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

    const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
    const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
    const dragRef = useRef<Map<number, { sx: number; sy: number; ox: number; oy: number }>>(new Map());
    const touchesRef = useRef<Map<number, Map<number, { x: number; y: number }>>>(new Map());
    const pinchRef = useRef<Map<number, { startDist: number; startZoom: number }>>(new Map());

    const currentLayout =
        LAYOUTS.find(l => l.key === layout) ??
        LAYOUTS.find(l => l.key === '4-grid') ??
        LAYOUTS[0];
    const filteredLayouts = filterSlots === null ? LAYOUTS : LAYOUTS.filter(l => l.slots === filterSlots);
    const slotImages = images.slice(0, currentLayout.slots);
    const hasAnyImage = slotImages.some(Boolean);

    const isPortrait = ratio === '3:4';
    const previewW = isPortrait ? 300 : 400;
    const previewH = isPortrait ? 400 : 300;

    // 임시 저장 불러오기
    useEffect(() => {
        try {
            const saved = localStorage.getItem('magic_frame_collage_draft');
            if (!saved) return;
            const draft = JSON.parse(saved);
            // draft.layout 기준으로 필요한 슬롯 수 결정 (없으면 현재 기본값)
            const savedLayoutKey = typeof draft.layout === 'string' ? draft.layout : null;
            const savedLayout = savedLayoutKey ? LAYOUTS.find(l => l.key === savedLayoutKey) : null;
            const targetSlots = savedLayout?.slots ?? 4;
            if (savedLayoutKey) setLayout(savedLayoutKey);
            if (Array.isArray(draft.images)) {
                const padded = Array(targetSlots).fill(null).map((_, i) => draft.images[i] ?? null);
                setImages(padded);
            }
            if (draft.ratio) setRatio(draft.ratio);
            if (draft.spacing !== undefined) setSpacing(draft.spacing);
            if (draft.bgColor) setBgColor(draft.bgColor);
            if (draft.cornerRadius !== undefined) setCornerRadius(draft.cornerRadius);
            if (Array.isArray(draft.transforms)) {
                const padded = Array(targetSlots).fill(null).map((_, i) => {
                    const t = draft.transforms[i];
                    return t && typeof t === 'object' ? { ...DEFAULT_T, ...t } : { ...DEFAULT_T };
                });
                setTransforms(padded);
            }
            if (Array.isArray(draft.texts)) setTexts(draft.texts);
        } catch { /* ignore */ }
    }, []);

    // 슬롯별 wheel 이벤트 (passive:false)
    useEffect(() => {
        const cleanups: (() => void)[] = [];
        slotRefs.current.forEach((el, i) => {
            if (!el) return;
            const fn = (e: WheelEvent) => {
                if (!images[i]) return;
                e.preventDefault();
                setTransforms(prev => {
                    const n = [...prev];
                    const newZoom = Math.min(3, Math.max(1, n[i].zoom - e.deltaY * 0.005));
                    const cell = currentLayout.cells[i];
                    if (!cell) return n;
                    const maxX = (cell.w * previewW - spacing) * (newZoom - 1) / 2;
                    const maxY = (cell.h * previewH - spacing) * (newZoom - 1) / 2;
                    n[i] = {
                        zoom: newZoom,
                        x: Math.max(-maxX, Math.min(maxX, n[i].x)),
                        y: Math.max(-maxY, Math.min(maxY, n[i].y)),
                    };
                    return n;
                });
            };
            el.addEventListener('wheel', fn, { passive: false });
            cleanups.push(() => el.removeEventListener('wheel', fn));
        });
        return () => cleanups.forEach(c => c());
    }, [images, currentLayout, previewW, previewH, spacing]);

    const clampPan = useCallback((index: number, x: number, y: number, zoom: number) => {
        const cell = currentLayout.cells[index];
        if (!cell) return { x: 0, y: 0 };
        const maxX = (cell.w * previewW - spacing) * (zoom - 1) / 2;
        const maxY = (cell.h * previewH - spacing) * (zoom - 1) / 2;
        return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
    }, [currentLayout, previewW, previewH, spacing]);

    const updateTransform = useCallback((i: number, patch: Partial<SlotTransform>) => {
        setTransforms(prev => { const n = [...prev]; n[i] = { ...n[i], ...patch }; return n; });
    }, []);

    const handlePointerDown = useCallback((e: React.PointerEvent, i: number) => {
        if (!images[i] || swapMode) return;
        e.stopPropagation();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        const touches = touchesRef.current.get(i) ?? new Map();
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        touchesRef.current.set(i, touches);
        if (touches.size === 1) {
            dragRef.current.set(i, { sx: e.clientX, sy: e.clientY, ox: transforms[i].x, oy: transforms[i].y });
        } else if (touches.size === 2) {
            dragRef.current.delete(i);
            pinchRef.current.set(i, { startDist: getTouchDist(touches), startZoom: transforms[i].zoom });
        }
    }, [images, swapMode, transforms]);

    const handlePointerMove = useCallback((e: React.PointerEvent, i: number) => {
        const touches = touchesRef.current.get(i);
        if (!touches) return;
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (touches.size >= 2) {
            const pinch = pinchRef.current.get(i);
            if (!pinch || pinch.startDist === 0) return;
            const newZoom = Math.min(3, Math.max(1, pinch.startZoom * (getTouchDist(touches) / pinch.startDist)));
            setTransforms(prev => {
                const n = [...prev];
                const cell = currentLayout.cells[i];
                if (!cell) return n;
                const maxX = (cell.w * previewW - spacing) * (newZoom - 1) / 2;
                const maxY = (cell.h * previewH - spacing) * (newZoom - 1) / 2;
                n[i] = {
                    zoom: newZoom,
                    x: Math.max(-maxX, Math.min(maxX, n[i].x)),
                    y: Math.max(-maxY, Math.min(maxY, n[i].y)),
                };
                return n;
            });
        } else {
            const drag = dragRef.current.get(i);
            if (!drag) return;
            const nx = drag.ox + e.clientX - drag.sx;
            const ny = drag.oy + e.clientY - drag.sy;
            updateTransform(i, clampPan(i, nx, ny, transforms[i].zoom));
        }
    }, [currentLayout, previewW, previewH, spacing, transforms, updateTransform, clampPan]);

    const handlePointerUp = useCallback((e: React.PointerEvent, i: number) => {
        const touches = touchesRef.current.get(i);
        if (touches) {
            touches.delete(e.pointerId);
            if (touches.size === 0) {
                dragRef.current.delete(i);
                pinchRef.current.delete(i);
            }
        }
    }, []);

    const handleSwapClick = useCallback((i: number) => {
        if (!images[i]) return;
        if (swapFrom === null) { setSwapFrom(i); return; }
        if (swapFrom === i) { setSwapFrom(null); return; }
        setImages(prev => { const n = [...prev]; [n[swapFrom], n[i]] = [n[i], n[swapFrom]]; return n; });
        setTransforms(prev => { const n = [...prev]; [n[swapFrom], n[i]] = [n[i], n[swapFrom]]; return n; });
        setSwapFrom(null);
        setSwapMode(false);
    }, [images, swapFrom]);

    const handleLayoutChange = (newKey: string) => {
        setLayout(newKey);
        const newSlots = LAYOUTS.find(l => l.key === newKey)!.slots;
        setImages(prev => {
            const next = [...prev];
            while (next.length < newSlots) next.push(null);
            return next;
        });
        setTransforms(prev => {
            const next = [...prev];
            while (next.length < newSlots) next.push({ ...DEFAULT_T });
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

    const handleAddImage = (index: number) => fileRefs.current[index]?.click();

    const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const src = reader.result as string;
            const cell = currentLayout.cells[index];
            if (!cell) return;
            const cellW = cell.w * previewW;
            const cellH = cell.h * previewH;
            const aspect = cellW / cellH;
            setPendingCrop({ src, index, aspect });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCropApply = (croppedDataUrl: string) => {
        if (!pendingCrop) return;
        const i = pendingCrop.index;
        setImages(prev => { const next = [...prev]; next[i] = croppedDataUrl; return next; });
        setTransforms(prev => { const next = [...prev]; next[i] = { ...DEFAULT_T }; return next; });
        setPendingCrop(null);
    };

    const handleCropCancel = () => setPendingCrop(null);

    const removeImage = (index: number) => {
        setImages(prev => { const next = [...prev]; next[index] = null; return next; });
        setTransforms(prev => { const next = [...prev]; next[index] = { ...DEFAULT_T }; return next; });
    };

    const reset = () => {
        setImages(Array(currentLayout.slots).fill(null));
        setTransforms(Array(currentLayout.slots).fill(null).map(() => ({ ...DEFAULT_T })));
        setSpacing(0);
        setBgColor('#FFFFFF');
        setCornerRadius(0);
        setSwapMode(false);
        setSwapFrom(null);
        setTexts([]);
        setSelectedTextId(null);
        localStorage.removeItem('magic_frame_collage_draft');
    };

    const handleTempSave = () => {
        const draft = { layout, images, ratio, spacing, bgColor, cornerRadius, transforms, texts };
        localStorage.setItem('magic_frame_collage_draft', JSON.stringify(draft));
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2000);
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
                const t = transforms[i] ?? DEFAULT_T;

                // 1. center-crop 기준값 계산
                const imgRatio = img.width / img.height;
                const cellRatio = cellW / cellH;
                let baseSW = img.width, baseSH = img.height, baseSX = 0, baseSY = 0;
                if (imgRatio > cellRatio) {
                    baseSW = img.height * cellRatio;
                    baseSX = (img.width - baseSW) / 2;
                } else {
                    baseSH = img.width / cellRatio;
                    baseSY = (img.height - baseSH) / 2;
                }

                // 2. zoom 적용 (zoom > 1이면 더 좁은 소스 영역 사용)
                const sw = baseSW / t.zoom;
                const sh = baseSH / t.zoom;

                // 3. pan 적용 (프리뷰 px → 캔버스 소스 px 변환)
                const previewCellW = currentLayout.cells[i].w * previewW - spacing;
                const previewCellH = currentLayout.cells[i].h * previewH - spacing;
                const srcPanX = t.x * sw / previewCellW;
                const srcPanY = t.y * sh / previewCellH;

                let sx = baseSX + (baseSW - sw) / 2 - srcPanX;
                let sy = baseSY + (baseSH - sh) / 2 - srcPanY;
                sx = Math.max(0, Math.min(img.width - sw, sx));
                sy = Math.max(0, Math.min(img.height - sh, sy));

                ctx.save();
                ctx.beginPath();
                drawRoundRect(ctx, cx, cy, cellW, cellH, crScaled);
                ctx.clip();
                ctx.drawImage(img, sx, sy, sw, sh, cx, cy, cellW, cellH);
                ctx.restore();
            } catch { /* skip bad images */ }
        }

        // 텍스트 오버레이 (다중 레이어)
        const scaleX = outputW / previewW;
        if (typeof document !== 'undefined' && (document as any).fonts?.load) {
            const pairs = Array.from(new Set(
                texts.filter(t => t.content.trim()).map(t => `400 ${Math.round(t.size * scaleX)}px ${t.font}`)
            ));
            await Promise.all(pairs.map(f => (document as any).fonts.load(f))).catch(() => { });
        }
        for (const t of texts) {
            if (!t.content.trim()) continue;
            const fontSize = t.size * scaleX;
            ctx.font = `400 ${fontSize}px ${t.font}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 6 * scaleX;
            ctx.shadowOffsetX = 2 * scaleX;
            ctx.shadowOffsetY = 2 * scaleX;
            ctx.fillStyle = t.color;
            ctx.fillText(t.content.trim(), t.x * outputW, t.y * outputH);
        }
        ctx.shadowColor = 'transparent';

        return new Promise(resolve => {
            canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.92);
        });
    }, [images, transforms, bgColor, spacing, isPortrait, currentLayout, cornerRadius, previewW, previewH, texts]);

    const handleFinalize = async () => {
        const blob = await renderCollage();
        if (blob) {
            localStorage.removeItem('magic_frame_collage_draft');
            onFinalize(blob);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Preview */}
            <div className="flex-1 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 inline-block">
                    {swapMode && (
                        <div className="text-center mb-2 text-sm font-bold text-amber-600 bg-amber-50 rounded-lg py-1.5 px-3">
                            {swapFrom === null ? '교환할 첫 번째 사진을 선택하세요' : '교환할 두 번째 사진을 선택하세요'}
                        </div>
                    )}
                    <div
                        ref={previewContainerRef}
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
                            const t = transforms[i] ?? DEFAULT_T;
                            const isSwapSelected = swapMode && swapFrom === i;
                            const isSwapTarget = swapMode && swapFrom !== null && swapFrom !== i && !!img;
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
                                    className={`border-2 border-dashed flex items-center justify-center group transition-all ${
                                        isSwapSelected
                                            ? 'border-amber-500 ring-2 ring-amber-400'
                                            : isSwapTarget
                                                ? 'border-amber-300 ring-2 ring-amber-200 cursor-pointer'
                                                : 'border-slate-300 hover:border-indigo-400'
                                    }`}
                                    onClick={() => {
                                        if (swapMode) { handleSwapClick(i); return; }
                                        if (!img) handleAddImage(i);
                                    }}
                                    style={{
                                        ...cellStyle,
                                        backgroundColor: img
                                            ? 'transparent'
                                            : bgColor === '#FFFFFF' ? '#f8fafc' : 'rgba(255,255,255,0.1)',
                                        cursor: swapMode ? (img ? 'pointer' : 'default') : (img ? (t.zoom > 1 ? 'grab' : 'default') : 'pointer'),
                                    }}
                                >
                                    {img ? (
                                        <>
                                            {/* 드래그/줌 컨테이너 */}
                                            <div
                                                ref={el => { slotRefs.current[i] = el; }}
                                                className="absolute inset-0 overflow-hidden"
                                                style={{ touchAction: 'none' }}
                                                onPointerDown={e => handlePointerDown(e, i)}
                                                onPointerMove={e => handlePointerMove(e, i)}
                                                onPointerUp={e => handlePointerUp(e, i)}
                                                onPointerCancel={e => handlePointerUp(e, i)}
                                            >
                                                <img
                                                    src={img}
                                                    alt=""
                                                    draggable={false}
                                                    style={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        pointerEvents: 'none',
                                                        userSelect: 'none',
                                                        transform: `translate(${t.x}px, ${t.y}px) scale(${t.zoom})`,
                                                        transformOrigin: 'center',
                                                    }}
                                                />
                                            </div>
                                            {/* 툴바 버튼 (교체 + 삭제) */}
                                            {!swapMode && (
                                                <div className="absolute top-1 right-1 flex gap-1 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={e => { e.stopPropagation(); handleAddImage(i); }}
                                                        className="w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                                                    >
                                                        <Camera size={10} className="text-white" />
                                                    </button>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); removeImage(i); }}
                                                        className="w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                                                    >
                                                        <X size={10} className="text-white" />
                                                    </button>
                                                </div>
                                            )}
                                            {/* zoom 인디케이터 */}
                                            {!swapMode && t.zoom > 1.05 && (
                                                <div className="absolute bottom-1 left-1 z-10 bg-black/50 text-white text-xs font-bold rounded px-1 py-0.5 pointer-events-none">
                                                    {Math.round(t.zoom * 100)}%
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center pointer-events-none">
                                            <Plus size={18} className={bgColor === '#000000' ? 'text-white/50 mx-auto' : 'text-slate-400 mx-auto'} />
                                            <p className={`text-xs mt-0.5 ${bgColor === '#000000' ? 'text-white/50' : 'text-slate-400'}`}>사진 추가</p>
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
                        {/* 텍스트 오버레이 (다중 레이어, 드래그 가능) */}
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
                    <label className="text-sm font-medium text-slate-500 mb-2 block flex items-center gap-1">
                        <LayoutGrid size={12} /> 레이아웃
                    </label>
                    <div className="flex gap-1 mb-3 bg-slate-100 rounded-lg p-1">
                        {([null, 1, 2, 3, 4] as (number | null)[]).map(s => (
                            <button
                                key={s ?? 'all'}
                                onClick={() => handleFilterChange(s)}
                                className={`flex-1 py-1 rounded-md text-xs font-bold transition-all ${
                                    filterSlots === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {s === null ? '전체' : `${s}장`}
                            </button>
                        ))}
                    </div>
                    <div className="overflow-x-auto -mx-1 px-1 pb-2 scrollbar-hide">
                        <div className="flex gap-2" style={{ width: 'max-content' }}>
                            {filteredLayouts.map(l => {
                                const isSelected = layout === l.key;
                                const w = isPortrait ? 48 : 60;
                                const h = isPortrait ? 60 : 48;
                                return (
                                    <button
                                        key={l.key}
                                        onClick={() => handleLayoutChange(l.key)}
                                        className={`relative flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                                            isSelected ? 'ring-2 ring-indigo-500 ring-offset-1' : 'ring-1 ring-slate-200 hover:ring-indigo-300'
                                        }`}
                                        style={{ width: w, height: h }}
                                    >
                                        <div className="absolute inset-0 bg-slate-100">
                                            {l.cells.map((c, i) => (
                                                <div
                                                    key={i}
                                                    className="absolute rounded-[2px]"
                                                    style={{
                                                        left: `${c.x * 100 + 5}%`,
                                                        top: `${c.y * 100 + 5}%`,
                                                        width: `${c.w * 100 - 10}%`,
                                                        height: `${c.h * 100 - 10}%`,
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
                </div>

                {/* Ratio */}
                <div>
                    <label className="text-sm font-medium text-slate-500 mb-2 block">콜라주 비율</label>
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
                        <label className="text-sm font-medium text-slate-500">여백</label>
                        <span className="text-sm text-slate-400">{spacing}px</span>
                    </div>
                    <input type="range" min={0} max={20} value={spacing}
                        onChange={e => setSpacing(Number(e.target.value))}
                        className="w-full accent-indigo-600" />
                </div>

                {/* Corner Radius */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-500 flex items-center gap-1">
                            <Circle size={10} /> 모서리 둥글기
                        </label>
                        <span className="text-sm text-slate-400">{cornerRadius}px</span>
                    </div>
                    <input type="range" min={0} max={40} value={cornerRadius}
                        onChange={e => setCornerRadius(Number(e.target.value))}
                        className="w-full accent-indigo-600" />
                </div>

                {/* BG Color */}
                <div>
                    <label className="text-sm font-medium text-slate-500 mb-2 block">배경색</label>
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
                    <button
                        onClick={handleFinalize}
                        disabled={!hasAnyImage}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        <Check size={16} /> 사진 확정하기
                    </button>
                    <button
                        onClick={() => { setSwapMode(p => !p); setSwapFrom(null); }}
                        disabled={slotImages.filter(Boolean).length < 2}
                        className={`w-full py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-40 ${
                            swapMode
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                        }`}
                    >
                        <ArrowLeftRight size={14} />
                        {swapMode ? '순서 변경 중... (취소)' : '사진 순서 변경'}
                    </button>
                    <button
                        onClick={handleTempSave}
                        disabled={!hasAnyImage}
                        className="w-full py-3 bg-white text-indigo-600 border border-indigo-200 font-medium rounded-xl hover:bg-indigo-50 transition-all disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
                    >
                        <Save size={14} /> {savedToast ? '저장 완료!' : '임시 저장하기'}
                    </button>
                    <button
                        onClick={reset}
                        className="w-full py-3 text-slate-400 font-medium rounded-xl hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <RotateCcw size={14} /> 초기화
                    </button>
                </div>
            </div>
            {pendingCrop && (
                <PhotoCropModal
                    imageSrc={pendingCrop.src}
                    aspect={pendingCrop.aspect}
                    onApply={handleCropApply}
                    onCancel={handleCropCancel}
                />
            )}
        </div>
    );
}
