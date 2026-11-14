import type { TextLayer } from '../PhotoCropper';

export interface CellDef { x: number; y: number; w: number; h: number }
export interface Layout { key: string; slots: number; cells: CellDef[] }

export const BG_COLORS = [
    { label: '화이트', value: '#FFFFFF', border: true },
    { label: '블랙', value: '#000000' },
    { label: '그레이', value: '#E2E8F0' },
    { label: '핑크', value: '#FBD5D5' },
    { label: '라벤더', value: '#DDD6FE' },
] as const;

export interface ControlsProps {
    // layout
    layout: string;
    filterSlots: number | null;
    filteredLayouts: Layout[];
    isPortrait: boolean;
    handleLayoutChange: (key: string) => void;
    handleFilterChange: (slots: number | null) => void;
    // ratio
    ratio: '3:4' | '4:3';
    setRatio: (r: '3:4' | '4:3') => void;
    // style
    spacing: number;
    setSpacing: (n: number) => void;
    cornerRadius: number;
    setCornerRadius: (n: number) => void;
    bgColor: string;
    setBgColor: (c: string) => void;
    // text
    texts: TextLayer[];
    selectedTextId: string | null;
    selectedText: TextLayer | null;
    setSelectedTextId: (id: string | null) => void;
    addText: () => void;
    updateText: (id: string, patch: Partial<TextLayer>) => void;
    deleteText: (id: string) => void;
    pickedDate: string;
    setPickedDate: (s: string) => void;
    // actions
    hasAnyImage: boolean;
    swapMode: boolean;
    toggleSwap: () => void;
    swappableCount: number;
    handleFinalize: () => void;
    handleTempSave: () => void;
    savedToast: boolean;
    reset: () => void;
}
