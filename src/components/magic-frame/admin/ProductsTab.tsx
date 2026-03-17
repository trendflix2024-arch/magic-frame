"use client";

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2, Plus, Pencil, Trash2, X, Check, AlertCircle,
    Eye, EyeOff, ShoppingBag, Upload, ExternalLink, ImageIcon,
} from 'lucide-react';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    emoji: string;
    image_url: string | null;
    detail_url: string | null;
    active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

const emptyForm = {
    id: '',
    name: '',
    description: '',
    price: '',
    emoji: '📦',
    image_url: '',
    detail_url: '',
    active: true,
    sort_order: '0',
};

export function ProductsTab() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null); // null = create, string = edit
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    // Image upload
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);

    // Delete confirm
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/magic-frame/admin/products');
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setProducts(data.products || []);
        } catch {
            setError('상품 데이터를 불러올 수 없습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    // ── Handlers ──

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...emptyForm, sort_order: String(products.length) });
        setImagePreview(null);
        setModalOpen(true);
    };

    const openEdit = (p: Product) => {
        setEditingId(p.id);
        setForm({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: String(p.price),
            emoji: p.emoji,
            image_url: p.image_url || '',
            detail_url: p.detail_url || '',
            active: p.active,
            sort_order: String(p.sort_order),
        });
        setImagePreview(p.image_url || null);
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.price) {
            setError('이름과 가격은 필수입니다.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const isEdit = editingId !== null;
            const common = { name: form.name, description: form.description, price: Number(form.price), emoji: form.emoji, image_url: form.image_url || null, detail_url: form.detail_url || null, active: form.active, sort_order: Number(form.sort_order) };
            const body = isEdit
                ? { id: editingId, ...common }
                : { id: form.id.trim(), ...common };

            if (!isEdit && !form.id.trim()) {
                setError('상품 ID는 필수입니다.');
                setSaving(false);
                return;
            }

            const res = await fetch('/api/magic-frame/admin/products', {
                method: isEdit ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.error) { setError(data.error); setSaving(false); return; }

            setModalOpen(false);
            fetchProducts();
        } catch {
            setError('저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (file: File) => {
        setImageUploading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('productId', editingId || form.id || `temp-${Date.now()}`);

            const res = await fetch('/api/magic-frame/admin/products/image', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setForm(prev => ({ ...prev, image_url: data.imageUrl }));
            setImagePreview(data.imageUrl);
        } catch {
            setError('이미지 업로드 중 오류가 발생했습니다.');
        } finally {
            setImageUploading(false);
        }
    };

    const handleToggleActive = async (p: Product) => {
        try {
            const res = await fetch('/api/magic-frame/admin/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: p.id, active: !p.active }),
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x));
        } catch {
            setError('상태 변경 중 오류가 발생했습니다.');
        }
    };

    const handleDelete = async (id: string) => {
        setDeleting(true);
        try {
            const res = await fetch('/api/magic-frame/admin/products', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setProducts(prev => prev.filter(x => x.id !== id));
        } catch {
            setError('삭제 중 오류가 발생했습니다.');
        } finally {
            setDeleting(false);
            setConfirmDelete(null);
        }
    };

    const activeCount = products.filter(p => p.active).length;

    return (
        <>
            {/* Stats + Add button */}
            <div className="flex items-center justify-between">
                <div className="flex gap-3">
                    <div className="bg-white rounded-xl px-5 py-3 border border-slate-100 shadow-sm text-center">
                        <p className="text-xl font-bold text-slate-800">{products.length}</p>
                        <p className="text-[10px] text-slate-400">전체 상품</p>
                    </div>
                    <div className="bg-white rounded-xl px-5 py-3 border border-slate-100 shadow-sm text-center">
                        <p className="text-xl font-bold text-emerald-600">{activeCount}</p>
                        <p className="text-[10px] text-slate-400">활성</p>
                    </div>
                    <div className="bg-white rounded-xl px-5 py-3 border border-slate-100 shadow-sm text-center">
                        <p className="text-xl font-bold text-slate-400">{products.length - activeCount}</p>
                        <p className="text-[10px] text-slate-400">비활성</p>
                    </div>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                    <Plus size={14} /> 상품 추가
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-500 text-xs rounded-lg p-3 flex items-center gap-1.5">
                    <AlertCircle size={12} /> {error}
                </div>
            )}

            {/* Product list */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-indigo-500" size={28} />
                </div>
            ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <ShoppingBag size={48} className="mb-3 opacity-40" />
                    <p className="text-sm font-medium">등록된 상품이 없습니다</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {products.map(product => (
                        <motion.div key={product.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-colors ${product.active ? 'border-slate-100' : 'border-slate-100 opacity-60'}`}>
                            <div className="flex items-center gap-4 p-4">
                                {/* Image or Emoji */}
                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        product.emoji
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-bold text-slate-800">{product.name}</span>
                                        {!product.active && (
                                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-full">
                                                <EyeOff size={9} /> 비활성
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 truncate">{product.description}</p>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-sm font-bold text-indigo-600">₩{product.price.toLocaleString()}</span>
                                        <span className="text-[10px] text-slate-300">ID: {product.id}</span>
                                        <span className="text-[10px] text-slate-300">순서: {product.sort_order}</span>
                                        {product.detail_url && (
                                            <a href={product.detail_url} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-0.5 text-[10px] text-indigo-400 hover:text-indigo-600">
                                                <ExternalLink size={9} /> 상세
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <button onClick={() => handleToggleActive(product)}
                                        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border rounded-lg transition-colors ${product.active
                                            ? 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                                            : 'text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                                        title={product.active ? '비활성화' : '활성화'}>
                                        {product.active ? <Eye size={12} /> : <EyeOff size={12} />}
                                    </button>
                                    <button onClick={() => openEdit(product)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                                        <Pencil size={12} />
                                    </button>
                                    <button onClick={() => setConfirmDelete(product.id)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto">

                            <div className="flex items-center justify-between p-5 border-b border-slate-100">
                                <h3 className="text-base font-bold text-slate-800">
                                    {editingId ? '상품 수정' : '새 상품 추가'}
                                </h3>
                                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* ID (only for create) */}
                                {!editingId && (
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">상품 ID (영문, 변경 불가)</label>
                                        <input value={form.id}
                                            onChange={e => setForm(prev => ({ ...prev, id: e.target.value.replace(/[^a-z0-9-]/g, '') }))}
                                            placeholder="my-product"
                                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                    </div>
                                )}

                                {/* Product Image Upload */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">상품 이미지 (1:1 비율)</label>
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-300 transition-colors flex-shrink-0 relative"
                                            onClick={() => document.getElementById('product-image-input')?.click()}
                                        >
                                            {imageUploading ? (
                                                <Loader2 size={20} className="animate-spin text-indigo-400" />
                                            ) : imagePreview ? (
                                                <img src={imagePreview} alt="미리보기" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center">
                                                    <ImageIcon size={20} className="text-slate-300 mx-auto" />
                                                    <span className="text-[9px] text-slate-300 mt-0.5 block">업로드</span>
                                                </div>
                                            )}
                                        </div>
                                        <input id="product-image-input" type="file" accept="image/*" className="hidden"
                                            onChange={e => {
                                                const f = e.target.files?.[0];
                                                if (f) handleImageUpload(f);
                                                e.target.value = '';
                                            }} />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex gap-2">
                                                <div className="w-16">
                                                    <label className="text-[10px] text-slate-400 block">이모지</label>
                                                    <input value={form.emoji}
                                                        onChange={e => setForm(prev => ({ ...prev, emoji: e.target.value }))}
                                                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-center text-lg focus:ring-2 focus:ring-indigo-300 outline-none" />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[10px] text-slate-400 block">상품명</label>
                                                    <input value={form.name}
                                                        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                                        placeholder="상품 이름"
                                                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                                </div>
                                            </div>
                                            {imagePreview && (
                                                <button type="button" onClick={() => { setImagePreview(null); setForm(prev => ({ ...prev, image_url: '' })); }}
                                                    className="text-[10px] text-red-400 hover:text-red-600">이미지 제거</button>
                                            )}
                                            <p className="text-[10px] text-slate-300">이미지가 있으면 이모지 대신 표시됩니다</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">설명</label>
                                    <input value={form.description}
                                        onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="상품 설명"
                                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                </div>

                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">가격 (원)</label>
                                        <input value={form.price} type="number"
                                            onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                                            placeholder="10000"
                                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                    </div>
                                    <div className="w-24">
                                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">정렬 순서</label>
                                        <input value={form.sort_order} type="number"
                                            onChange={e => setForm(prev => ({ ...prev, sort_order: e.target.value }))}
                                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                    </div>
                                </div>

                                {/* Detail URL */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                                        <span className="flex items-center gap-1"><ExternalLink size={11} /> 상세 페이지 URL</span>
                                    </label>
                                    <input value={form.detail_url}
                                        onChange={e => setForm(prev => ({ ...prev, detail_url: e.target.value }))}
                                        placeholder="https://example.com/product-detail"
                                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                    <p className="text-[10px] text-slate-300 mt-1">입력 시 &apos;자세히&apos; 버튼이 표시됩니다</p>
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.active}
                                        onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                    <span className="text-xs font-medium text-slate-600">활성 (고객에게 표시)</span>
                                </label>
                            </div>

                            <div className="p-5 border-t border-slate-100 flex gap-2">
                                <button onClick={() => setModalOpen(false)}
                                    className="flex-1 py-3 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm">
                                    취소
                                </button>
                                <button onClick={handleSave} disabled={saving}
                                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-1.5 disabled:opacity-50">
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                    {editingId ? '저장' : '추가'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete confirm */}
            <AnimatePresence>
                {confirmDelete && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Trash2 size={20} className="text-red-500" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 mb-1">상품을 삭제하시겠습니까?</h3>
                            <p className="text-xs text-slate-400 mb-4">이 작업은 되돌릴 수 없습니다</p>
                            <div className="flex gap-2">
                                <button onClick={() => setConfirmDelete(null)}
                                    className="flex-1 py-2.5 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm">
                                    취소
                                </button>
                                <button onClick={() => handleDelete(confirmDelete)} disabled={deleting}
                                    className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors text-sm flex items-center justify-center gap-1">
                                    {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    삭제
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
