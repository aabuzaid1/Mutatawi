'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IoClose, IoDownloadOutline, IoCreateOutline } from 'react-icons/io5';
import { AISheetsOutput } from '@/app/types';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface SheetsPreviewProps {
    data: AISheetsOutput;
    onClose: () => void;
}

export default function SheetsPreview({ data, onClose }: SheetsPreviewProps) {
    const [editMode, setEditMode] = useState(false);
    const [editedData, setEditedData] = useState<AISheetsOutput>(() => JSON.parse(JSON.stringify(data)));

    const updateCell = (rowIndex: number, colIndex: number, value: string) => {
        const newRows = editedData.rows.map((row, ri) =>
            ri === rowIndex ? row.map((cell, ci) => ci === colIndex ? value : cell) : [...row]
        );
        setEditedData({ ...editedData, rows: newRows });
    };

    const updateHeader = (colIndex: number, value: string) => {
        const newCols = editedData.columns.map((col, i) => i === colIndex ? value : col);
        setEditedData({ ...editedData, columns: newCols });
    };

    const downloadXlsx = useCallback(() => {
        const ws = XLSX.utils.aoa_to_sheet([editedData.columns, ...editedData.rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        
        // Set RTL
        if (!ws['!cols']) ws['!cols'] = [];
        ws['!cols'] = editedData.columns.map(() => ({ wch: 20 }));
        
        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${editedData.title || 'spreadsheet'}.xlsx`);
    }, [editedData]);

    const downloadCsv = useCallback(() => {
        const rows = [editedData.columns, ...editedData.rows];
        const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const bom = '\uFEFF'; // UTF-8 BOM for Arabic
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${editedData.title || 'spreadsheet'}.csv`);
    }, [editedData]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                            <IoClose size={20} />
                        </button>
                        <h2 className="font-bold text-slate-800 text-sm truncate">{editedData.title}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setEditMode(!editMode)}
                            className={`p-2 rounded-lg text-sm ${editMode ? 'bg-amber-100 text-amber-700' : 'hover:bg-slate-100 text-slate-500'}`}
                        >
                            <IoCreateOutline size={18} />
                        </button>
                        <button
                            onClick={downloadXlsx}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl font-bold text-xs hover:bg-green-700 transition-colors"
                        >
                            <IoDownloadOutline size={14} />
                            XLSX
                        </button>
                        <button
                            onClick={downloadCsv}
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-600 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition-colors"
                        >
                            <IoDownloadOutline size={14} />
                            CSV
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto p-4">
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-sm" dir="rtl">
                            <thead>
                                <tr className="bg-gradient-to-l from-green-50 to-emerald-50">
                                    {editedData.columns.map((col, ci) => (
                                        <th key={ci} className="px-4 py-3 text-right font-bold text-slate-700 border-b border-l border-slate-200 last:border-l-0 whitespace-nowrap">
                                            {editMode ? (
                                                <input
                                                    value={col}
                                                    onChange={(e) => updateHeader(ci, e.target.value)}
                                                    className="bg-transparent border-b border-green-300 outline-none w-full text-right font-bold"
                                                />
                                            ) : col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {editedData.rows.map((row, ri) => (
                                    <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                        {row.map((cell, ci) => (
                                            <td key={ci} className="px-4 py-2.5 text-right text-slate-600 border-b border-l border-slate-100 last:border-l-0 whitespace-nowrap">
                                                {editMode ? (
                                                    <input
                                                        value={cell}
                                                        onChange={(e) => updateCell(ri, ci, e.target.value)}
                                                        className="bg-transparent border-b border-slate-200 outline-none w-full text-right focus:border-green-400"
                                                    />
                                                ) : cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-3 text-center">
                        {editedData.rows.length} صف × {editedData.columns.length} أعمدة
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}
