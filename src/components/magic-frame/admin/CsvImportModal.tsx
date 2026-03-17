"use client";

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import Papa from 'papaparse';

interface CsvImportModalProps {
    open: boolean;
    onClose: () => void;
    onImportComplete: () => void;
}

interface CsvEntry {
    name: string;
    phone: string;
    address: string;
    postal_code: string;
    address_detail: string;
}

interface MatchResult extends CsvEntry {
    matched: boolean;
    isNew: boolean;
    userId: string | null;
    currentStatus: string | null;
    alreadyHasAddress: boolean;
}

// Map common Korean CSV headers to our field names
const HEADER_MAP: Record<string, string> = {
    '이름': 'name', 'name': 'name', '성명': 'name', '수령인': 'name', '받는분': 'name',
    '연락처': 'phone', 'phone': 'phone', '전화번호': 'phone', '휴대폰': 'phone', '핸드폰': 'phone', '전화': 'phone',
    '주소': 'address', 'address': 'address', '배송지': 'address', '배송주소': 'address',
    '우편번호': 'postal_code', 'postal_code': 'postal_code', '우편': 'postal_code', 'zip': 'postal_code',
    '상세주소': 'address_detail', 'address_detail': 'address_detail', '상세': 'address_detail',
};

export function CsvImportModal({ open, onClose, onImportComplete }: CsvImportModalProps) {
    const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
    const [entries, setEntries] = useState<CsvEntry[]>([]);
    const [results, setResults] = useState<MatchResult[]>([]);
    const [summary, setSummary] = useState<{ total: number; matched: number; newUsers: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [appliedCount, setAppliedCount] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setStep('upload');
        setEntries([]);
        setResults([]);
        setSummary(null);
        setError('');
        setAppliedCount(0);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const parseCsv = useCallback((file: File) => {
        setError('');
        setLoading(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                if (!result.data?.length) {
                    setError('CSV 파일에 데이터가 없습니다.');
                    setLoading(false);
                    return;
                }

                // Map headers
                const rows = result.data as Record<string, string>[];
                const parsed: CsvEntry[] = rows.map(row => {
                    const mapped: Record<string, string> = {};
                    for (const [key, value] of Object.entries(row)) {
                        const normalized = HEADER_MAP[key.trim()] || key.trim();
                        mapped[normalized] = (value || '').trim();
                    }
                    return {
                        name: mapped.name || '',
                        phone: mapped.phone || '',
                        address: mapped.address || '',
                        postal_code: mapped.postal_code || '',
                        address_detail: mapped.address_detail || '',
                    };
                }).filter(e => e.name && e.phone);

                if (!parsed.length) {
                    setError('유효한 데이터가 없습니다. "이름"과 "연락처" 컬럼이 필요합니다.');
                    setLoading(false);
                    return;
                }

                setEntries(parsed);
                matchEntries(parsed);
            },
            error: () => {
                setError('CSV 파일을 읽을 수 없습니다.');
                setLoading(false);
            },
        });
    }, []);

    const matchEntries = async (entries: CsvEntry[]) => {
        try {
            const res = await fetch('/api/magic-frame/admin/shipping/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries }),
            });
            const data = await res.json();
            if (data.error) {
                setError(data.error);
                return;
            }
            setResults(data.results);
            setSummary(data.summary);
            setStep('preview');
        } catch {
            setError('매칭 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        const matches = results.map(r => ({
            userId: r.userId,
            name: r.name,
            phone: r.phone,
            address: r.address,
            postal_code: r.postal_code,
            address_detail: r.address_detail,
            isNew: r.isNew,
        }));

        if (!matches.length) {
            setError('적용할 데이터가 없습니다.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/magic-frame/admin/shipping/import', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matches }),
            });
            const data = await res.json();
            if (data.error) {
                setError(data.error);
                return;
            }
            setAppliedCount(data.applied);
            setStep('done');
            onImportComplete();
        } catch {
            setError('적용 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
            parseCsv(file);
        } else {
            setError('CSV 파일만 업로드 가능합니다.');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) parseCsv(file);
    };

    const formatPhone = (phone: string) => {
        const p = phone.replace(/[^0-9]/g, '');
        if (p.length === 11) return `${p.slice(0, 3)}-${p.slice(3, 7)}-${p.slice(7)}`;
        if (p.length === 10) return `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6)}`;
        return phone;
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col">

                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet size={18} className="text-indigo-600" />
                                <h3 className="text-base font-bold text-slate-800">고객 등록 / 주소 업로드</h3>
                            </div>
                            <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-500 text-xs rounded-lg p-3 flex items-center gap-1.5">
                                    <AlertCircle size={12} /> {error}
                                </div>
                            )}

                            {/* Step 1: Upload */}
                            {step === 'upload' && (
                                <div
                                    className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleFileDrop}
                                    onClick={() => fileRef.current?.click()}>
                                    <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
                                    {loading ? (
                                        <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-3" />
                                    ) : (
                                        <Upload size={32} className="text-slate-300 mx-auto mb-3" />
                                    )}
                                    <p className="text-sm font-bold text-slate-600 mb-1">
                                        {loading ? '파일 처리 중...' : 'CSV 파일을 드래그하거나 클릭하세요'}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        필수 컬럼: 이름, 연락처, 주소
                                    </p>
                                    <p className="text-[10px] text-slate-300 mt-2">
                                        선택 컬럼: 우편번호, 상세주소
                                    </p>
                                </div>
                            )}

                            {/* Step 2: Preview */}
                            {step === 'preview' && (
                                <>
                                    {summary && (
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-slate-50 rounded-lg p-3 text-center">
                                                <p className="text-lg font-bold text-slate-800">{summary.total}</p>
                                                <p className="text-[10px] text-slate-400">전체</p>
                                            </div>
                                            <div className="flex-1 bg-emerald-50 rounded-lg p-3 text-center">
                                                <p className="text-lg font-bold text-emerald-600">{summary.matched}</p>
                                                <p className="text-[10px] text-slate-400">기존 고객</p>
                                            </div>
                                            <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
                                                <p className="text-lg font-bold text-blue-600">{summary.newUsers}</p>
                                                <p className="text-[10px] text-slate-400">신규 등록</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <div className="max-h-64 overflow-y-auto">
                                            <table className="w-full text-xs">
                                                <thead className="bg-slate-50 sticky top-0">
                                                    <tr>
                                                        <th className="text-left px-3 py-2 font-bold text-slate-500">이름</th>
                                                        <th className="text-left px-3 py-2 font-bold text-slate-500">연락처</th>
                                                        <th className="text-left px-3 py-2 font-bold text-slate-500">주소</th>
                                                        <th className="text-center px-3 py-2 font-bold text-slate-500">매칭</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {results.map((r, i) => (
                                                        <tr key={i} className={`border-t border-slate-100 ${r.isNew ? 'bg-blue-50/50' : ''}`}>
                                                            <td className="px-3 py-2 font-medium text-slate-700">{r.name}</td>
                                                            <td className="px-3 py-2 text-slate-500">{formatPhone(r.phone)}</td>
                                                            <td className="px-3 py-2 text-slate-500 max-w-[140px] truncate">{r.address}</td>
                                                            <td className="px-3 py-2 text-center">
                                                                {r.matched ? (
                                                                    <span className="inline-flex items-center gap-0.5 text-emerald-600">
                                                                        <CheckCircle2 size={12} />
                                                                        {r.alreadyHasAddress && <span className="text-[10px] text-amber-500 ml-1">덮어쓰기</span>}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-blue-500 text-[10px] font-bold">신규</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 3: Done */}
                            {step === 'done' && (
                                <div className="text-center py-6">
                                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 size={28} className="text-emerald-600" />
                                    </div>
                                    <h4 className="text-base font-bold text-slate-800 mb-1">등록 완료</h4>
                                    <p className="text-sm text-slate-500">{appliedCount}건이 처리되었습니다</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-slate-100 flex gap-2">
                            {step === 'preview' && (
                                <>
                                    <button onClick={reset}
                                        className="flex-1 py-3 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm">
                                        다시 선택
                                    </button>
                                    <button onClick={handleApply} disabled={loading || !summary?.total}
                                        className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 text-sm">
                                        {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                                        {summary?.total || 0}건 적용
                                    </button>
                                </>
                            )}
                            {step === 'done' && (
                                <button onClick={handleClose}
                                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm">
                                    확인
                                </button>
                            )}
                            {step === 'upload' && !loading && (
                                <button onClick={handleClose}
                                    className="flex-1 py-3 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm">
                                    닫기
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
