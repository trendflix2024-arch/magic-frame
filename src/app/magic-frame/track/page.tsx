"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Package, PackageCheck, Truck, Clock, ExternalLink,
    MapPin, Hash, ShoppingBag, MessageCircle, Mail,
    ArrowLeft, Loader2, ImageIcon, Search,
} from "lucide-react";
import { TRACKING_URLS, KAKAO_CHANNEL_URL, SUPPORT_EMAIL } from "@/lib/magic-frame-config";

// ── Pipeline config ──

const PIPELINE = [
    { key: "received", label: "사진접수", icon: Package },
    { key: "producing", label: "제작중", icon: PackageCheck },
    { key: "preparing", label: "발송준비", icon: Package },
    { key: "shipped", label: "발송완료", icon: Truck },
] as const;

type PipelineKey = (typeof PIPELINE)[number]["key"];

interface AddonOrder {
    id: string;
    product_name: string;
    amount: number;
    quantity: number;
    status: string;
    created_at: string;
}

interface TrackOrder {
    name: string;
    image_url: string | null;
    created_at: string;
    updated_at: string | null;
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

const ADDON_STATUS: Record<string, { label: string; color: string }> = {
    paid: { label: "결제완료", color: "bg-emerald-100 text-emerald-700" },
    shipped: { label: "배송완료", color: "bg-blue-100 text-blue-700" },
};

function formatDate(d: string | null) {
    if (!d) return "-";
    return new Date(d).toLocaleString("ko-KR", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

// ── Page ──

export default function TrackPage() {
    const router = useRouter();
    const [order, setOrder] = useState<TrackOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notSubmitted, setNotSubmitted] = useState(false);

    useEffect(() => {
        let name = sessionStorage.getItem("mf_name");
        let phone = sessionStorage.getItem("mf_phone");

        if (!name || !phone) {
            const raw = sessionStorage.getItem("magic_frame_session");
            if (raw) {
                try {
                    const s = JSON.parse(raw);
                    name = s.name || null;
                    phone = s.phone || null;
                } catch { /* ignore */ }
            }
        }

        if (!name || !phone) {
            router.replace("/magic-frame/login");
            return;
        }

        (async () => {
            try {
                const res = await fetch("/api/magic-frame/track", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, phone }),
                });
                const data = await res.json();

                if (!res.ok || !data.found) {
                    setError(data.error || "주문 정보를 찾을 수 없습니다.");
                    return;
                }

                if (!data.submitted) {
                    setNotSubmitted(true);
                    return;
                }

                setOrder(data.order);
            } catch {
                setError("서버 오류가 발생했습니다.");
            } finally {
                setLoading(false);
            }
        })();
    }, [router]);

    const currentStep = order
        ? PIPELINE.findIndex(p => p.key === order.unified_status)
        : -1;

    const trackingUrl = order?.shipping_carrier && order?.tracking_number
        ? (TRACKING_URLS[order.shipping_carrier] || "") + order.tracking_number
        : null;

    // ── Loading ──
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    // ── Error / Not found ──
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-sm w-full">
                    <p className="text-slate-500 mb-4">{error}</p>
                    <button onClick={() => router.push("/magic-frame/login")}
                        className="text-indigo-600 font-medium text-sm hover:underline">
                        ← 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    // ── Not submitted ──
    if (notSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-sm w-full">
                    <Clock size={40} className="text-slate-300 mx-auto mb-3" />
                    <h2 className="text-lg font-bold text-slate-800 mb-2">아직 사진이 접수되지 않았습니다</h2>
                    <p className="text-sm text-slate-400 mb-4">사진을 제출하시면 주문 현황을 확인하실 수 있습니다.</p>
                    <button onClick={() => router.push("/magic-frame/login")}
                        className="text-indigo-600 font-medium text-sm hover:underline">
                        ← 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    if (!order) return null;

    // ── Main tracking view ──
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            <div className="max-w-md mx-auto px-4 py-8 space-y-5">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <button onClick={() => router.push("/magic-frame/login")}
                        className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-4">
                        <ArrowLeft size={14} /> 처음으로
                    </button>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Package size={22} className="text-indigo-500" />
                        주문 현황
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">{order.name}님의 매직액자</p>
                </motion.div>

                {/* Pipeline */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <div className="flex items-center justify-between relative">
                        {/* Connection line */}
                        <div className="absolute top-5 left-[12%] right-[12%] h-0.5 bg-slate-100" />
                        <div className="absolute top-5 left-[12%] h-0.5 bg-indigo-400 transition-all duration-500"
                            style={{ width: currentStep >= 0 ? `${(currentStep / (PIPELINE.length - 1)) * 76}%` : "0%" }} />

                        {PIPELINE.map((step, i) => {
                            const Icon = step.icon;
                            const isActive = i <= currentStep;
                            const isCurrent = i === currentStep;
                            return (
                                <div key={step.key} className="flex flex-col items-center relative z-10">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCurrent
                                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200 scale-110"
                                        : isActive
                                            ? "bg-indigo-100 text-indigo-600"
                                            : "bg-slate-100 text-slate-300"
                                        }`}>
                                        <Icon size={18} />
                                    </div>
                                    <span className={`text-[11px] mt-2 font-bold ${isCurrent ? "text-indigo-600" : isActive ? "text-slate-600" : "text-slate-300"}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Photo preview */}
                {order.image_url && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="aspect-[5/7] relative">
                            <img src={order.image_url} alt="제출한 사진"
                                className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4">
                            <p className="text-xs text-slate-400">
                                제출일: {formatDate(order.created_at)}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Shipping info */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
                    <h2 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <Truck size={14} className="text-slate-400" /> 배송 정보
                    </h2>

                    {order.address ? (
                        <p className="text-sm text-slate-600 flex items-start gap-2">
                            <MapPin size={14} className="flex-shrink-0 mt-0.5 text-slate-300" />
                            <span>
                                {order.postal_code && `[${order.postal_code}] `}
                                {order.address}
                                {order.address_detail && ` ${order.address_detail}`}
                            </span>
                        </p>
                    ) : (
                        <p className="text-sm text-slate-400">배송지 정보가 아직 등록되지 않았습니다.</p>
                    )}

                    {order.tracking_number && (
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                            <Hash size={14} className="flex-shrink-0 text-slate-300" />
                            {order.shipping_carrier && <span className="font-medium">{order.shipping_carrier}</span>}
                            <span>{order.tracking_number}</span>
                        </p>
                    )}

                    {order.shipped_at && (
                        <p className="text-xs text-emerald-500 flex items-center gap-1.5">
                            <Truck size={12} /> 발송일: {formatDate(order.shipped_at)}
                        </p>
                    )}

                    {order.shipping_memo && (
                        <p className="text-xs text-slate-400 italic">{order.shipping_memo}</p>
                    )}

                    {/* Tracking button */}
                    {trackingUrl ? (
                        <a href={trackingUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm mt-2">
                            <Search size={16} /> 배송 조회하기 <ExternalLink size={12} />
                        </a>
                    ) : order.unified_status !== "shipped" ? (
                        <div className="text-center py-3 bg-slate-50 rounded-xl">
                            <p className="text-xs text-slate-400">발송 후 배송 조회가 가능합니다.</p>
                        </div>
                    ) : null}
                </motion.div>

                {/* Addon orders */}
                {order.addon_orders.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
                        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                            <ShoppingBag size={14} className="text-slate-400" /> 추가 구매 상품
                        </h2>
                        <div className="space-y-2">
                            {order.addon_orders.map(addon => {
                                const cfg = ADDON_STATUS[addon.status] || ADDON_STATUS.paid;
                                return (
                                    <div key={addon.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                        <div>
                                            <p className="text-sm text-slate-700 font-medium">{addon.product_name}</p>
                                            <p className="text-xs text-slate-400">x{addon.quantity}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-700">
                                                ₩{addon.amount.toLocaleString()}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}>
                                                {cfg.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Contact */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="flex gap-3">
                    <a href={KAKAO_CHANNEL_URL} target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-yellow-400 text-yellow-900 font-bold rounded-xl hover:bg-yellow-500 transition-colors text-sm">
                        <MessageCircle size={16} /> 카카오톡 문의
                    </a>
                    <a href={`mailto:${SUPPORT_EMAIL}`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm">
                        <Mail size={16} /> 이메일 문의
                    </a>
                </motion.div>

            </div>
        </div>
    );
}
