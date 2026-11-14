'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { FinishId, FontId, FrameColorId, FrameSizeId } from './data';

export type ScreenId =
    | 'landing'
    | 'mode'
    | 'gallery'
    | 'collage'
    | 'crop'
    | 'preview'
    | 'order'
    | 'complete';

export type ModeId = 'collage' | 'crop' | 'gallery';
export type CollageLayoutId = 'pair' | 'grid4' | 'mosaic' | 'strip';
export type CollageStyleId = 'classic' | 'polaroid' | 'minimal';
export type CollageRatio = '1:1' | '4:5' | '3:4' | '2:3';
export type CropAspect = '3:4' | '4:3';
export type CropFilter = 'original' | 'warm' | 'cool' | 'mono' | 'vintage';
export type GalleryFilter = 'all' | 'couple' | 'family' | 'birthday';

export interface BrandState {
    currentScreen: ScreenId;
    mode: ModeId;

    collageLayout: CollageLayoutId;
    collageRatio: CollageRatio;
    collageStyle: CollageStyleId;
    collageCaption: string;

    cropAspect: CropAspect;
    cropFilter: CropFilter;
    cropZoom: number;
    cropBrightness: number;
    cropContrast: number;
    cropSaturation: number;
    cropCaption: string;
    cropDate: string;

    frameSize: FrameSizeId;
    frameColor: FrameColorId;
    finish: FinishId;
    qty: number;

    galleryFilter: GalleryFilter;

    dark: boolean;
    fontFamily: FontId;
}

const initial: BrandState = {
    currentScreen: 'landing',
    mode: 'collage',
    collageLayout: 'pair',
    collageRatio: '4:5',
    collageStyle: 'classic',
    collageCaption: '우리의 첫 봄, 2025',
    cropAspect: '3:4',
    cropFilter: 'warm',
    cropZoom: 100,
    cropBrightness: 100,
    cropContrast: 110,
    cropSaturation: 100,
    cropCaption: '함께한 모든 순간',
    cropDate: '2025.04.27',
    frameSize: 'M',
    frameColor: 'natural',
    finish: 'matte',
    qty: 1,
    galleryFilter: 'all',
    dark: false,
    fontFamily: 'pretendard',
};

interface BrandStoreValue extends BrandState {
    set: (patch: Partial<BrandState>) => void;
}

const Ctx = createContext<BrandStoreValue | null>(null);

export function BrandStoreProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<BrandState>(initial);
    const set = useCallback((patch: Partial<BrandState>) => {
        setState(s => ({ ...s, ...patch }));
    }, []);
    const value = useMemo<BrandStoreValue>(() => ({ ...state, set }), [state, set]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBrandStore(): BrandStoreValue {
    const v = useContext(Ctx);
    if (!v) throw new Error('useBrandStore must be used inside BrandStoreProvider');
    return v;
}
