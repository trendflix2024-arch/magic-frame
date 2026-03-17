"use client";

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Search, ArrowUpDown, Loader2, Upload, Download, X,
    Clock, Package, PackageCheck, Truck, AlertCircle, Trash2, ShoppingBag,
} from 'lucide-react';
import { CsvImportModal } from './CsvImportModal';
import { TrackingImportModal } from './TrackingImportModal';
import { BatchActionBar } from './BatchActionBar';
import { OrderCard, type UnifiedOrder, PIPELINE_CONFIG, type PipelineStatus, formatPhone } from './OrderCard';
import { OrderDetailModal } from './OrderDetailModal';

type UnifiedStatus = 'all' | PipelineStatus;

const PIPELINE_KEYS: PipelineStatus[] = ['waiting', 'received', 'producing', 'preparing', 'shipped'];

interface Counts {
    waiting: number;
    received: number;
    producing: number;
    preparing: number;
    shipped: number;
    total: number;
}

function computeAddonStats(orders: UnifiedOrder[]) {
    let totalRevenue = 0;
    let paidCount = 0;
    for (const o of orders) {
        for (const a of o.addon_orders) {
            if (a.status !== 'cancelled') {
                totalRevenue += a.amount;
            }
            if (a.status === 'paid') paidCount++;
        }
    }
    return { totalRevenue, paidCount };
}

export function OrdersTab() {
    const [orders, setOrders] = useState<UnifiedOrder[]>([]);
    const [counts, setCounts] = useState<Counts>({ waiting: 0, received: 0, producing: 0, preparing: 0, shipped: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<UnifiedStatus>('all');
    const [sort, setSort] = useState<'recent' | 'name'>('recent');

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Modals
    const [csvModalOpen, setCsvModalOpen] = useState(false);
    const [trackingModalOpen, setTrackingModalOpen] = useState(false);
    const [detailOrder, setDetailOrder] = useState<UnifiedOrder | null>(null);
    const [lightbox, setLightbox] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Status change loading
    const [statusLoading, setStatusLoading] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (statusFilter !== 'all') params.set('status', statusFilter);
            params.set('sort', sort);
            const res = await fetch(`/api/magic-frame/admin/unified?${params}`);
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setOrders(data.orders || []);
            setCounts(data.counts || { waiting: 0, received: 0, producing: 0, preparing: 0, shipped: 0, total: 0 });
        } catch {
            setError('데이터를 불러올 수 없습니다.');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, sort]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // ── Handlers ──

    const handleStatusChange = async (userId: string, shippingStatus: string) => {
        setStatusLoading(userId);
        try {
            const res = await fetch('/api/magic-frame/admin/shipping', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, shipping_status: shippingStatus }),
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            fetchOrders();
        } catch {
            setError('상태 변경 중 오류가 발생했습니다.');
        } finally {
            setStatusLoading(null);
        }
    };

    const handleBatchStatusChange = async (status: string) => {
        try {
            const res = await fetch('/api/magic-frame/admin/shipping/batch', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds: Array.from(selectedIds), shipping_status: status }),
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setSelectedIds(new Set());
            fetchOrders();
        } catch {
            setError('일괄 변경 중 오류가 발생했습니다.');
        }
    };

    const handleDetailSave = async (userId: string, data: Record<string, any>) => {
        const res = await fetch('/api/magic-frame/admin/shipping', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, ...data }),
        });
        const result = await res.json();
        if (result.error) throw new Error(result.error);
        fetchOrders();
    };

    const handleAddonStatusChange = async (orderId: string, newStatus: string) => {
        const res = await fetch('/api/magic-frame/admin/orders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, status: newStatus }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        fetchOrders();
    };

    const handleResetSubmission = async (userId: string) => {
        const res = await fetch('/api/magic-frame/admin', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        fetchOrders();
    };

    const handleDelete = async (userId: string) => {
        setDeleteLoading(true);
        try {
            const res = await fetch('/api/magic-frame/admin', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setOrders(prev => prev.filter(o => o.id !== userId));
            setConfirmDelete(null);
            fetchOrders();
        } catch {
            setError('삭제 중 오류가 발생했습니다.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleExport = async () => {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') {
            // Map unified status to shipping status for export
            const map: Record<string, string> = { received: 'pending', producing: 'new_order', preparing: 'preparing', shipped: 'shipped' };
            if (map[statusFilter]) params.set('status', map[statusFilter]);
        }
        const res = await fetch(`/api/magic-frame/admin/shipping/export?${params}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === orders.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(orders.map(o => o.id)));
        }
    };

    return (
        <>
            {/* Pipeline Filter Bar */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`flex-shrink-0 bg-white rounded-xl px-4 py-3 border shadow-sm text-center transition-all min-w-[80px] ${statusFilter === 'all' ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-100'}`}>
                    <p className="text-xl font-bold text-slate-800">{counts.total}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">전체</p>
                </button>
                {PIPELINE_KEYS.map(key => {
                    const cfg = PIPELINE_CONFIG[key];
                    const count = counts[key];
                    const isActive = statusFilter === key;
                    return (
                        <button key={key}
                            onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                            className={`flex-shrink-0 bg-white rounded-xl px-4 py-3 border shadow-sm text-center transition-all min-w-[80px] ${isActive ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-100'}`}>
                            <p className="text-xl font-bold text-slate-800">{count}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">{cfg.label}</p>
                        </button>
                    );
                })}
            </div>

            {/* Addon Revenue Summary */}
            {(() => {
                const { totalRevenue, paidCount } = computeAddonStats(orders);
                if (totalRevenue === 0 && !loading) return null;
                return totalRevenue > 0 ? (
                    <div className="flex items-center gap-4 bg-white rounded-xl px-4 py-2.5 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <ShoppingBag size={13} className="text-purple-500" />
                            <span className="font-medium">추가 구매</span>
                        </div>
                        <span className="text-sm font-bold text-purple-600">₩{totalRevenue.toLocaleString()}</span>
                        {paidCount > 0 && (
                            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
                                미배송 {paidCount}건
                            </span>
                        )}
                    </div>
                ) : null;
            })()}

            {/* Toolbar */}
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="이름 또는 연락처 검색"
                            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                    </div>
                    <button onClick={() => setSort(prev => prev === 'recent' ? 'name' : 'recent')}
                        className="flex items-center gap-1 px-3 py-2.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap">
                        <ArrowUpDown size={12} /> {sort === 'recent' ? '최근순' : '이름순'}
                    </button>
                    <button onClick={() => setCsvModalOpen(true)}
                        className="flex items-center gap-1 px-3 py-2.5 text-xs font-bold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap">
                        <Upload size={12} /> <span className="hidden sm:inline">고객 등록</span>
                    </button>
                    <button onClick={() => setTrackingModalOpen(true)}
                        className="flex items-center gap-1 px-3 py-2.5 text-xs font-bold text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors whitespace-nowrap">
                        <Upload size={12} /> <span className="hidden sm:inline">운송장</span>
                    </button>
                    <button onClick={handleExport}
                        className="flex items-center gap-1 px-3 py-2.5 text-xs font-bold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap">
                        <Download size={12} /> <span className="hidden sm:inline">내보내기</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-500 text-xs rounded-lg p-3 flex items-center gap-1.5">
                    <AlertCircle size={12} /> {error}
                </div>
            )}

            {/* Batch action bar */}
            {selectedIds.size > 0 && (
                <BatchActionBar
                    selectedCount={selectedIds.size}
                    onStatusChange={handleBatchStatusChange}
                    onClearSelection={() => setSelectedIds(new Set())}
                />
            )}

            {/* Order list */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-indigo-500" size={28} />
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Package size={48} className="mb-3 opacity-40" />
                    <p className="text-sm font-medium">
                        {statusFilter !== 'all' ? '해당 상태의 주문이 없습니다' : '등록된 주문이 없습니다'}
                    </p>
                </div>
            ) : (
                <>
                    {/* Select all */}
                    <div className="flex items-center gap-2 px-1">
                        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                            <input type="checkbox" checked={selectedIds.size === orders.length && orders.length > 0}
                                onChange={toggleSelectAll}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            전체 선택 ({orders.length})
                        </label>
                    </div>

                    <div className="space-y-2">
                        {orders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                selected={selectedIds.has(order.id)}
                                onToggleSelect={toggleSelect}
                                onStatusChange={handleStatusChange}
                                onOpenDetail={setDetailOrder}
                                onDelete={id => setConfirmDelete(id)}
                                onOpenLightbox={setLightbox}
                                statusLoading={statusLoading}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* CSV Import Modal */}
            <CsvImportModal open={csvModalOpen} onClose={() => setCsvModalOpen(false)} onImportComplete={fetchOrders} />
            <TrackingImportModal open={trackingModalOpen} onClose={() => setTrackingModalOpen(false)} onImportComplete={fetchOrders} />

            {/* Order Detail Modal */}
            <OrderDetailModal
                order={detailOrder}
                onClose={() => setDetailOrder(null)}
                onSave={handleDetailSave}
                onAddonStatusChange={handleAddonStatusChange}
                onResetSubmission={handleResetSubmission}
                onDelete={async (userId) => { await handleDelete(userId); setDetailOrder(null); }}
            />

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
                {confirmDelete && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Trash2 size={20} className="text-red-500" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 mb-1">주문을 삭제하시겠습니까?</h3>
                            <p className="text-xs text-slate-400 mb-4">사용자 정보와 제출 사진이 모두 삭제됩니다</p>
                            <div className="flex gap-2">
                                <button onClick={() => setConfirmDelete(null)}
                                    className="flex-1 py-2.5 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm">취소</button>
                                <button onClick={() => confirmDelete && handleDelete(confirmDelete)} disabled={deleteLoading}
                                    className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors text-sm flex items-center justify-center gap-1">
                                    {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
