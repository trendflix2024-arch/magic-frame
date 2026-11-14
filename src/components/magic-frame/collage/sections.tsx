"use client";

import { LayoutGrid, Circle, Type, Plus, Trash2, Check, ArrowLeftRight, Save, RotateCcw } from 'lucide-react';
import { BG_COLORS } from './types';
import type { ControlsProps } from './types';
import {
    FONTS,
    TEXT_COLORS,
    TEXT_PRESETS,
    DATE_FORMAT_KEYS,
    formatPickedDate,
    todayIso,
} from '../textPresets';

type LayoutSectionProps = Pick<ControlsProps,
    'layout' | 'filterSlots' | 'filteredLayouts' | 'isPortrait' | 'handleLayoutChange' | 'handleFilterChange'>;

export function LayoutSection({ layout, filterSlots, filteredLayouts, isPortrait, handleLayoutChange, handleFilterChange }: LayoutSectionProps) {
    return (
        <div>
            <label className="text-sm font-medium text-slate-500 mb-2 block flex items-center gap-1">
                <LayoutGrid size={12} /> 레이아웃
            </label>
            <div className="flex gap-1 mb-3 bg-slate-100 rounded-lg p-1">
                {([null, 1, 2, 4, 6, 9] as (number | null)[]).map(s => (
                    <button
                        key={s ?? 'all'}
                        onClick={() => handleFilterChange(s)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${
                            filterSlots === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {s === null ? '전체' : `${s}장`}
                    </button>
                ))}
            </div>
            <div className="overflow-x-auto -mx-1 px-1 pb-2 scrollbar-hide">
                <div className="flex gap-2" style={{ width: 'max-content' }}>
                    {filteredLayouts.map(l => {
                        const isSelected = layout === l.key;
                        const w = isPortrait ? 48 : 60;
                        const h = isPortrait ? 60 : 48;
                        return (
                            <button
                                key={l.key}
                                onClick={() => handleLayoutChange(l.key)}
                                className={`relative flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                                    isSelected ? 'ring-2 ring-indigo-500 ring-offset-1' : 'ring-1 ring-slate-200 hover:ring-indigo-300'
                                }`}
                                style={{ width: w, height: h }}
                            >
                                <div className="absolute inset-0 bg-slate-100">
                                    {l.cells.map((c, i) => (
                                        <div
                                            key={i}
                                            className="absolute rounded-[2px]"
                                            style={{
                                                left: `${c.x * 100 + 5}%`,
                                                top: `${c.y * 100 + 5}%`,
                                                width: `${c.w * 100 - 10}%`,
                                                height: `${c.h * 100 - 10}%`,
                                                backgroundColor: isSelected ? '#818cf8' : '#94a3b8',
                                            }}
                                        />
                                    ))}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

type RatioSectionProps = Pick<ControlsProps, 'ratio' | 'setRatio'>;
export function RatioSection({ ratio, setRatio }: RatioSectionProps) {
    return (
        <div>
            <label className="text-sm font-medium text-slate-500 mb-2 block">콜라주 비율</label>
            <div className="flex gap-2">
                {(['3:4', '4:3'] as const).map(r => (
                    <button
                        key={r}
                        onClick={() => setRatio(r)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                            ratio === r
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200'
                        }`}
                    >
                        {r === '3:4' ? '3 : 4 (세로)' : '4 : 3 (가로)'}
                    </button>
                ))}
            </div>
        </div>
    );
}

type StyleSectionProps = Pick<ControlsProps, 'spacing' | 'setSpacing' | 'cornerRadius' | 'setCornerRadius' | 'bgColor' | 'setBgColor'>;
export function StyleSection({ spacing, setSpacing, cornerRadius, setCornerRadius, bgColor, setBgColor }: StyleSectionProps) {
    return (
        <div className="space-y-5">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-500">여백</label>
                    <span className="text-sm text-slate-400">{spacing}px</span>
                </div>
                <input type="range" min={0} max={20} value={spacing}
                    onChange={e => setSpacing(Number(e.target.value))}
                    className="w-full accent-indigo-600" />
            </div>
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-500 flex items-center gap-1">
                        <Circle size={10} /> 모서리 둥글기
                    </label>
                    <span className="text-sm text-slate-400">{cornerRadius}px</span>
                </div>
                <input type="range" min={0} max={40} value={cornerRadius}
                    onChange={e => setCornerRadius(Number(e.target.value))}
                    className="w-full accent-indigo-600" />
            </div>
            <div>
                <label className="text-sm font-medium text-slate-500 mb-2 block">배경색</label>
                <div className="flex gap-2">
                    {BG_COLORS.map(c => (
                        <button
                            key={c.value}
                            onClick={() => setBgColor(c.value)}
                            className={`w-9 h-9 rounded-full transition-all ${
                                bgColor === c.value ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                            } ${'border' in c && c.border ? 'border border-slate-200' : ''}`}
                            style={{ backgroundColor: c.value }}
                            title={c.label}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

type TextSectionProps = Pick<ControlsProps,
    'texts' | 'selectedTextId' | 'selectedText' | 'setSelectedTextId' | 'addText' | 'updateText' | 'deleteText' | 'pickedDate' | 'setPickedDate'>;

export function TextSection({ texts, selectedTextId, selectedText, setSelectedTextId, addText, updateText, deleteText, pickedDate, setPickedDate }: TextSectionProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <Type size={13} /> 텍스트 <span className="text-[10px] font-medium text-slate-400">(선택)</span>
                </h4>
                <button onClick={addText}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                    <Plus size={12} /> 추가
                </button>
            </div>

            {texts.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2 leading-relaxed">
                    &quot;추가&quot; 버튼으로 문구를 만들고<br />
                    프리뷰에서 드래그해 옮기세요
                </p>
            )}

            {texts.length > 1 && (
                <div className="flex gap-1 flex-wrap">
                    {texts.map((t, i) => (
                        <button key={t.id} onClick={() => setSelectedTextId(t.id)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${selectedTextId === t.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                            T{i + 1}
                        </button>
                    ))}
                </div>
            )}

            {selectedText && (
                <>
                    <div>
                        <label className="text-sm text-slate-400 mb-1 block">추천 문구</label>
                        <select
                            value=""
                            onChange={e => {
                                if (!e.target.value) return;
                                updateText(selectedText.id, { content: e.target.value });
                                e.target.value = "";
                            }}
                            className="w-full px-2 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                        >
                            <option value="">✨ 선물 문구 선택하기...</option>
                            {TEXT_PRESETS.map(group => (
                                <optgroup key={group.category} label={group.category}>
                                    {group.items.map(p => (
                                        <option key={p.label} value={p.content}>{p.label}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-slate-400 mb-1 block">추천 날짜</label>
                        <div className="flex gap-2 mb-1.5">
                            <input
                                type="date"
                                value={pickedDate}
                                onChange={e => setPickedDate(e.target.value || todayIso())}
                                className="flex-1 px-2 py-2 rounded-lg border border-slate-200 text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setPickedDate(todayIso())}
                                className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50"
                            >
                                오늘
                            </button>
                        </div>
                        <select
                            value=""
                            onChange={e => {
                                if (!e.target.value) return;
                                updateText(selectedText.id, { content: e.target.value });
                                e.target.value = "";
                            }}
                            className="w-full px-2 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                        >
                            <option value="">📅 날짜 형식 선택...</option>
                            {DATE_FORMAT_KEYS.map(key => {
                                const formatted = formatPickedDate(pickedDate, key);
                                return <option key={key} value={formatted}>{formatted}</option>;
                            })}
                        </select>
                    </div>
                    <input
                        value={selectedText.content}
                        onChange={e => updateText(selectedText.id, { content: e.target.value })}
                        placeholder="문구를 입력하세요"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                    />
                    <div>
                        <label className="text-sm text-slate-400 mb-1 block">서체</label>
                        <select
                            value={selectedText.font}
                            onChange={e => updateText(selectedText.id, { font: e.target.value })}
                            className="w-full px-2 py-2 rounded-lg border border-slate-200 text-sm"
                            style={{ fontFamily: selectedText.font }}>
                            {FONTS.map(f => (
                                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-slate-400 mb-1 block">색상</label>
                        <div className="flex gap-1.5">
                            {TEXT_COLORS.map(c => (
                                <button key={c.value}
                                    onClick={() => updateText(selectedText.id, { color: c.value })}
                                    className={`w-7 h-7 rounded-full border ${selectedText.color === c.value ? 'ring-2 ring-indigo-500 ring-offset-1' : 'border-slate-200'}`}
                                    style={{ backgroundColor: c.value }} title={c.label} />
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-sm text-slate-400">크기</label>
                            <span className="text-sm text-slate-400">{selectedText.size}px</span>
                        </div>
                        <input type="range" min={12} max={48} value={selectedText.size}
                            onChange={e => updateText(selectedText.id, { size: Number(e.target.value) })}
                            className="w-full accent-indigo-600" />
                    </div>
                    <button onClick={() => deleteText(selectedText.id)}
                        className="w-full py-2.5 bg-red-50 text-red-500 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5">
                        <Trash2 size={13} /> 이 문구 삭제
                    </button>
                </>
            )}
        </div>
    );
}

type ActionsSectionProps = Pick<ControlsProps,
    'hasAnyImage' | 'swapMode' | 'toggleSwap' | 'swappableCount' | 'handleFinalize' | 'handleTempSave' | 'savedToast' | 'reset'>;

export function ActionsSection({ hasAnyImage, swapMode, toggleSwap, swappableCount, handleFinalize, handleTempSave, savedToast, reset }: ActionsSectionProps) {
    return (
        <div className="space-y-2">
            <button
                onClick={handleFinalize}
                disabled={!hasAnyImage}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
                <Check size={16} /> 사진 확정하기
            </button>
            <button
                onClick={toggleSwap}
                disabled={swappableCount < 2}
                className={`w-full py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-40 ${
                    swapMode
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                }`}
            >
                <ArrowLeftRight size={14} />
                {swapMode ? '순서 변경 중... (취소)' : '사진 순서 변경'}
            </button>
            <button
                onClick={handleTempSave}
                disabled={!hasAnyImage}
                className="w-full py-3 bg-white text-indigo-600 border border-indigo-200 font-medium rounded-xl hover:bg-indigo-50 transition-all disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
            >
                <Save size={14} /> {savedToast ? '저장 완료!' : '임시 저장하기'}
            </button>
            <button
                onClick={reset}
                className="w-full py-3 text-slate-400 font-medium rounded-xl hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm"
            >
                <RotateCcw size={14} /> 초기화
            </button>
        </div>
    );
}
