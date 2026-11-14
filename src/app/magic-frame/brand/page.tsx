'use client';

import '@/components/magic-frame/brand/brand.css';

import { useEffect, useRef } from 'react';
import { FONT_FAMILIES } from '@/components/magic-frame/brand/data';
import {
    BrandStoreProvider,
    useBrandStore,
} from '@/components/magic-frame/brand/store';
import { Tweaks } from '@/components/magic-frame/brand/tweaks';
import { LandingScreen } from '@/components/magic-frame/brand/screens/Landing';
import { ModeSelectScreen } from '@/components/magic-frame/brand/screens/ModeSelect';
import { GalleryScreen } from '@/components/magic-frame/brand/screens/Gallery';
import { CollageScreen } from '@/components/magic-frame/brand/screens/Collage';
import { CropScreen } from '@/components/magic-frame/brand/screens/Crop';
import { FramePreviewScreen } from '@/components/magic-frame/brand/screens/FramePreview';
import { OrderSummaryScreen } from '@/components/magic-frame/brand/screens/OrderSummary';
import { OrderCompleteScreen } from '@/components/magic-frame/brand/screens/OrderComplete';

function ScreenSwitcher() {
    const store = useBrandStore();
    const rootRef = useRef<HTMLDivElement>(null);

    // 폰트 변경은 .mjb 루트에만 적용 (다른 라우트 영향 0)
    useEffect(() => {
        if (rootRef.current) {
            rootRef.current.style.setProperty('--font-sans', FONT_FAMILIES[store.fontFamily] ?? FONT_FAMILIES.pretendard);
        }
    }, [store.fontFamily]);

    return (
        <div
            ref={rootRef}
            className="mjb"
            data-theme={store.dark ? 'dark' : 'light'}
        >
            {store.currentScreen === 'landing'  && <LandingScreen />}
            {store.currentScreen === 'mode'     && <ModeSelectScreen />}
            {store.currentScreen === 'gallery'  && <GalleryScreen />}
            {store.currentScreen === 'collage'  && <CollageScreen />}
            {store.currentScreen === 'crop'     && <CropScreen />}
            {store.currentScreen === 'preview'  && <FramePreviewScreen />}
            {store.currentScreen === 'order'    && <OrderSummaryScreen />}
            {store.currentScreen === 'complete' && <OrderCompleteScreen />}

            <Tweaks />
        </div>
    );
}

export default function MagicFrameBrandPage() {
    return (
        <BrandStoreProvider>
            <ScreenSwitcher />
        </BrandStoreProvider>
    );
}
