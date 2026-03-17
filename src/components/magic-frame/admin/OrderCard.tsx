"use client";

import { motion } from 'framer-motion';
import {
    Clock, Package, PackageCheck, Truck, ImageIcon,
    MapPin, Hash, MessageSquare, ShoppingBag, Trash2,
    ChevronDown, RotateCcw, Loader2, ExternalLink, Download,
} from 'lucide-react';
import { useState } from 'react';
import { TRACKING_URLS } from '@/lib/magic-frame-config';

// ── Types ──

export interface AddonOrder {
    id: string;
    product_id: string;
    product_name: string;
    amount: number;
    quantity: number;
    status: 'paid' | 'shipped' | 'cancelled';
    created_at: string;
}

export interface UnifiedOrder {
    id: string;
    name: string;
    phone: string;
    submitted: boolean;
    image_url: string | null;
    image_type: string | null;
    updated_at: string | null;
    created_at: string;
    unified_status: string;
    shipping_status: string;
    address: string | null;
    postal_code: string | null;
    address_detail: string | null;
    tracking_number: string | null;
    shipping_carrier: string | null;
    shipping_memo: string | null;
    shipped_at: string | null;
    addon_orders: AddonOrder[];
}

export const PIPELINE_CONFIG = {
    waiting: { label: '대기', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', icon: Clock },
    received: { label: '사진접수', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400', icon: Package },
    producing: { label: '제작중', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400', icon: PackageCheck },
    preparing: { label: '발송준비', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400', icon: Package },
    shipped: { label: '발송완료', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400', icon: Truck },
} as const;

export type PipelineStatus = keyof typeof PIPELINE_CONFIG;

// Maps unified status → shipping_status for API calls
export const STATUS_TO_SHIPPING: Record<string, string> = {
    received: 'pending',
    producing: 'new_order',
    preparing: 'preparing',
    shipped: 'shipped',
};

const ADDON_STATUS: Record<string, { label: string; color: string }> = {
    paid: { label: '결제완료', color: 'bg-emerald-100 text-emerald-700' },
    shipped: { label: '배송완료', color: 'bg-blue-100 text-blue-700' },
    cancelled: { label: '취소', color: 'bg-red-100 text-red-700' },
};

// ── Helpers ──

export function formatPhone(phone: string) {
    if (phone.length === 11) return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
    if (phone.length === 10) return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
    return phone;
}

export function formatDate(d: string | null) {
    if (!d) return '-';
    return new Date(d).toLocaleString('ko-KR', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

// ── Component ──

interface OrderCardProps {
    order: UnifiedOrder;
    selected: boolean;
    onToggleSelect: (id: string) => void;
    onStatusChange: (userId: string, shippingStatus: string) => void;
    onOpenDetail: (order: UnifiedOrder) => void;
    onDelete: (userId: string) => void;
    onOpenLightbox: (url: string) => void;
    statusLoading?: string | null;
}

export function OrderCard({
    order, selected, onToggleSelect, onStatusChange,
    onOpenDetail, onDelete, onOpenLightbox, statusLoading,
}: OrderCardProps) {
    const [dropdown, setDropdown] = useState(false);
    const cfg = PIPELINE_CONFIG[order.unified_status as PipelineStatus] || PIPELINE_CONFIG.received;
    const StatusIcon = cfg.icon;

    const activeAddons = order.addon_orders.filter(o => o.status !== 'cancelled');
    const addonTotal = activeAddons.reduce((s, o) => s + o.amount, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-xl border shadow-sm transition-colors ${selected ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-100'}`}
        >
            <div className="flex items-start gap-3 p-3 sm:p-4">
                {/* Checkbox */}
                <input type="checkbox" checked={selected}
                    onChange={() => onToggleSelect(order.id)}
                    className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0" />

                {/* Thumbnail */}
                <div className="w-14 h-[72px] rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 cursor-pointer border border-slate-200"
                    onClick={() => order.image_url && onOpenLightbox(order.image_url)}>
                    {order.image_url ? (
                        <img src={order.image_url} alt={order.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={16} className="text-slate-300" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    {/* Name + Status */}
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-bold text-slate-800">{order.name}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${cfg.color}`}>
                            <StatusIcon size={10} /> {cfg.label}
                        </span>
                        {activeAddons.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full">
                                <ShoppingBag size={10} /> {activeAddons.length}건 ₩{addonTotal.toLocaleString()}
                            </span>
                        )}
                    </div>

                    {/* Phone + Date */}
                    <p className="text-xs text-slate-400">
                        {formatPhone(order.phone)}
                        <span className="text-slate-300 mx-1.5">·</span>
                        {formatDate(order.updated_at || order.created_at)}
                    </p>

                    {/* Address */}
                    {order.address && (
                        <p className="text-[11px] text-slate-500 mt-1.5 flex items-start gap-1">
                            <MapPin size={11} className="flex-shrink-0 mt-0.5 text-slate-300" />
                            <span className="truncate">
                                {order.postal_code && `[${order.postal_code}] `}
                                {order.address}
                                {order.address_detail && ` ${order.address_detail}`}
                            </span>
                        </p>
                    )}

                    {/* Tracking */}
                    {order.tracking_number && (() => {
                        const trackUrl = order.shipping_carrier
                            ? (TRACKING_URLS[order.shipping_carrier] || '') + order.tracking_number
                            : '';
                        return (
                            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                <Hash size={11} className="flex-shrink-0 text-slate-300" />
                                {order.shipping_carrier && <span className="font-medium">{order.shipping_carrier}</span>}
                                {trackUrl ? (
                                    <a href={trackUrl} target="_blank" rel="noopener noreferrer"
                                        className="text-indigo-600 hover:underline flex items-center gap-0.5">
                                        {order.tracking_number} <ExternalLink size={9} />
                                    </a>
                                ) : (
                                    <span>{order.tracking_number}</span>
                                )}
                            </p>
                        );
                    })()}

                    {/* Memo */}
                    {order.shipping_memo && (
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <MessageSquare size={10} className="flex-shrink-0 text-slate-300" />
                            {order.shipping_memo}
                        </p>
                    )}

                    {/* Shipped date */}
                    {order.shipped_at && (
                        <p className="text-[10px] text-emerald-500 mt-0.5 flex items-center gap-1">
                            <Truck size={10} className="flex-shrink-0" />
                            발송: {formatDate(order.shipped_at)}
                        </p>
                    )}

                    {/* Add-on orders */}
                    {activeAddons.length > 0 && (
                        <div className="mt-2 bg-slate-50 rounded-lg p-2 space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <ShoppingBag size={10} /> 추가 구매
                            </p>
                            {activeAddons.map(addon => {
                                const addonCfg = ADDON_STATUS[addon.status] || ADDON_STATUS.paid;
                                return (
                                    <div key={addon.id} className="flex items-center justify-between text-[11px]">
                                        <span className="text-slate-600">{addon.product_name} x{addon.quantity}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-700">₩{addon.amount.toLocaleString()}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${addonCfg.color}`}>
                                                {addonCfg.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Status dropdown */}
                    {order.submitted && (
                        <div className="relative">
                            <button onClick={() => setDropdown(!dropdown)}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                {statusLoading === order.id
                                    ? <Loader2 size={12} className="animate-spin" />
                                    : <ChevronDown size={12} />}
                                <span className="hidden sm:inline">상태</span>
                            </button>
                            {dropdown && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setDropdown(false)} />
                                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-20 min-w-[110px]">
                                        {(['received', 'producing', 'preparing', 'shipped'] as PipelineStatus[]).map(key => {
                                            const c = PIPELINE_CONFIG[key];
                                            return (
                                                <button key={key}
                                                    onClick={() => {
                                                        setDropdown(false);
                                                        onStatusChange(order.id, STATUS_TO_SHIPPING[key]);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${order.unified_status === key
                                                        ? 'text-indigo-600 bg-indigo-50'
                                                        : 'text-slate-700 hover:bg-slate-50'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                                                    {c.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Download photo */}
                    {order.image_url && (
                        <button onClick={async () => {
                            try {
                                const res = await fetch(order.image_url!);
                                const blob = await res.blob();
                                const ext = order.image_url!.split('.').pop()?.split('?')[0] || 'jpg';
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${order.name}${order.phone}.${ext}`;
                                a.click();
                                URL.revokeObjectURL(url);
                            } catch { /* ignore */ }
                        }}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                            <Download size={12} />
                        </button>
                    )}

                    {/* Detail */}
                    <button onClick={() => onOpenDetail(order)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                        <span className="hidden sm:inline">상세</span>
                        <MapPin size={12} />
                    </button>

                    {/* Delete */}
                    <button onClick={() => onDelete(order.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
