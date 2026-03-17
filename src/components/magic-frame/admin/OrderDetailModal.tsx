"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Check, Loader2, AlertCircle, Truck, RotateCcw,
    Trash2, ShoppingBag, ImageIcon, ExternalLink,
} from 'lucide-react';
import { SHIPPING_CARRIERS, TRACKING_URLS } from '@/lib/magic-frame-config';
import { type UnifiedOrder, type AddonOrder, PIPELINE_CONFIG, type PipelineStatus, STATUS_TO_SHIPPING, formatPhone, formatDate } from './OrderCard';

const ADDON_STATUS: Record<string, { label: string; color: string }> = {
    paid: { label: '결제완료', color: 'bg-emerald-100 text-emerald-700' },
    shipped: { label: '배송완료', color: 'bg-blue-100 text-blue-700' },
    cancelled: { label: '취소', color: 'bg-red-100 text-red-700' },
};

interface OrderDetailModalProps {
    order: UnifiedOrder | null;
    onClose: () => void;
    onSave: (userId: string, data: Record<string, any>) => Promise<void>;
    onAddonStatusChange: (orderId: string, newStatus: string) => Promise<void>;
    onResetSubmission: (userId: string) => Promise<void>;
    onDelete: (userId: string) => Promise<void>;
}

export function OrderDetailModal({
    order, onClose, onSave, onAddonStatusChange, onResetSubmission, onDelete,
}: OrderDetailModalProps) {
    const [form, setForm] = useState({
        shipping_status: 'pending',
        address: '',
        postal_code: '',
        address_detail: '',
        tracking_number: '',
        shipping_carrier: '',
        shipping_memo: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [addonLoading, setAddonLoading] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'reset' | 'delete' | null>(null);
    const [lastOrderId, setLastOrderId] = useState<string | null>(null);

    // Sync form when order changes
    if (order && order.id !== lastOrderId) {
        setLastOrderId(order.id);
        setForm({
            shipping_status: order.shipping_status || 'pending',
            address: order.address || '',
            postal_code: order.postal_code || '',
            address_detail: order.address_detail || '',
            tracking_number: order.tracking_number || '',
            shipping_carrier: order.shipping_carrier || '',
            shipping_memo: order.shipping_memo || '',
        });
        setError('');
        setConfirmAction(null);
    } else if (!order && lastOrderId) {
        setLastOrderId(null);
    }

    const handleSave = async () => {
        if (!order) return;
        setSaving(true);
        setError('');
        try {
            await onSave(order.id, form);
            onClose();
        } catch (e: any) {
            setError(e.message || '저장 중 오류');
        } finally {
            setSaving(false);
        }
    };

    const handleAddonStatus = async (addonId: string, newStatus: string) => {
        setAddonLoading(addonId);
        try {
            await onAddonStatusChange(addonId, newStatus);
        } catch (e: any) {
            setError(e.message || '상태 변경 실패');
        } finally {
            setAddonLoading(null);
        }
    };

    const handleAction = async (action: 'reset' | 'delete') => {
        if (!order) return;
        setActionLoading(true);
        try {
            if (action === 'reset') await onResetSubmission(order.id);
            else await onDelete(order.id);
            onClose();
        } catch (e: any) {
            setError(e.message || '처리 실패');
        } finally {
            setActionLoading(false);
            setConfirmAction(null);
        }
    };

    const getResetInfo = () => {
        if (!order?.submitted) return { canReset: false, reason: '' };
        if (order.unified_status !== 'received') return { canReset: false, reason: '제작중 이후 불가' };
        return { canReset: true, reason: '' };
    };

    return (
        <AnimatePresence>
            {order && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">

                        {/* Header */}
                        <div className="flex items-center gap-3 p-5 border-b border-slate-100">
                            <div className="w-12 h-15 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                                {order.image_url ? (
                                    <img src={order.image_url} alt={order.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon size={14} className="text-slate-300" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-slate-800">{order.name}</h3>
                                <p className="text-xs text-slate-400">{formatPhone(order.phone)}</p>
                                <p className="text-[10px] text-slate-300">{formatDate(order.updated_at || order.created_at)}</p>
                            </div>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-5 space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-500 text-xs rounded-lg p-2 flex items-center gap-1">
                                    <AlertCircle size={12} /> {error}
                                </div>
                            )}

                            {/* Pipeline Status */}
                            {order.submitted && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">주문 상태</label>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {(['pending', 'new_order', 'preparing', 'shipped'] as const).map(key => {
                                            const uKey = key === 'pending' ? 'received' : key === 'new_order' ? 'producing' : key;
                                            const c = PIPELINE_CONFIG[uKey as PipelineStatus];
                                            return (
                                                <button key={key}
                                                    onClick={() => setForm(prev => ({ ...prev, shipping_status: key }))}
                                                    className={`py-2 rounded-lg text-[11px] font-bold transition-all border text-center ${form.shipping_status === key
                                                        ? `${c.color} border-current`
                                                        : 'bg-white text-slate-400 border-slate-200'}`}>
                                                    {c.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Address */}
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">우편번호</label>
                                    <input value={form.postal_code}
                                        onChange={e => setForm(prev => ({ ...prev, postal_code: e.target.value }))}
                                        placeholder="12345"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">주소</label>
                                    <input value={form.address}
                                        onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                                        placeholder="서울시 강남구 테헤란로 123"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">상세주소</label>
                                <input value={form.address_detail}
                                    onChange={e => setForm(prev => ({ ...prev, address_detail: e.target.value }))}
                                    placeholder="456호"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                            </div>

                            {/* Shipping */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">택배사</label>
                                    <select value={form.shipping_carrier}
                                        onChange={e => setForm(prev => ({ ...prev, shipping_carrier: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white">
                                        <option value="">선택</option>
                                        {SHIPPING_CARRIERS.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">운송장 번호</label>
                                    <div className="flex gap-1.5">
                                        <input value={form.tracking_number}
                                            onChange={e => setForm(prev => ({ ...prev, tracking_number: e.target.value }))}
                                            placeholder="1234567890"
                                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                        {form.tracking_number && form.shipping_carrier && TRACKING_URLS[form.shipping_carrier] && (
                                            <a href={`${TRACKING_URLS[form.shipping_carrier]}${form.tracking_number}`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap">
                                                조회 <ExternalLink size={11} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">배송 메모</label>
                                <textarea value={form.shipping_memo}
                                    onChange={e => setForm(prev => ({ ...prev, shipping_memo: e.target.value }))}
                                    placeholder="특이사항 메모"
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none resize-none" />
                            </div>

                            {/* Add-on Orders */}
                            {order.addon_orders.length > 0 && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block flex items-center gap-1">
                                        <ShoppingBag size={12} /> 추가 구매 내역
                                    </label>
                                    <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                                        {order.addon_orders.map(addon => {
                                            const addonCfg = ADDON_STATUS[addon.status] || ADDON_STATUS.paid;
                                            return (
                                                <div key={addon.id} className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-xs text-slate-700 font-medium">{addon.product_name}</span>
                                                        <span className="text-xs text-slate-400 ml-2">₩{addon.amount.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${addonCfg.color}`}>
                                                            {addonCfg.label}
                                                        </span>
                                                        {addon.status === 'paid' && (
                                                            <button
                                                                onClick={() => handleAddonStatus(addon.id, 'shipped')}
                                                                disabled={addonLoading === addon.id}
                                                                className="flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-40">
                                                                {addonLoading === addon.id
                                                                    ? <Loader2 size={9} className="animate-spin" />
                                                                    : <Truck size={9} />}
                                                                배송
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* User Actions */}
                            <div className="pt-2 border-t border-slate-100">
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">사용자 관리</label>
                                <div className="flex gap-2">
                                    {order.submitted && (() => {
                                        const { canReset, reason } = getResetInfo();
                                        return (
                                            <button onClick={() => setConfirmAction('reset')}
                                                disabled={!canReset || actionLoading}
                                                className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-40">
                                                <RotateCcw size={12} />
                                                재제출 허용
                                                {!canReset && reason && <span className="text-[10px] text-slate-400">({reason})</span>}
                                            </button>
                                        );
                                    })()}
                                    <button onClick={() => setConfirmAction('delete')}
                                        disabled={actionLoading}
                                        className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40">
                                        <Trash2 size={12} /> 삭제
                                    </button>
                                </div>
                            </div>

                            {/* Confirm action inline */}
                            {confirmAction && (
                                <div className={`rounded-lg p-3 text-center ${confirmAction === 'delete' ? 'bg-red-50' : 'bg-indigo-50'}`}>
                                    <p className="text-xs font-bold text-slate-700 mb-2">
                                        {confirmAction === 'delete' ? '사용자를 삭제하시겠습니까?' : '재제출을 허용하시겠습니까?'}
                                    </p>
                                    <div className="flex gap-2 justify-center">
                                        <button onClick={() => setConfirmAction(null)}
                                            className="px-4 py-1.5 text-xs text-slate-500 rounded-lg hover:bg-white transition-colors">
                                            취소
                                        </button>
                                        <button onClick={() => handleAction(confirmAction)}
                                            disabled={actionLoading}
                                            className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg flex items-center gap-1 ${confirmAction === 'delete' ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                            {actionLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                                            확인
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-slate-100 flex gap-2">
                            <button onClick={onClose}
                                className="flex-1 py-3 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm">
                                취소
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-1.5 disabled:opacity-50">
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                저장
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
