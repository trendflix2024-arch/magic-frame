"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Plus, X, Crop, RefreshCw, Move } from 'lucide-react';
import type { TextLayer } from './PhotoCropper';
import { PhotoCropModal } from './PhotoCropModal';
import {
    DEFAULT_FONT,
    todayIso,
} from './textPresets';
import type { ControlsProps } from './collage/types';
import { TabbedControls } from './collage/TabbedControls';
import { saveDraftValue, loadDraftValue, clearDraftValue } from '@/lib/magic-frame-draft-storage';
import { ensureJpeg, isHeic } from '@/lib/heic-convert';

const DRAFT_IMAGES_KEY = 'collage_images';

interface CollageProps {
    onFinalize: (blob: Blob) => void;
}

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
    // ── 5슬롯 ──
    {
        key: '5-1t4b', slots: 5, cells: [
            { x: 0, y: 0, w: 1, h: 0.5 },
            { x: 0, y: 0.5, w: 0.25, h: 0.5 },
            { x: 0.25, y: 0.5, w: 0.25, h: 0.5 },
            { x: 0.5, y: 0.5, w: 0.25, h: 0.5 },
            { x: 0.75, y: 0.5, w: 0.25, h: 0.5 },
        ],
    },
    {
        key: '5-1l4r', slots: 5, cells: [
            { x: 0, y: 0, w: 0.5, h: 1 },
            { x: 0.5, y: 0, w: 0.5, h: 0.25 },
            { x: 0.5, y: 0.25, w: 0.5, h: 0.25 },
            { x: 0.5, y: 0.5, w: 0.5, h: 0.25 },
            { x: 0.5, y: 0.75, w: 0.5, h: 0.25 },
        ],
    },
    // ── 6슬롯 ──
    {
        key: '6-3x2', slots: 6, cells: [
            { x: 0, y: 0, w: 1 / 3, h: 0.5 },
            { x: 1 / 3, y: 0, w: 1 / 3, h: 0.5 },
            { x: 2 / 3, y: 0, w: 1 / 3, h: 0.5 },
            { x: 0, y: 0.5, w: 1 / 3, h: 0.5 },
            { x: 1 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
            { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
        ],
    },
    {
        key: '6-2x3', slots: 6, cells: [
            { x: 0, y: 0, w: 0.5, h: 1 / 3 },
            { x: 0.5, y: 0, w: 0.5, h: 1 / 3 },
            { x: 0, y: 1 / 3, w: 0.5, h: 1 / 3 },
            { x: 0.5, y: 1 / 3, w: 0.5, h: 1 / 3 },
            { x: 0, y: 2 / 3, w: 0.5, h: 1 / 3 },
            { x: 0.5, y: 2 / 3, w: 0.5, h: 1 / 3 },
        ],
    },
    // ── 7슬롯 ──
    {
        key: '7-1t6b', slots: 7, cells: [
            { x: 0, y: 0, w: 1, h: 0.4 },
            { x: 0, y: 0.4, w: 1 / 3, h: 0.3 },
            { x: 1 / 3, y: 0.4, w: 1 / 3, h: 0.3 },
            { x: 2 / 3, y: 0.4, w: 1 / 3, h: 0.3 },
            { x: 0, y: 0.7, w: 1 / 3, h: 0.3 },
            { x: 1 / 3, y: 0.7, w: 1 / 3, h: 0.3 },
            { x: 2 / 3, y: 0.7, w: 1 / 3, h: 0.3 },
        ],
    },
    // ── 8슬롯 ──
    {
        key: '8-4x2', slots: 8, cells: [
            { x: 0, y: 0, w: 0.25, h: 0.5 },
            { x: 0.25, y: 0, w: 0.25, h: 0.5 },
            { x: 0.5, y: 0, w: 0.25, h: 0.5 },
            { x: 0.75, y: 0, w: 0.25, h: 0.5 },
            { x: 0, y: 0.5, w: 0.25, h: 0.5 },
            { x: 0.25, y: 0.5, w: 0.25, h: 0.5 },
            { x: 0.5, y: 0.5, w: 0.25, h: 0.5 },
            { x: 0.75, y: 0.5, w: 0.25, h: 0.5 },
        ],
    },
    {
        key: '8-2x4', slots: 8, cells: [
            { x: 0, y: 0, w: 0.5, h: 0.25 },
            { x: 0.5, y: 0, w: 0.5, h: 0.25 },
            { x: 0, y: 0.25, w: 0.5, h: 0.25 },
            { x: 0.5, y: 0.25, w: 0.5, h: 0.25 },
            { x: 0, y: 0.5, w: 0.5, h: 0.25 },
            { x: 0.5, y: 0.5, w: 0.5, h: 0.25 },
            { x: 0, y: 0.75, w: 0.5, h: 0.25 },
            { x: 0.5, y: 0.75, w: 0.5, h: 0.25 },
        ],
    },
    // ── 9슬롯 ──
    {
        key: '9-grid', slots: 9, cells: [
            { x: 0, y: 0, w: 1 / 3, h: 1 / 3 },
            { x: 1 / 3, y: 0, w: 1 / 3, h: 1 / 3 },
            { x: 2 / 3, y: 0, w: 1 / 3, h: 1 / 3 },
            { x: 0, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
            { x: 1 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
            { x: 2 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
            { x: 0, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
            { x: 1 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
            { x: 2 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
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
    const [images, setImages] = useState<(string | null)[]>(Array(9).fill(null));
    const [ratio, setRatio] = useState<'3:4' | '4:3'>('3:4');
    const [spacing, setSpacing] = useState(0);
    const [bgColor, setBgColor] = useState('#FFFFFF');
    const [cornerRadius, setCornerRadius] = useState(0);
    const [filterSlots, setFilterSlots] = useState<number | null>(null);
    const [transforms, setTransforms] = useState<SlotTransform[]>(
        Array(9).fill(null).map(() => ({ ...DEFAULT_T }))
    );
    const [swapMode, setSwapMode] = useState(false);
    const [swapFrom, setSwapFrom] = useState<number | null>(null);
    const [savedToast, setSavedToast] = useState(false);
    const [texts, setTexts] = useState<TextLayer[]>([]);
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
    const [pickedDate, setPickedDate] = useState<string>(() => todayIso());
    const [pendingCrop, setPendingCrop] = useState<{ src: string; index: number; aspect: number } | null>(null);
    // 슬롯별 크롭 전 원본 (재편집 시 화질 손실 없이 다시 자르기 위함). 임시저장엔 포함 안 됨 → 없으면 현재 이미지로 편집.
    const [originals, setOriginals] = useState<(string | null)[]>([]);
    const selectedText = texts.find(t => t.id === selectedTextId) ?? null;
    const textDragRef = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // 제스처 중 페이지 스크롤 락 — slot 드래그/핀치 + text 드래그 시 활성
    const gestureCountRef = useRef(0);
    const acquireScrollLock = useCallback(() => {
        gestureCountRef.current += 1;
        if (gestureCountRef.current === 1 && typeof document !== 'undefined') {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        }
    }, []);
    const releaseScrollLock = useCallback(() => {
        gestureCountRef.current = Math.max(0, gestureCountRef.current - 1);
        if (gestureCountRef.current === 0 && typeof document !== 'undefined') {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }
    }, []);
    useEffect(() => () => {
        if (typeof document !== 'undefined') {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }
    }, []);

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
        acquireScrollLock();
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
        if (textDragRef.current) {
            textDragRef.current = null;
            releaseScrollLock();
        }
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
    // 뷰포트 기반 동적 미리보기 — Samsung 표시 크기 최대 / 좁은 화면 가로 스크롤 방지
    const [vpW, setVpW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024);
    useEffect(() => {
        const onResize = () => setVpW(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    const portraitMax = 300, landscapeMax = 400;
    const available = vpW - 80; // 페이지 패딩(32) + 카드 패딩(32) + 여유(16)
    const previewW = Math.max(220, Math.min(isPortrait ? portraitMax : landscapeMax, available));
    const previewH = isPortrait ? Math.round(previewW * 4 / 3) : Math.round(previewW * 3 / 4);

    // 임시 저장 불러오기 — 설정은 localStorage, 이미지 배열은 IndexedDB
    useEffect(() => {
        (async () => {
            try {
                const saved = localStorage.getItem('magic_frame_collage_draft');
                let savedLayoutKey: string | null = null;
                let targetSlots = 4;
                if (saved) {
                    const draft = JSON.parse(saved);
                    savedLayoutKey = typeof draft.layout === 'string' ? draft.layout : null;
                    const savedLayout = savedLayoutKey ? LAYOUTS.find(l => l.key === savedLayoutKey) : null;
                    targetSlots = savedLayout?.slots ?? 4;
                    if (savedLayoutKey) setLayout(savedLayoutKey);
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
                }
                const imgRaw = await loadDraftValue(DRAFT_IMAGES_KEY);
                if (imgRaw) {
                    const arr: (string | null)[] = JSON.parse(imgRaw);
                    if (Array.isArray(arr)) {
                        const padded = Array(targetSlots).fill(null).map((_, i) => arr[i] ?? null);
                        setImages(padded);
                    }
                }
            } catch { /* ignore */ }
        })();
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
        const wasEmpty = touches.size === 0;
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        touchesRef.current.set(i, touches);
        if (touches.size === 1) {
            dragRef.current.set(i, { sx: e.clientX, sy: e.clientY, ox: transforms[i].x, oy: transforms[i].y });
        } else if (touches.size === 2) {
            dragRef.current.delete(i);
            pinchRef.current.set(i, { startDist: getTouchDist(touches), startZoom: transforms[i].zoom });
        }
        if (wasEmpty) acquireScrollLock();
    }, [images, swapMode, transforms, acquireScrollLock]);

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
        if (touches && touches.has(e.pointerId)) {
            touches.delete(e.pointerId);
            if (touches.size === 0) {
                dragRef.current.delete(i);
                pinchRef.current.delete(i);
                releaseScrollLock();
            }
        }
    }, [releaseScrollLock]);

    // 두 슬롯의 사진 맞바꾸기 (b 가 빈 칸이면 이동)
    const swapSlots = useCallback((a: number, b: number) => {
        setImages(prev => { const n = [...prev]; [n[a], n[b]] = [n[b] ?? null, n[a] ?? null]; return n; });
        // 칸 크기가 다르면 기존 pan 값이 새 칸 범위를 넘을 수 있어 재클램프 (미리보기·출력 불일치 방지)
        const fit = (t: SlotTransform | undefined, idx: number): SlotTransform => {
            const v = t ?? { ...DEFAULT_T };
            return { ...v, ...clampPan(idx, v.x, v.y, v.zoom) };
        };
        setTransforms(prev => { const n = [...prev]; const ta = n[a], tb = n[b]; n[a] = fit(tb, a); n[b] = fit(ta, b); return n; });
        setOriginals(prev => { const n = [...prev]; [n[a], n[b]] = [n[b] ?? null, n[a] ?? null]; return n; });
    }, [clampPan]);

    const handleSwapClick = useCallback((i: number) => {
        if (!images[i]) return;
        if (swapFrom === null) { setSwapFrom(i); return; }
        if (swapFrom === i) { setSwapFrom(null); return; }
        swapSlots(swapFrom, i);
        setSwapFrom(null);
        setSwapMode(false);
    }, [images, swapFrom, swapSlots]);

    // '이동' 버튼을 끌어서 다른 칸에 놓으면 위치 교환(빈 칸이면 이동).
    // 드래그 상태는 ref(진실) + state(렌더용) 로 분리하고, window 리스너로 받아 버튼이 사라져도 반드시 종료된다.
    const [moveDrag, setMoveDrag] = useState<{ from: number; x: number; y: number; over: number | null; moved: boolean } | null>(null);
    const moveRef = useRef<{ pointerId: number; from: number; sx: number; sy: number; moved: boolean } | null>(null);
    const moveCleanupRef = useRef<(() => void) | null>(null);
    useEffect(() => () => moveCleanupRef.current?.(), []);

    // 좌표 → 슬롯 번호 (텍스트 레이어가 위에 있어도 찾도록 hit-test 대신 사각형 비교)
    const slotAt = (x: number, y: number): number | null => {
        for (const el of Array.from(document.querySelectorAll<HTMLElement>('[data-slot]'))) {
            const r = el.getBoundingClientRect();
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return Number(el.dataset.slot);
        }
        return null;
    };

    const handleMoveDown = (e: React.PointerEvent, i: number) => {
        e.stopPropagation();
        if (e.button !== 0 || moveRef.current) return; // 우클릭·두 번째 손가락 무시
        e.preventDefault();
        const d = { pointerId: e.pointerId, from: i, sx: e.clientX, sy: e.clientY, moved: false };
        moveRef.current = d;
        setMoveDrag({ from: i, x: e.clientX, y: e.clientY, over: null, moved: false });
        acquireScrollLock();

        const onMove = (ev: PointerEvent) => {
            if (ev.pointerId !== d.pointerId) return;
            if (!d.moved && Math.hypot(ev.clientX - d.sx, ev.clientY - d.sy) > 6) d.moved = true;
            if (d.moved) setMoveDrag({ from: d.from, x: ev.clientX, y: ev.clientY, over: slotAt(ev.clientX, ev.clientY), moved: true });
        };
        const finish = (ev: PointerEvent) => {
            if (ev.pointerId !== d.pointerId) return;
            // pointercancel(시스템 제스처·전화 등)은 교환하지 않고 취소만
            if (ev.type === 'pointerup' && d.moved) {
                const over = slotAt(ev.clientX, ev.clientY);
                if (over !== null && over !== d.from) swapSlots(d.from, over);
            }
            cleanup();
        };
        const cleanup = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', finish);
            window.removeEventListener('pointercancel', finish);
            moveCleanupRef.current = null;
            moveRef.current = null;
            setMoveDrag(null);
            releaseScrollLock();
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', finish);
        window.addEventListener('pointercancel', finish);
        moveCleanupRef.current = cleanup;
    };

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

    // 원본 보관용 축소: 출력 캔버스 최대 변(3200px)보다 큰 사진은 줄여서 메모리 절약 (9장 × 수 MB 원본 → iOS 탭 강제 종료 방지)
    const downscaleDataUrl = (src: string, maxEdge: number) => new Promise<string>(resolve => {
        const img = new Image();
        img.onload = () => {
            const scale = maxEdge / Math.max(img.width, img.height);
            if (scale >= 1) { resolve(src); return; }
            const cv = document.createElement('canvas');
            cv.width = Math.round(img.width * scale);
            cv.height = Math.round(img.height * scale);
            cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height);
            resolve(cv.toDataURL('image/jpeg', 0.92));
        };
        img.onerror = () => resolve(src);
        img.src = src;
    });

    const openCrop = (index: number, src: string) => {
        const cell = currentLayout.cells[index];
        if (!cell) return;
        const aspect = (cell.w * previewW) / (cell.h * previewH);
        setPendingCrop({ src, index, aspect });
    };

    // 이미 넣은 사진 다시 자르기 — 원본이 있으면 원본에서, 없으면(임시저장 복원 등) 현재 이미지에서
    const handleEditImage = (index: number) => {
        const src = originals[index] ?? images[index];
        if (src) openCrop(index, src);
    };

    const [converting, setConverting] = useState(false);
    const handleFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try {
            if (isHeic(file)) setConverting(true);
            const blob = await ensureJpeg(file);
            const reader = new FileReader();
            reader.onload = async () => openCrop(index, await downscaleDataUrl(reader.result as string, 3200));
            reader.readAsDataURL(blob);
        } catch (err) {
            console.error('HEIC 변환 실패:', err);
            alert('이 사진을 불러올 수 없습니다. (지원 안 되는 형식)');
        } finally {
            setConverting(false);
        }
    };

    const handleCropApply = (croppedDataUrl: string) => {
        if (!pendingCrop) return;
        const i = pendingCrop.index;
        const src = pendingCrop.src;
        setImages(prev => { const next = [...prev]; next[i] = croppedDataUrl; return next; });
        setTransforms(prev => { const next = [...prev]; next[i] = { ...DEFAULT_T }; return next; });
        setOriginals(prev => { const next = [...prev]; next[i] = src; return next; });
        setPendingCrop(null);
    };

    const handleCropCancel = () => setPendingCrop(null);

    const removeImage = (index: number) => {
        setImages(prev => { const next = [...prev]; next[index] = null; return next; });
        setTransforms(prev => { const next = [...prev]; next[index] = { ...DEFAULT_T }; return next; });
        setOriginals(prev => { const next = [...prev]; next[index] = null; return next; });
    };

    const reset = () => {
        setImages(Array(currentLayout.slots).fill(null));
        setOriginals([]);
        setTransforms(Array(currentLayout.slots).fill(null).map(() => ({ ...DEFAULT_T })));
        setSpacing(0);
        setBgColor('#FFFFFF');
        setCornerRadius(0);
        setSwapMode(false);
        setSwapFrom(null);
        setTexts([]);
        setSelectedTextId(null);
        localStorage.removeItem('magic_frame_collage_draft');
        clearDraftValue(DRAFT_IMAGES_KEY).catch(() => { });
    };

    const handleTempSave = async () => {
        try {
            const settings = { layout, ratio, spacing, bgColor, cornerRadius, transforms, texts };
            localStorage.setItem('magic_frame_collage_draft', JSON.stringify(settings));
            const hasAny = images.some(Boolean);
            if (hasAny) {
                await saveDraftValue(DRAFT_IMAGES_KEY, JSON.stringify(images));
            } else {
                await clearDraftValue(DRAFT_IMAGES_KEY);
            }
            setSavedToast(true);
            setTimeout(() => setSavedToast(false), 2000);
        } catch (e) {
            console.error('Temp save failed:', e);
            alert('임시저장에 실패했습니다. 저장 공간이 부족할 수 있습니다.');
        }
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

        // Vercel 엣지 4.5MB body limit 회피 — 4MB 이하가 될 때까지 quality 단계적 감소
        const MAX_BYTES = 4 * 1024 * 1024;
        const QUALITIES = [0.92, 0.85, 0.78, 0.7, 0.6, 0.5];
        const toBlob = (q: number) => new Promise<Blob | null>(resolve => {
            canvas.toBlob(b => resolve(b), 'image/jpeg', q);
        });
        let last: Blob | null = null;
        for (const q of QUALITIES) {
            const b = await toBlob(q);
            if (!b) continue;
            last = b;
            if (b.size <= MAX_BYTES) break;
        }
        return last;
    }, [images, transforms, bgColor, spacing, isPortrait, currentLayout, cornerRadius, previewW, previewH, texts]);

    const handleFinalize = async () => {
        const blob = await renderCollage();
        if (blob) {
            localStorage.removeItem('magic_frame_collage_draft');
            clearDraftValue(DRAFT_IMAGES_KEY).catch(() => { });
            onFinalize(blob);
        }
    };

    const toggleSwap = useCallback(() => {
        setSwapMode(p => !p);
        setSwapFrom(null);
    }, []);

    const swappableCount = slotImages.filter(Boolean).length;

    const controlsProps: ControlsProps = useMemo(() => ({
        layout, filterSlots, filteredLayouts, isPortrait,
        handleLayoutChange, handleFilterChange,
        ratio, setRatio,
        spacing, setSpacing, cornerRadius, setCornerRadius, bgColor, setBgColor,
        texts, selectedTextId, selectedText, setSelectedTextId,
        addText, updateText, deleteText, pickedDate, setPickedDate,
        hasAnyImage, swapMode, toggleSwap, swappableCount,
        handleFinalize, handleTempSave, savedToast, reset,
    }), [
        layout, filterSlots, filteredLayouts, isPortrait,
        ratio, spacing, cornerRadius, bgColor,
        texts, selectedTextId, selectedText, pickedDate,
        hasAnyImage, swapMode, swappableCount, savedToast,
        handleLayoutChange, handleFilterChange, addText, updateText, deleteText,
        toggleSwap, handleFinalize, handleTempSave, reset, setSelectedTextId,
    ]);

    return (
        <div className="flex flex-col gap-4">
            {converting && (
                <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white rounded-2xl px-6 py-5 shadow-2xl text-sm font-bold text-slate-700">
                        아이폰 사진을 불러오는 중...
                    </div>
                </div>
            )}
            {/* Preview — 모바일 sticky, 데스크톱 일반 흐름 */}
            <div className="flex-1 flex items-center justify-center sticky top-0 z-30 bg-slate-50 -mx-4 px-4 py-2 lg:static lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent">
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
                            const isDragSource = moveDrag?.moved && moveDrag.from === i;
                            const isDropTarget = moveDrag?.moved && moveDrag.over === i && moveDrag.from !== i;
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
                                    data-slot={i}
                                    className={`border-2 border-dashed flex items-center justify-center group transition-all ${isDragSource ? 'opacity-40' : ''} ${
                                        isDropTarget
                                            ? 'border-indigo-500 ring-4 ring-indigo-400'
                                            : isSwapSelected
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
                                            {/* 툴바 버튼 (이동 + 수정 + 교체 + 삭제).
                                                넓고 높은 칸: 아이콘+글자 / 보통: 아이콘만 / 아주 좁은 칸: 2×2 로 접어 버튼이 잘리지 않게.
                                                hover 가능한 기기(마우스)에서만 평소 숨김 — 터치 태블릿·가로폰에선 항상 보임(투명 버튼 오터치 방지). */}
                                            {!swapMode && (() => {
                                                const cw = c.w * previewW - spacing;
                                                const ch = c.h * previewH - spacing;
                                                const showLabel = cw >= 110 && ch >= 120;
                                                const twoRows = cw < 100;
                                                const btnCls = `flex flex-col items-center justify-center text-white font-bold active:bg-black/40 ${twoRows ? 'h-6' : 'flex-1'} ${showLabel ? 'h-9 text-[10px] leading-none gap-0.5' : twoRows ? '' : 'h-7'}`;
                                                const actions = [
                                                    { label: '수정', aria: '사진 수정 (다시 자르기)', Icon: Crop, run: () => handleEditImage(i) },
                                                    { label: '교체', aria: '사진 교체', Icon: RefreshCw, run: () => handleAddImage(i) },
                                                    { label: '삭제', aria: '사진 삭제', Icon: X, run: () => removeImage(i) },
                                                ];
                                                return (
                                                    <div
                                                        className={`absolute bottom-0 inset-x-0 z-10 bg-black/55 select-none transition-opacity ${twoRows ? 'grid grid-cols-2' : 'flex divide-x divide-white/20'} ${moveDrag?.from === i ? 'opacity-100' : 'opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100'}`}
                                                        style={{ paddingInline: Math.min(cornerRadius * 0.3, 12), WebkitTouchCallout: 'none' } as React.CSSProperties}
                                                    >
                                                        <button
                                                            onClick={e => e.stopPropagation()}
                                                            onPointerDown={e => handleMoveDown(e, i)}
                                                            onContextMenu={e => e.preventDefault()}
                                                            title="사진 이동 (끌어서 다른 칸에 놓기)"
                                                            aria-label="사진 이동"
                                                            className={`${btnCls} cursor-grab active:cursor-grabbing`}
                                                            style={{ touchAction: 'none' }}
                                                        >
                                                            <Move size={12} />
                                                            {showLabel && <span>이동</span>}
                                                        </button>
                                                        {actions.map(({ label, aria, Icon, run }) => (
                                                            <button
                                                                key={label}
                                                                onClick={e => { e.stopPropagation(); run(); }}
                                                                onPointerDown={e => e.stopPropagation()}
                                                                title={aria}
                                                                aria-label={aria}
                                                                className={btnCls}
                                                            >
                                                                <Icon size={12} />
                                                                {showLabel && <span>{label}</span>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                            {/* zoom 인디케이터 */}
                                            {!swapMode && t.zoom > 1.05 && (
                                                <div className="absolute top-1 left-1 z-10 bg-black/50 text-white text-xs font-bold rounded px-1 py-0.5 pointer-events-none">
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
                                        accept="image/*,.heic,.heif"
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

            <TabbedControls {...controlsProps} />

            {/* 이동 드래그 중 손가락을 따라다니는 썸네일 */}
            {moveDrag?.moved && slotImages[moveDrag.from] && (
                <img
                    src={slotImages[moveDrag.from]!}
                    alt=""
                    className="fixed z-50 w-16 h-16 object-cover rounded-lg shadow-xl ring-2 ring-white opacity-80 pointer-events-none"
                    style={{ left: moveDrag.x - 32, top: moveDrag.y - 32 }}
                />
            )}

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
