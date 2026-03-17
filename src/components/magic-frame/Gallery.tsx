"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, X, Loader2, ImageIcon, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GalleryImage {
    name: string;
    url: string;
    createdAt: string;
}

interface GalleryProps {
    isAdmin: boolean;
}

export function Gallery({ isAdmin }: GalleryProps) {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [lightbox, setLightbox] = useState<string | null>(null);
    const [pendingDelete, setPendingDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // Bulk select mode (admin only)
    const [selectMode, setSelectMode] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const fetchImages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/magic-frame/gallery');
            const data = await res.json();
            if (data.images) setImages(data.images);
        } catch {
            setError('이미지를 불러올 수 없습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchImages(); }, [fetchImages]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        setError('');

        try {
            for (const file of Array.from(files)) {
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });

                const res = await fetch('/api/magic-frame/gallery', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64, filename: file.name }),
                });

                const data = await res.json();
                if (data.error) {
                    setError(data.error);
                    break;
                }
            }
            await fetchImages();
        } catch {
            setError('업로드 중 오류가 발생했습니다.');
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleDelete = async (name: string) => {
        setDeleting(true);
        try {
            const res = await fetch('/api/magic-frame/gallery', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ names: [name] }),
            });
            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else {
                setImages(prev => prev.filter(img => img.name !== name));
            }
        } catch {
            setError('삭제 중 오류가 발생했습니다.');
        } finally {
            setDeleting(false);
            setPendingDelete(null);
        }
    };

    const handleBulkDelete = async () => {
        if (selected.size === 0) return;
        setDeleting(true);
        try {
            const res = await fetch('/api/magic-frame/gallery', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ names: Array.from(selected) }),
            });
            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else {
                setImages(prev => prev.filter(img => !selected.has(img.name)));
                setSelected(new Set());
                setSelectMode(false);
            }
        } catch {
            setError('삭제 중 오류가 발생했습니다.');
        } finally {
            setDeleting(false);
        }
    };

    const toggleSelect = (name: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    const handleImageClick = (img: GalleryImage) => {
        if (selectMode) {
            toggleSelect(img.name);
        } else {
            setLightbox(img.url);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
                {/* Header */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <span className="text-base">&#128247;</span> 샘플 갤러리
                        </h3>
                        {isAdmin && (
                            <div className="flex items-center gap-2">
                                {selectMode ? (
                                    <>
                                        <span className="text-xs text-slate-500">{selected.size}개 선택</span>
                                        <button onClick={handleBulkDelete} disabled={selected.size === 0 || deleting}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-40">
                                            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                            일괄 삭제
                                        </button>
                                        <button onClick={() => { setSelectMode(false); setSelected(new Set()); }}
                                            className="px-3 py-1.5 text-slate-500 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors">
                                            취소
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {images.length > 0 && (
                                            <button onClick={() => setSelectMode(true)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-slate-500 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors">
                                                <CheckSquare size={12} /> 선택
                                            </button>
                                        )}
                                        <button onClick={() => fileRef.current?.click()} disabled={uploading}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60">
                                            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                            {uploading ? '업로드 중...' : '사진 추가'}
                                        </button>
                                    </>
                                )}
                                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
                            </div>
                        )}
                    </div>
                    {!isAdmin && (
                        <p className="text-xs text-slate-400 mt-2">참고용 샘플 사진입니다.</p>
                    )}
                </div>

                {error && (
                    <div className="flex items-center gap-1.5 text-red-500 text-xs mb-3 px-1">
                        <AlertCircle size={12} /> {error}
                    </div>
                )}

                {/* Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-indigo-500" size={28} />
                    </div>
                ) : images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <ImageIcon size={48} className="mb-3 opacity-40" />
                        <p className="text-sm font-medium">
                            {isAdmin ? '사진 추가 버튼으로 샘플을 등록하세요' : '아직 등록된 샘플이 없습니다'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {images.map((img) => (
                            <motion.div key={img.name}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`relative group rounded-xl overflow-hidden border bg-white shadow-sm cursor-pointer aspect-[3/4] ${
                                    selectMode && selected.has(img.name) ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-slate-200'
                                }`}
                                onClick={() => handleImageClick(img)}>
                                <img src={img.url} alt={img.name}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105" />

                                {/* Select checkbox */}
                                {selectMode && (
                                    <div className="absolute top-2 left-2">
                                        {selected.has(img.name)
                                            ? <CheckSquare size={20} className="text-indigo-600 drop-shadow" />
                                            : <Square size={20} className="text-white drop-shadow" />
                                        }
                                    </div>
                                )}

                                {/* Delete button (always visible on mobile) */}
                                {isAdmin && !selectMode && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setPendingDelete(img.name); }}
                                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-md">
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setLightbox(null)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="relative max-w-2xl max-h-[85vh] w-full"
                            onClick={e => e.stopPropagation()}>
                            <img src={lightbox} alt="확대 보기" className="w-full h-full object-contain rounded-2xl" />
                            <button onClick={() => setLightbox(null)}
                                className="absolute top-3 right-3 w-9 h-9 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                                <X size={18} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete confirm */}
            <AnimatePresence>
                {pendingDelete && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Trash2 size={20} className="text-red-500" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 mb-1">사진을 삭제하시겠습니까?</h3>
                            <p className="text-xs text-slate-400 mb-4">삭제 후 복구할 수 없습니다</p>
                            <div className="flex gap-2">
                                <button onClick={() => setPendingDelete(null)} disabled={deleting}
                                    className="flex-1 py-2.5 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm">
                                    취소
                                </button>
                                <button onClick={() => handleDelete(pendingDelete)} disabled={deleting}
                                    className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors text-sm flex items-center justify-center gap-1">
                                    {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    삭제
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
