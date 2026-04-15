"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface PhotoCropModalProps {
    imageSrc: string | null;
    aspect: number; // width / height of target cell
    onApply: (croppedDataUrl: string) => void;
    onCancel: () => void;
}

const MAX_FRAME_W = 320;
const MAX_FRAME_H = 400;

export function PhotoCropModal({ imageSrc, aspect, onApply, onCancel }: PhotoCropModalProps) {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [img, setImg] = useState<HTMLImageElement | null>(null);
    const dragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
    const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);
    const touchesRef = useRef<Map<number, { x: number; y: number }>>(new Map());

    let frameW = MAX_FRAME_W;
    let frameH = frameW / aspect;
    if (frameH > MAX_FRAME_H) {
        frameH = MAX_FRAME_H;
        frameW = frameH * aspect;
    }

    useEffect(() => {
        if (!imageSrc) {
            setImg(null);
            return;
        }
        let cancelled = false;
        const i = new window.Image();
        i.onload = () => {
            if (cancelled) return;
            setImg(i);
            setZoom(1);
            setPan({ x: 0, y: 0 });
        };
        i.src = imageSrc;
        return () => {
            cancelled = true;
            i.onload = null;
        };
    }, [imageSrc]);

    const imgW = img?.naturalWidth ?? 0;
    const imgH = img?.naturalHeight ?? 0;
    const coverScale = imgW && imgH ? Math.max(frameW / imgW, frameH / imgH) : 1;

    const handlePointerDown = (e: React.PointerEvent) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        touchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touchesRef.current.size === 1) {
            dragRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
        } else if (touchesRef.current.size === 2) {
            dragRef.current = null;
            const pts = Array.from(touchesRef.current.values());
            const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            pinchRef.current = { startDist: dist, startZoom: zoom };
        }
    };
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!touchesRef.current.has(e.pointerId)) return;
        touchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touchesRef.current.size === 2 && pinchRef.current) {
            const pts = Array.from(touchesRef.current.values());
            const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            const scale = dist / pinchRef.current.startDist;
            setZoom(Math.min(4, Math.max(0.3, pinchRef.current.startZoom * scale)));
        } else if (touchesRef.current.size === 1 && dragRef.current) {
            const dx = e.clientX - dragRef.current.sx;
            const dy = e.clientY - dragRef.current.sy;
            setPan({ x: dragRef.current.px + dx, y: dragRef.current.py + dy });
        }
    };
    const handlePointerUp = (e: React.PointerEvent) => {
        touchesRef.current.delete(e.pointerId);
        if (touchesRef.current.size < 2) pinchRef.current = null;
        if (touchesRef.current.size === 0) dragRef.current = null;
    };

    const handleReset = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const handleApply = () => {
        if (!img || !imgW || !imgH) return;
        const displayScale = coverScale * zoom;
        const displayW = imgW * displayScale;
        const displayH = imgH * displayScale;
        const imgLeft = (frameW - displayW) / 2 + pan.x;
        const imgTop = (frameH - displayH) / 2 + pan.y;

        // Frame expressed in image-pixel coords (may extend beyond image bounds at zoom<1)
        const visibleW = frameW / displayScale;
        const visibleH = frameH / displayScale;
        const visibleLeftInImg = -imgLeft / displayScale;
        const visibleTopInImg = -imgTop / displayScale;

        // Output canvas matches frame aspect; 1:1 with image natural pixels, capped
        const MAX_OUT = 2400;
        let outW = Math.round(visibleW);
        let outH = Math.round(visibleH);
        if (outW > MAX_OUT) {
            outH = Math.round(outH * (MAX_OUT / outW));
            outW = MAX_OUT;
        }
        outW = Math.max(1, outW);
        outH = Math.max(1, outH);

        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, outW, outH);

        const outScale = outW / visibleW;
        const dx = -visibleLeftInImg * outScale;
        const dy = -visibleTopInImg * outScale;
        const dw = imgW * outScale;
        const dh = imgH * outScale;
        ctx.drawImage(img, 0, 0, imgW, imgH, dx, dy, dw, dh);

        onApply(canvas.toDataURL('image/jpeg', 0.92));
    };

    if (!imageSrc) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">사진 영역 지정</h3>
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <p className="text-xs text-slate-400 text-center leading-relaxed">
                        드래그로 이동 · 슬라이더·핀치로 확대<br />
                        흰 프레임 안의 영역이 슬롯에 들어갑니다
                    </p>

                    <div className="flex justify-center">
                        <div
                            className="relative overflow-hidden bg-slate-900 rounded-xl shadow-inner"
                            style={{ width: frameW, height: frameH, touchAction: 'none' }}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={handlePointerUp}
                        >
                            {img && (() => {
                                const displayW = imgW * coverScale * zoom;
                                const displayH = imgH * coverScale * zoom;
                                return (
                                    <img
                                        src={imageSrc}
                                        alt=""
                                        draggable={false}
                                        style={{
                                            position: 'absolute',
                                            left: (frameW - displayW) / 2 + pan.x,
                                            top: (frameH - displayH) / 2 + pan.y,
                                            width: displayW,
                                            height: displayH,
                                            maxWidth: 'none',
                                            maxHeight: 'none',
                                            pointerEvents: 'none',
                                            userSelect: 'none',
                                        }}
                                    />
                                );
                            })()}
                            <div className="absolute inset-0 pointer-events-none border-2 border-white/90 rounded-xl" />
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <ZoomOut size={14} className="text-slate-400 flex-shrink-0" />
                        <input
                            type="range"
                            min={30}
                            max={400}
                            value={Math.round(zoom * 100)}
                            onChange={e => setZoom(Number(e.target.value) / 100)}
                            className="flex-1 accent-indigo-600"
                        />
                        <ZoomIn size={14} className="text-slate-400 flex-shrink-0" />
                        <button
                            type="button"
                            onClick={handleReset}
                            className="ml-1 text-slate-400 hover:text-slate-600"
                            title="초기화"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={!img}
                            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 text-sm disabled:opacity-50"
                        >
                            <Check size={14} /> 슬롯에 적용
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
