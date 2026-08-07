'use client';

import React, { useState } from 'react';

export interface ColumnDef<T> {
  key: string;
  label: string;
  editable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => React.ReactNode;
}

export interface FilterCategory {
  label: string;
  key: string;
  count?: number;
}

export interface ExcelWorksheetTableProps<T> {
  title?: string;
  data: T[];
  columns: ColumnDef<T>[];
  idKey: keyof T;
  filterCategories?: FilterCategory[];
  activeFilter?: string;
  onFilterChange?: (filterKey: string) => void;
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;
  onAddRow?: () => void;
  onExportCSV?: () => void;
  onInlineSave?: (id: string, key: string, newValue: any) => void;
  loading?: boolean;
  actionRenderer?: (row: T) => React.ReactNode;
}

export function ExcelWorksheetTable<T extends Record<string, any>>({
  title = 'Worksheet Data Grid',
  data,
  columns,
  idKey,
  filterCategories,
  activeFilter = 'all',
  onFilterChange,
  searchPlaceholder = 'Search column values...',
  onSearchChange,
  onAddRow,
  onExportCSV,
  onInlineSave,
  loading = false,
  actionRenderer,
}: ExcelWorksheetTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: string; key: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Handle Search Input
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (onSearchChange) onSearchChange(q);
  };

  // Handle Sort Toggle
  const handleSort = (key: string) => {
    if (sortField === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(key);
      setSortOrder('asc');
    }
  };

  // Inline Cell Edit
  const startInlineEdit = (id: string, key: string, currentValue: any) => {
    setEditingCell({ id, key });
    setEditValue(String(currentValue ?? ''));
  };

  const saveInlineEdit = (id: string, key: string) => {
    if (onInlineSave) {
      onInlineSave(id, key, editValue);
    }
    setEditingCell(null);
  };

  // Checkbox Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map((item) => String(item[idKey])));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Export Selected CSV
  const exportSelectedCSV = () => {
    const selectedRows = data.filter((item) => selectedIds.includes(String(item[idKey])));
    if (selectedRows.length === 0) return;

    const headers = columns.map((c) => c.label);
    const rows = selectedRows.map((r) => columns.map((c) => `"${r[c.key] ?? ''}"`));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `selected_rows_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Search Filtered Data
  const filteredData = data.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return columns.some((col) => {
      const val = item[col.key];
      return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
    });
  });

  // Sort Data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="w-full space-y-3 font-sans">
      {/* Top Header & Toolbars */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-300 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-[#1c1c1e] uppercase tracking-tight">{title}</h2>
          <p className="text-xs font-semibold text-neutral-500">
            Tap or double-click ✏️ cells to edit inline • Tap headers to sort
          </p>
        </div>

        {/* Category Filters with >=44px Touch Targets for Mobile */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          {filterCategories &&
            filterCategories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => onFilterChange && onFilterChange(cat.key)}
                className={`font-black uppercase px-3.5 py-2.5 min-h-[44px] flex items-center justify-center rounded-xl transition whitespace-nowrap active:scale-95 ${
                  activeFilter === cat.key
                    ? 'bg-[#ff3b30] text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {cat.label} {cat.count !== undefined ? `(${cat.count})` : ''}
              </button>
            ))}
        </div>

        {/* Search & Action Controls with Prevented Mobile Input Zoom (text-base md:text-xs) */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full sm:w-52 text-base md:text-xs font-bold px-3 py-2.5 min-h-[44px] bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#ff3b30]"
          />
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="text-xs font-extrabold uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 px-3 py-2.5 min-h-[44px] flex items-center justify-center rounded-xl transition whitespace-nowrap active:scale-95"
            >
              Export CSV
            </button>
          )}
          {onAddRow && (
            <button
              onClick={onAddRow}
              className="text-xs font-black uppercase bg-[#ff3b30] hover:bg-[#bd2925] text-white px-4 py-2.5 min-h-[44px] flex items-center justify-center rounded-xl transition shadow-sm whitespace-nowrap active:scale-95"
            >
              + Add Row
            </button>
          )}
        </div>
      </div>

      {/* Batch Action Bar (Triggered when rows are checked) */}
      {selectedIds.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center justify-between text-xs font-bold text-red-950">
          <span className="flex items-center gap-2 font-black uppercase">
            <span>✓ {selectedIds.length} Rows Selected</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={exportSelectedCSV}
              className="px-3 py-2 min-h-[44px] flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase rounded-xl shadow-2xs active:scale-95"
            >
              Export Selected CSV
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-2 min-h-[44px] flex items-center justify-center bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 font-bold text-xs uppercase rounded-xl active:scale-95"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* FULL EXCEL WORKSHEET TABLE FOR DESKTOP & WIDESCREEN */}
      <div className="bg-white border border-neutral-300 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-neutral-900 text-white text-[10px] font-black uppercase tracking-wider border-b border-neutral-800 select-none">
                <th className="p-2 border-r border-neutral-800 w-12 text-center">
                  <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={data.length > 0 && selectedIds.length === data.length}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 accent-[#ff3b30] cursor-pointer"
                    />
                  </div>
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`p-2.5 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 whitespace-nowrap ${
                      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 min-h-[28px]">
                      <span>{col.label}</span>
                      <span className="text-neutral-400 font-normal text-[9px]">
                        {sortField === col.key ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </div>
                  </th>
                ))}
                {actionRenderer && <th className="p-2 text-right w-24">ACTIONS</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-mono text-xs">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 2} className="p-8 text-center text-xs font-bold text-neutral-500 uppercase font-sans">
                    Loading Worksheet Grid Data...
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="p-8 text-center text-xs font-bold text-neutral-400 uppercase font-sans">
                    No Rows Matching Filter
                  </td>
                </tr>
              ) : (
                sortedData.map((row, idx) => {
                  const rowId = String(row[idKey]);
                  const isSelected = selectedIds.includes(rowId);

                  return (
                    <tr
                      key={rowId}
                      className={`transition ${
                        isSelected
                          ? 'bg-red-50/80'
                          : idx % 2 === 0
                          ? 'bg-white hover:bg-neutral-100/80'
                          : 'bg-neutral-50 hover:bg-neutral-100/80'
                      }`}
                    >
                      {/* Checkbox with Touch Container */}
                      <td className="p-0 border-r border-neutral-200 text-center">
                        <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(rowId)}
                            className="w-5 h-5 accent-[#ff3b30] cursor-pointer"
                          />
                        </div>
                      </td>

                      {/* Data Columns */}
                      {columns.map((col) => {
                        const isEditing = editingCell?.id === rowId && editingCell?.key === col.key;
                        const cellValue = row[col.key];

                        return (
                          <td
                            key={col.key}
                            onDoubleClick={() => col.editable && startInlineEdit(rowId, col.key, cellValue)}
                            className={`p-2.5 border-r border-neutral-200 whitespace-nowrap group ${
                              col.editable ? 'cursor-pointer hover:bg-yellow-50/80 font-bold' : ''
                            } ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
                          >
                            {isEditing ? (
                              <input
                                type="text"
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => saveInlineEdit(rowId, col.key)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveInlineEdit(rowId, col.key);
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="w-full bg-yellow-100 border border-yellow-400 p-1 text-base md:text-xs font-mono rounded focus:outline-none min-h-[44px]"
                              />
                            ) : (
                              <div className="flex items-center justify-between gap-1">
                                <span>{col.render ? col.render(row) : String(cellValue ?? '—')}</span>
                                {col.editable && (
                                  <span className="opacity-60 group-hover:opacity-100 text-[9px] text-neutral-400 transition" title="Tap or double-click to edit">
                                    ✏️
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Actions */}
                      {actionRenderer && (
                        <td className="p-2.5 text-right border-l border-neutral-200 whitespace-nowrap">
                          {actionRenderer(row)}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Bar */}
        <div className="bg-neutral-100 border-t border-neutral-300 p-3 text-xs font-bold text-neutral-600 flex justify-between items-center font-sans">
          <span>Rows: {sortedData.length} of {data.length} Total</span>
          <span className="text-[10px] uppercase font-mono text-neutral-400">● LIVE FIRESTORE SYNCHRONIZATION</span>
        </div>
      </div>
    </div>
  );
}
