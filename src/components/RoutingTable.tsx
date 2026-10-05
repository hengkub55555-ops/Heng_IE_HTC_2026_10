import React, { useState } from 'react';
import {
  Search,
  Edit2,
  Trash2,
  Copy,
  HelpCircle,
  ArrowUpDown,
  Save,
  Edit3,
  Check,
  RefreshCw,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { RoutingItem, FilterOptions } from '../types/routing';
import { formatNumber, getVariance } from '../utils/calculations';

interface RoutingTableProps {
  items: RoutingItem[];
  onEditItem: (item: RoutingItem) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (item: RoutingItem) => void;
  onQuickUpdateCell: (
    itemId: string,
    fieldPath: string,
    value: number | string,
    autoSyncStd?: boolean,
    autoSyncCycleMc?: boolean
  ) => void;
  onSyncRowStdWithSum: (itemId: string) => void;
  onSelectModelForDetail: (item: RoutingItem) => void;
  onSaveAll: () => void;
  onAddNew: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  isSpreadsheetEditMode: boolean;
  setIsSpreadsheetEditMode: (val: boolean) => void;
}

const STATIONS = [
  { key: 'fg', label: 'FG', group: 'FG' },
  { key: 'cab.r', label: 'R', group: 'CAB' },
  { key: 'cab.f', label: 'F', group: 'CAB' },
  { key: 'door.veg', label: 'VEG', group: 'DOOR' },
  { key: 'door.fb', label: 'FB', group: 'DOOR' },
  { key: 'door.fl', label: 'FL', group: 'DOOR' },
  { key: 'door.fr', label: 'FR', group: 'DOOR' },
  { key: 'door.rl', label: 'RL', group: 'DOOR' },
  { key: 'door.rrIn', label: 'RR', group: 'DOOR' },
  { key: 'door.rrOut', label: 'In (RR DND)', group: 'DOOR' },
  { key: 'door.rrDnd', label: 'Out (RR DND)', group: 'DOOR' },
];

export const RoutingTable: React.FC<RoutingTableProps> = ({
  items,
  onEditItem,
  onDeleteItem,
  onDuplicateItem,
  onQuickUpdateCell,
  onSyncRowStdWithSum,
  onSelectModelForDetail,
  onSaveAll,
  onAddNew,
  isSaving,
  hasUnsavedChanges,
  isSpreadsheetEditMode,
  setIsSpreadsheetEditMode,
}) => {
  const [filter, setFilter] = useState<FilterOptions>({
    search: '',
    plant: 'ALL',
    balanceStatus: 'ALL',
    sortBy: 'no',
    sortOrder: 'asc',
  });

  const [decimalPlaces, setDecimalPlaces] = useState<number>(3);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [autoSyncStd, setAutoSyncStd] = useState<boolean>(true);
  const [autoSyncCycleMc, setAutoSyncCycleMc] = useState<boolean>(true);
  const [recentlyEditedRowId, setRecentlyEditedRowId] = useState<string | null>(null);

  // Filtering & Sorting
  const filteredItems = items
    .filter((item) => {
      const matchSearch =
        item.model.toLowerCase().includes(filter.search.toLowerCase()) ||
        item.plant.includes(filter.search) ||
        (item.note && item.note.toLowerCase().includes(filter.search.toLowerCase()));

      const matchPlant = filter.plant === 'ALL' || item.plant === filter.plant;

      const v = getVariance(item);
      const matchBalance =
        filter.balanceStatus === 'ALL'
          ? true
          : filter.balanceStatus === 'BALANCED'
          ? v.isBalanced
          : !v.isBalanced;

      return matchSearch && matchPlant && matchBalance;
    })
    .sort((a, b) => {
      let valA: any = a.no;
      let valB: any = b.no;

      if (filter.sortBy === 'model') {
        valA = a.model.toLowerCase();
        valB = b.model.toLowerCase();
      } else if (filter.sortBy === 'stdTotal') {
        valA = a.std.total;
        valB = b.std.total;
      } else if (filter.sortBy === 'sumTotal') {
        valA = a.sum.total;
        valB = b.sum.total;
      } else if (filter.sortBy === 'laborTime') {
        valA = a.sum.laborTime;
        valB = b.sum.laborTime;
      } else if (filter.sortBy === 'mcTime') {
        valA = a.sum.mcTime;
        valB = b.sum.mcTime;
      }

      if (valA < valB) return filter.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return filter.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const plants = Array.from(new Set(items.map((i) => i.plant)));

  const handleCellClick = (id: string, field: string, currentValue: number | string) => {
    setEditingCell({ id, field });
    setTempValue(String(currentValue));
  };

  const commitCellChange = (id: string, field: string, rawVal: string, isText = false) => {
    if (isText) {
      onQuickUpdateCell(id, field, rawVal.trim() || '-', autoSyncStd, autoSyncCycleMc);
    } else {
      const parsed = rawVal.trim() === '' ? 0 : parseFloat(rawVal);
      if (!isNaN(parsed)) {
        onQuickUpdateCell(id, field, parsed, autoSyncStd, autoSyncCycleMc);
      }
    }
    setRecentlyEditedRowId(id);
    setEditingCell(null);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    id: string,
    field: string,
    isText = false
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitCellChange(id, field, tempValue, isText);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Bottom column sums
  const totalStdMc = filteredItems.reduce((acc, i) => acc + i.std.mcTime, 0);
  const totalStdLabor = filteredItems.reduce((acc, i) => acc + i.std.laborTime, 0);
  const totalStdTotal = filteredItems.reduce((acc, i) => acc + i.std.total, 0);
  const totalSumLabor = filteredItems.reduce((acc, i) => acc + i.sum.laborTime, 0);
  const totalSumMc = filteredItems.reduce((acc, i) => acc + i.sum.mcTime, 0);
  const totalSumTotal = filteredItems.reduce((acc, i) => acc + i.sum.total, 0);

  return (
    <div className="space-y-4">
      {/* Interactive Editing & Save Action Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsSpreadsheetEditMode(!isSpreadsheetEditMode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border ${
              isSpreadsheetEditMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
            }`}
          >
            <Edit3 className="h-4 w-4" />
            {isSpreadsheetEditMode
              ? 'โหมดแก้ไขทุกช่องพร้อมกัน: เปิดอยู่ (คลิกเพื่อสลับ)'
              : 'เปิดโหมดแก้ไขตัวเลขทุกช่องพร้อมกัน (Spreadsheet Mode)'}
          </button>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-950/70 px-3 py-2 rounded-lg border border-slate-800">
            <input
              type="checkbox"
              checked={autoSyncStd}
              onChange={(e) => setAutoSyncStd(e.target.checked)}
              className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
            />
            <span>ปรับค่า STD ตามผลรวม SUM อัตโนมัติเมื่อแก้ตัวเลขในสถานี</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-950/70 px-3 py-2 rounded-lg border border-slate-800">
            <input
              type="checkbox"
              checked={autoSyncCycleMc}
              onChange={(e) => setAutoSyncCycleMc(e.target.checked)}
              className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
            />
            <span>ซิงค์ช่อง MC time (ซ้าย-ขวา) ของสถานีเดียวกันอัตโนมัติ</span>
          </label>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 self-end xl:self-auto">
          <button
            onClick={onAddNew}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            เพิ่มโมเดลใหม่
          </button>

          <button
            onClick={onSaveAll}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
              hasUnsavedChanges
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-400/60'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Save className="h-4 w-4" />
            {isSaving
              ? 'กำลังบันทึกข้อมูล...'
              : hasUnsavedChanges
              ? 'บันทึกการแก้ไขลงเว็บเดี๋ยวนี้ (Save)'
              : 'บันทึกข้อมูลลงเว็บ (Save)'}
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="ค้นหา Model, Plant..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Plant:</span>
            <select
              value={filter.plant}
              onChange={(e) => setFilter({ ...filter, plant: e.target.value })}
              className="py-1.5 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Plants ({items.length})</option>
              {plants.map((p) => (
                <option key={p} value={p}>
                  Plant {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setFilter({ ...filter, balanceStatus: 'ALL' })}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter.balanceStatus === 'ALL'
                  ? 'bg-slate-800 text-slate-100 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ทั้งหมด ({items.length})
            </button>
            <button
              onClick={() => setFilter({ ...filter, balanceStatus: 'BALANCED' })}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter.balanceStatus === 'BALANCED'
                  ? 'bg-emerald-950/80 text-emerald-300 font-medium border border-emerald-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              สมดุล (Balanced)
            </button>
            <button
              onClick={() => setFilter({ ...filter, balanceStatus: 'DISCREPANCY' })}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter.balanceStatus === 'DISCREPANCY'
                  ? 'bg-rose-950/80 text-rose-300 font-medium border border-rose-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              มีผลต่าง (Discrepancy)
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>เรียงตาม:</span>
            <select
              value={filter.sortBy}
              onChange={(e) => setFilter({ ...filter, sortBy: e.target.value as any })}
              className="py-1.5 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="no">NO. (ลำดับ)</option>
              <option value="model">Model Name</option>
              <option value="sumTotal">SUM Total Time</option>
              <option value="stdTotal">STD Total Time</option>
              <option value="laborTime">Total Labor Time</option>
              <option value="mcTime">Total MC Time</option>
            </select>
            <button
              onClick={() =>
                setFilter({
                  ...filter,
                  sortOrder: filter.sortOrder === 'asc' ? 'desc' : 'asc',
                })
              }
              title="สลับ เรียงจากน้อยไปมาก / มากไปน้อย"
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span>ทศนิยม:</span>
            <select
              value={decimalPlaces}
              onChange={(e) => setDecimalPlaces(Number(e.target.value))}
              className="py-1.5 px-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
            >
              <option value={0}>0 ตำแหน่ง</option>
              <option value={1}>1 ตำแหน่ง</option>
              <option value={2}>2 ตำแหน่ง</option>
              <option value={3}>3 ตำแหน่ง</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Excel-like Table with Sticky Header & Direct Single-Click Editing */}
      <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-2xl">
        <div className="overflow-x-auto max-h-[700px] relative scrollbar-thin">
          <table className="w-full text-xs text-left border-collapse">
            {/* Header Row 1: Primary Section Groupings matching Data 001.jpg */}
            <thead className="sticky top-0 z-20 text-[11px] font-semibold uppercase tracking-wider text-slate-100">
              <tr>
                <th
                  rowSpan={3}
                  className="bg-[#0070c0] border-r border-b border-slate-800 px-2 py-2 text-center text-white sticky left-0 z-30 min-w-[52px]"
                >
                  NO.
                </th>
                <th
                  rowSpan={3}
                  className="bg-[#0070c0] border-r border-b border-slate-800 px-2 py-2 text-center text-white sticky left-[52px] z-30 min-w-[64px]"
                >
                  Plant
                </th>
                <th
                  rowSpan={3}
                  className="bg-[#0070c0] border-r border-b border-slate-800 px-3 py-2 text-center text-white sticky left-[116px] z-30 min-w-[155px]"
                >
                  Model
                </th>

                {/* STD (Red) */}
                <th
                  colSpan={3}
                  rowSpan={2}
                  className="bg-[#ff0000] border-r border-b border-red-950 px-3 py-2 text-center text-white font-bold"
                >
                  STD
                </th>

                {/* FG (Green) */}
                <th
                  colSpan={3}
                  rowSpan={2}
                  className="bg-[#548235] border-r border-b border-emerald-950 px-3 py-2 text-center text-white font-bold"
                >
                  FG
                </th>

                {/* CAB (Green) */}
                <th
                  colSpan={6}
                  className="bg-[#548235] border-r border-b border-emerald-950 px-3 py-1.5 text-center text-white font-bold"
                >
                  CAB
                </th>

                {/* DOOR (Green) */}
                <th
                  colSpan={24}
                  className="bg-[#548235] border-r border-b border-emerald-950 px-3 py-1.5 text-center text-white font-bold"
                >
                  DOOR
                </th>

                {/* SUM (Red like Data 001.jpg) */}
                <th
                  colSpan={3}
                  rowSpan={2}
                  className="bg-[#ff0000] border-r border-b border-red-950 px-3 py-2 text-center text-white font-bold"
                >
                  SUM
                </th>

                {/* Total (Yellow like Data 001.jpg) */}
                <th
                  rowSpan={3}
                  className="bg-[#ffff00] border-r border-b border-amber-700 px-3 py-2 text-center text-slate-950 font-extrabold min-w-[85px]"
                >
                  Total
                </th>

                {/* Actions */}
                <th
                  rowSpan={3}
                  className="bg-slate-900 border-b border-slate-800 px-3 py-2 text-center text-slate-200 min-w-[115px]"
                >
                  จัดการ / บันทึก
                </th>
              </tr>

              {/* Header Row 2: Sub-station Names */}
              <tr className="bg-[#70ad47] text-slate-950 font-bold text-[11px]">
                <th colSpan={3} className="border-r border-b border-emerald-900 py-1 text-center">
                  R
                </th>
                <th colSpan={3} className="border-r border-b border-emerald-900 py-1 text-center">
                  F
                </th>
                <th colSpan={3} className="border-r border-b border-emerald-900 py-1 text-center">
                  VEG
                </th>
                <th colSpan={3} className="border-r border-b border-emerald-900 py-1 text-center">
                  FB
                </th>
                <th colSpan={3} className="border-r border-b border-emerald-900 py-1 text-center">
                  FL
                </th>
                <th colSpan={3} className="border-r border-b border-emerald-900 py-1 text-center">
                  FR
                </th>
                <th colSpan={3} className="border-r border-b border-emerald-900 py-1 text-center">
                  RL
                </th>
                <th colSpan={3} className="border-r border-b border-emerald-900 py-1 text-center">
                  RR
                </th>
                <th colSpan={3} className="border-r border-b border-emerald-900 py-1 text-center">
                  RR DND (In)
                </th>
                <th colSpan={3} className="border-r border-b border-emerald-900 py-1 text-center">
                  RR DND (Out)
                </th>
              </tr>

              {/* Header Row 3: Exact Column Labels (MC time / Labor time / Total) */}
              <tr className="bg-slate-800 text-slate-200 text-[10px]">
                {/* STD */}
                <th className="bg-slate-800 border-r border-b border-slate-700 px-2 py-1 text-right min-w-[74px]">
                  MC time
                </th>
                <th className="bg-slate-800 border-r border-b border-slate-700 px-2 py-1 text-right min-w-[78px]">
                  Labor time
                </th>
                <th className="bg-slate-800 border-r border-b border-slate-700 px-2 py-1 text-right min-w-[74px] text-amber-300">
                  Total
                </th>

                {/* 11 Stations x 3 columns */}
                {STATIONS.map((st) => (
                  <React.Fragment key={st.key}>
                    <th className="bg-slate-800 border-r border-b border-slate-700 px-2 py-1 text-right min-w-[74px]">
                      MC time
                    </th>
                    <th className="bg-slate-800 border-r border-b border-slate-700 px-2 py-1 text-right min-w-[78px]">
                      Labor time
                    </th>
                    <th className="bg-slate-800 border-r border-b border-slate-700 px-2 py-1 text-right min-w-[74px]">
                      MC time
                    </th>
                  </React.Fragment>
                ))}

                {/* SUM (MC time | Labor time | MC time) */}
                <th className="bg-slate-800 border-r border-b border-slate-700 px-2 py-1 text-right min-w-[74px]">
                  MC time
                </th>
                <th className="bg-slate-800 border-r border-b border-slate-700 px-2 py-1 text-right min-w-[78px]">
                  Labor time
                </th>
                <th className="bg-slate-800 border-r border-b border-slate-700 px-2 py-1 text-right min-w-[74px]">
                  MC time
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/70 font-mono-num text-[11.5px]">
              {filteredItems.map((item, idx) => {
                const variance = getVariance(item);
                const isRowRecentlyEdited = recentlyEditedRowId === item.id;

                // Helper to render single-click or spreadsheet-mode editable numeric cell
                const renderEditableNumberCell = (
                  fieldPath: string,
                  val: number,
                  extraClasses = ''
                ) => {
                  const isEditingThis =
                    editingCell?.id === item.id && editingCell?.field === fieldPath;

                  if (isSpreadsheetEditMode) {
                    return (
                      <td className={`p-0.5 border-r border-slate-800/80 ${extraClasses}`}>
                        <input
                          type="number"
                          step="any"
                          value={val === 0 ? 0 : val}
                          onChange={(e) => {
                            const num =
                              e.target.value === '' ? 0 : parseFloat(e.target.value);
                            if (!isNaN(num)) {
                              onQuickUpdateCell(
                                item.id,
                                fieldPath,
                                num,
                                autoSyncStd,
                                autoSyncCycleMc
                              );
                              setRecentlyEditedRowId(item.id);
                            }
                          }}
                          className="w-full py-1 px-1.5 bg-slate-900 hover:bg-slate-800 focus:bg-emerald-950 text-slate-100 text-right rounded border border-slate-700 focus:border-emerald-400 focus:outline-none text-[11.5px] font-mono-num"
                        />
                      </td>
                    );
                  }

                  if (isEditingThis) {
                    return (
                      <td className={`p-0 border-r border-slate-800 bg-emerald-950 ${extraClasses}`}>
                        <input
                          autoFocus
                          onFocus={(e) => e.target.select()}
                          type="number"
                          step="any"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          onBlur={() => commitCellChange(item.id, fieldPath, tempValue)}
                          onKeyDown={(e) => handleKeyDown(e, item.id, fieldPath)}
                          className="w-full h-full py-1.5 px-2 bg-emerald-950 text-white text-right border-2 border-emerald-400 focus:outline-none font-mono-num"
                        />
                      </td>
                    );
                  }

                  const isZero = val === 0;

                  return (
                    <td
                      onClick={() => handleCellClick(item.id, fieldPath, val)}
                      title="คลิกเพื่อพิมพ์แก้ไขตัวเลข"
                      className={`px-2 py-2 text-right border-r border-slate-800/60 transition-colors cursor-text hover:bg-emerald-500/15 hover:ring-1 hover:ring-inset hover:ring-emerald-500/50 ${
                        isZero ? 'text-slate-500' : 'text-slate-100'
                      } ${extraClasses}`}
                    >
                      {formatNumber(val, decimalPlaces)}
                    </td>
                  );
                };

                // Helper to render editable text/meta cell (NO, Plant, Model)
                const renderEditableTextCell = (
                  fieldPath: string,
                  val: string | number,
                  stickyClasses: string,
                  isNumber = false
                ) => {
                  const isEditingThis =
                    editingCell?.id === item.id && editingCell?.field === fieldPath;

                  if (isEditingThis) {
                    return (
                      <td className={`p-0 border-r border-slate-800 ${stickyClasses}`}>
                        <input
                          autoFocus
                          onFocus={(e) => e.target.select()}
                          type={isNumber ? 'number' : 'text'}
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          onBlur={() =>
                            commitCellChange(item.id, fieldPath, tempValue, !isNumber)
                          }
                          onKeyDown={(e) =>
                            handleKeyDown(e, item.id, fieldPath, !isNumber)
                          }
                          className="w-full h-full py-1.5 px-2 bg-blue-950 text-white border-2 border-blue-400 focus:outline-none"
                        />
                      </td>
                    );
                  }

                  return (
                    <td
                      onClick={() => handleCellClick(item.id, fieldPath, val)}
                      title="คลิกเพื่อแก้ไข"
                      className={`px-2 py-2 border-r border-slate-800 cursor-text hover:bg-blue-900/30 ${stickyClasses}`}
                    >
                      {val}
                    </td>
                  );
                };

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-900/70 transition-colors group ${
                      isRowRecentlyEdited
                        ? 'bg-emerald-950/20'
                        : idx % 2 === 0
                        ? 'bg-slate-950'
                        : 'bg-slate-900/30'
                    }`}
                  >
                    {/* NO (Sticky Left) */}
                    {renderEditableTextCell(
                      'no',
                      item.no,
                      'text-center text-slate-300 sticky left-0 z-10 bg-slate-950 group-hover:bg-slate-900',
                      true
                    )}

                    {/* Plant (Sticky Left) */}
                    {renderEditableTextCell(
                      'plant',
                      item.plant,
                      'text-center text-slate-300 font-medium sticky left-[52px] z-10 bg-slate-950 group-hover:bg-slate-900',
                      false
                    )}

                    {/* Model (Sticky Left) */}
                    <td className="px-2.5 py-2 text-left font-sans font-semibold text-amber-300 border-r border-slate-800 sticky left-[116px] z-10 bg-slate-950 group-hover:bg-slate-900">
                      {editingCell?.id === item.id && editingCell?.field === 'model' ? (
                        <input
                          autoFocus
                          onFocus={(e) => e.target.select()}
                          type="text"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          onBlur={() => commitCellChange(item.id, 'model', tempValue, true)}
                          onKeyDown={(e) => handleKeyDown(e, item.id, 'model', true)}
                          className="w-full py-1 px-1.5 bg-blue-950 text-white rounded border border-blue-400 focus:outline-none text-xs"
                        />
                      ) : (
                        <div className="flex items-center justify-between gap-1">
                          <span
                            onClick={() => handleCellClick(item.id, 'model', item.model)}
                            className="cursor-text hover:underline truncate max-w-[120px]"
                            title="คลิกเพื่อแก้ไขชื่อรุ่น"
                          >
                            {item.model}
                          </span>
                          <div className="flex items-center gap-1">
                            {!variance.isBalanced && (
                              <button
                                onClick={() => onSyncRowStdWithSum(item.id)}
                                title={`ผลต่าง ${variance.diffTotal}s - คลิกเพื่อปรับค่า STD ให้ตรงกับ SUM`}
                                className="text-[10px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/40"
                              >
                                Sync STD
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* STD Section (Editable MC time, Labor time, and auto/editable Total) */}
                    {renderEditableNumberCell(
                      'std.mcTime',
                      item.std.mcTime,
                      'bg-amber-500/10 text-amber-200 font-medium'
                    )}
                    {renderEditableNumberCell(
                      'std.laborTime',
                      item.std.laborTime,
                      'bg-amber-500/10 text-amber-200 font-medium'
                    )}
                    <td className="px-2 py-2 text-right font-bold text-amber-300 bg-amber-500/20 border-r border-slate-800">
                      {formatNumber(item.std.total, decimalPlaces)}
                    </td>

                    {/* FG Section */}
                    {renderEditableNumberCell('fg.mcTime', item.fg.mcTime)}
                    {renderEditableNumberCell('fg.laborTime', item.fg.laborTime)}
                    {renderEditableNumberCell('fg.cycleTime', item.fg.cycleTime)}

                    {/* CAB R */}
                    {renderEditableNumberCell('cab.r.mcTime', item.cab.r.mcTime)}
                    {renderEditableNumberCell('cab.r.laborTime', item.cab.r.laborTime)}
                    {renderEditableNumberCell('cab.r.cycleTime', item.cab.r.cycleTime)}

                    {/* CAB F */}
                    {renderEditableNumberCell('cab.f.mcTime', item.cab.f.mcTime)}
                    {renderEditableNumberCell('cab.f.laborTime', item.cab.f.laborTime)}
                    {renderEditableNumberCell('cab.f.cycleTime', item.cab.f.cycleTime)}

                    {/* DOOR VEG */}
                    {renderEditableNumberCell('door.veg.mcTime', item.door.veg.mcTime)}
                    {renderEditableNumberCell('door.veg.laborTime', item.door.veg.laborTime)}
                    {renderEditableNumberCell('door.veg.cycleTime', item.door.veg.cycleTime)}

                    {/* DOOR FB */}
                    {renderEditableNumberCell('door.fb.mcTime', item.door.fb.mcTime)}
                    {renderEditableNumberCell('door.fb.laborTime', item.door.fb.laborTime)}
                    {renderEditableNumberCell('door.fb.cycleTime', item.door.fb.cycleTime)}

                    {/* DOOR FL */}
                    {renderEditableNumberCell('door.fl.mcTime', item.door.fl.mcTime)}
                    {renderEditableNumberCell('door.fl.laborTime', item.door.fl.laborTime)}
                    {renderEditableNumberCell('door.fl.cycleTime', item.door.fl.cycleTime)}

                    {/* DOOR FR */}
                    {renderEditableNumberCell('door.fr.mcTime', item.door.fr.mcTime)}
                    {renderEditableNumberCell('door.fr.laborTime', item.door.fr.laborTime)}
                    {renderEditableNumberCell('door.fr.cycleTime', item.door.fr.cycleTime)}

                    {/* DOOR RL */}
                    {renderEditableNumberCell('door.rl.mcTime', item.door.rl.mcTime)}
                    {renderEditableNumberCell('door.rl.laborTime', item.door.rl.laborTime)}
                    {renderEditableNumberCell('door.rl.cycleTime', item.door.rl.cycleTime)}

                    {/* DOOR RR In */}
                    {renderEditableNumberCell('door.rrIn.mcTime', item.door.rrIn.mcTime)}
                    {renderEditableNumberCell('door.rrIn.laborTime', item.door.rrIn.laborTime)}
                    {renderEditableNumberCell('door.rrIn.cycleTime', item.door.rrIn.cycleTime)}

                    {/* DOOR RR Out */}
                    {renderEditableNumberCell('door.rrOut.mcTime', item.door.rrOut.mcTime)}
                    {renderEditableNumberCell('door.rrOut.laborTime', item.door.rrOut.laborTime)}
                    {renderEditableNumberCell('door.rrOut.cycleTime', item.door.rrOut.cycleTime)}

                    {/* DOOR RR DND */}
                    {renderEditableNumberCell(
                      'door.rrDnd.mcTime',
                      item.door.rrDnd?.mcTime || 0
                    )}
                    {renderEditableNumberCell(
                      'door.rrDnd.laborTime',
                      item.door.rrDnd?.laborTime || 0
                    )}
                    {renderEditableNumberCell(
                      'door.rrDnd.cycleTime',
                      item.door.rrDnd?.cycleTime || 0
                    )}

                    {/* SUM Section (MC time | Labor time | MC time matching Data 001.jpg) */}
                    <td className="px-2 py-2 text-right font-semibold text-emerald-300 bg-emerald-950/30 border-r border-slate-800">
                      {formatNumber(item.sum.mcTime, decimalPlaces)}
                    </td>
                    <td className="px-2 py-2 text-right font-semibold text-emerald-300 bg-emerald-950/30 border-r border-slate-800">
                      {formatNumber(item.sum.laborTime, decimalPlaces)}
                    </td>
                    <td className="px-2 py-2 text-right font-semibold text-emerald-300 bg-emerald-950/30 border-r border-slate-800">
                      {formatNumber(item.sum.mcTime, decimalPlaces)}
                    </td>

                    {/* SUM Total (Yellow/Amber) */}
                    <td
                      className={`px-2 py-2 text-right font-extrabold border-r border-slate-800 ${
                        variance.isBalanced
                          ? 'text-amber-300 bg-amber-500/20'
                          : 'text-rose-300 bg-rose-950/50'
                      }`}
                    >
                      {formatNumber(item.sum.total, decimalPlaces)}
                    </td>

                    {/* Action buttons */}
                    <td className="px-2 py-1.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={onSaveAll}
                          title="บันทึกข้อมูลลงระบบ"
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-sans font-semibold flex items-center gap-1"
                        >
                          <Save className="h-3 w-3" />
                          บันทึก
                        </button>
                        <button
                          onClick={() => onEditItem(item)}
                          title="เปิดหน้าต่างแก้ไขแบบฟอร์ม"
                          className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDuplicateItem(item)}
                          title="คัดลอกแถวนี้"
                          className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          title="ลบแถวนี้"
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Table Footer: Column Summary */}
            <tfoot className="bg-slate-900 border-t-2 border-slate-700 font-semibold text-slate-200 sticky bottom-0 z-20 font-mono-num text-[11px]">
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-2.5 text-center text-slate-200 uppercase tracking-wider sticky left-0 z-30 bg-slate-900 border-r border-slate-800"
                >
                  รวมทั้งหมด ({filteredItems.length} แถว)
                </td>
                <td className="px-2 py-2.5 text-right text-amber-300 border-r border-slate-800">
                  {formatNumber(totalStdMc, decimalPlaces)}
                </td>
                <td className="px-2 py-2.5 text-right text-amber-300 border-r border-slate-800">
                  {formatNumber(totalStdLabor, decimalPlaces)}
                </td>
                <td className="px-2 py-2.5 text-right text-amber-300 font-bold border-r border-slate-800">
                  {formatNumber(totalStdTotal, decimalPlaces)}
                </td>

                <td
                  colSpan={33}
                  className="px-3 py-2.5 text-center text-slate-400 border-r border-slate-800 font-sans"
                >
                  คลิกตัวเลขช่องใดก็ได้ในตารางเพื่อแก้ไขได้ทันที — ระบบคำนวณ SUM MC Time, Labor Time และ Total อัตโนมัติ
                </td>

                <td className="px-2 py-2.5 text-right text-emerald-300 font-bold border-r border-slate-800">
                  {formatNumber(totalSumMc, decimalPlaces)}
                </td>
                <td className="px-2 py-2.5 text-right text-emerald-300 font-bold border-r border-slate-800">
                  {formatNumber(totalSumLabor, decimalPlaces)}
                </td>
                <td className="px-2 py-2.5 text-right text-emerald-300 font-bold border-r border-slate-800">
                  {formatNumber(totalSumMc, decimalPlaces)}
                </td>
                <td className="px-2 py-2.5 text-right text-amber-300 font-extrabold border-r border-slate-800">
                  {formatNumber(totalSumTotal, decimalPlaces)}
                </td>
                <td className="px-2 py-2 text-center">
                  <button
                    onClick={onSaveAll}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-sans font-semibold"
                  >
                    บันทึกทั้งหมด
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Helper footer */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-emerald-400" />
          <span>
            วิธีแก้ไขตัวเลข: <strong>คลิก 1 ครั้งที่ตัวเลขช่องใดก็ได้</strong> เพื่อพิมพ์ค่าใหม่แล้วกด Enter หรือเปิดปุ่ม{' '}
            <strong>"โหมดแก้ไขตัวเลขทุกช่องพร้อมกัน"</strong> ด้านบนตาราง
          </span>
        </div>
      </div>
    </div>
  );
};
