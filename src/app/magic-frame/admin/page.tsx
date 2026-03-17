"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldAlert, RefreshCw, Loader2, ClipboardList, Package } from "lucide-react";
import { OrdersTab } from "@/components/magic-frame/admin/OrdersTab";
import { ProductsTab } from "@/components/magic-frame/admin/ProductsTab";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);

export default function MagicFrameAdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [tab, setTab] = useState<"orders" | "products">("orders");
    const [refreshKey, setRefreshKey] = useState(0);

    const isDev = process.env.NODE_ENV === "development";
    const isAdmin = isDev || (status === "authenticated" && ADMIN_EMAILS.includes(session?.user?.email || ""));

    if (!isDev && status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    if (!isAdmin) {
        if (status === "authenticated") router.replace("/magic-frame");
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <ShieldAlert size={18} className="text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-800">매직액자 관리</h1>
                            <p className="text-xs text-slate-400">주문 · 배송 · 상품 관리</p>
                        </div>
                    </div>
                    <button onClick={() => setRefreshKey(k => k + 1)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <RefreshCw size={14} /> 새로고침
                    </button>
                </div>

                {/* Tabs */}
                <div className="max-w-5xl mx-auto px-4 pb-3">
                    <div className="inline-flex bg-slate-100 rounded-full p-1">
                        <button onClick={() => setTab("orders")}
                            className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold transition-all ${tab === "orders"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"}`}>
                            <ClipboardList size={14} /> 주문 관리
                        </button>
                        <button onClick={() => setTab("products")}
                            className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold transition-all ${tab === "products"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"}`}>
                            <Package size={14} /> 상품 관리
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
                {tab === "orders" && <OrdersTab key={`orders-${refreshKey}`} />}
                {tab === "products" && <ProductsTab key={`products-${refreshKey}`} />}
            </div>
        </div>
    );
}
