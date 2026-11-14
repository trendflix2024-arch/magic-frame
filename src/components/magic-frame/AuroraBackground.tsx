"use client";
import React, { ReactNode } from "react";

export function AuroraBackground({
    className = "",
    children,
    showRadialGradient = true,
    ...props
}: React.HTMLProps<HTMLDivElement> & { children: ReactNode; showRadialGradient?: boolean }) {
    return (
        <div
            className={`relative flex flex-col min-h-[100dvh] items-center justify-center bg-white text-slate-950 ${className}`}
            {...props}
        >
            {/* Aurora overlay — z-0, isolated so blend modes don't leak */}
            <div
                aria-hidden="true"
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ zIndex: 0, isolation: 'isolate' }}
            >
                <div
                    className={[
                        "absolute -inset-[10px] opacity-50 will-change-transform",
                        "[background-image:repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%),repeating-linear-gradient(100deg,#3b82f6_10%,#a5b4fc_15%,#93c5fd_20%,#ddd6fe_25%,#60a5fa_30%)]",
                        "[background-size:300%,_200%]",
                        "[background-position:50%_50%,50%_50%]",
                        "filter blur-[10px] invert",
                        "after:content-[''] after:absolute after:inset-0",
                        "after:[background-image:repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%),repeating-linear-gradient(100deg,#3b82f6_10%,#a5b4fc_15%,#93c5fd_20%,#ddd6fe_25%,#60a5fa_30%)]",
                        "after:[background-size:200%,_100%]",
                        "after:animate-aurora",
                        "after:[background-attachment:fixed]",
                        "after:mix-blend-difference",
                        showRadialGradient
                            ? "[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]"
                            : "",
                    ].join(" ")}
                />
            </div>

            {/* Content — always above aurora */}
            <div style={{ position: 'relative', zIndex: 10, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {children}
            </div>
        </div>
    );
}
