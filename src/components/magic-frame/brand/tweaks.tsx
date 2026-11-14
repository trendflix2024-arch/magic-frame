'use client';

import { useState } from 'react';
import { Icon } from './atoms';
import { FONT_OPTIONS } from './data';
import { useBrandStore } from './store';

export function Tweaks() {
    const store = useBrandStore();
    const [open, setOpen] = useState(false);
    return (
        <>
            {open && (
                <div className="mj-tweaks-panel" role="dialog">
                    <div style={{ fontWeight: 600, color: 'var(--ink-700)', marginBottom: 8 }}>외관</div>
                    <div className="mj-tweaks-row">
                        <span style={{ color: 'var(--ink-700)' }}>다크 모드</span>
                        <button
                            className={`mj-toggle ${store.dark ? 'on' : ''}`}
                            onClick={() => store.set({ dark: !store.dark })}
                            aria-label="다크 모드 토글"
                        />
                    </div>
                    <div className="mj-tweaks-row">
                        <span style={{ color: 'var(--ink-700)' }}>폰트</span>
                        <select
                            value={store.fontFamily}
                            onChange={e => store.set({ fontFamily: e.target.value as typeof store.fontFamily })}
                            style={{
                                fontSize: 12,
                                padding: '4px 6px',
                                border: '1px solid var(--ink-200)',
                                borderRadius: 6,
                                background: 'white',
                                color: 'var(--ink-800)',
                            }}
                        >
                            {FONT_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 10, lineHeight: 1.5 }}>
                        버튼을 클릭하면 다음 화면이 따라서 업데이트됩니다.
                    </div>
                </div>
            )}
            <button
                className="mj-tweaks-fab"
                onClick={() => setOpen(o => !o)}
                aria-label="환경설정"
            >
                {open ? <Icon.close /> : <Icon.cog />}
            </button>
        </>
    );
}
