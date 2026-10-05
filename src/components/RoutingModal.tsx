import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, AlertTriangle, CheckCircle, Bell } from 'lucide-react';
import { RoutingItem } from '../types/routing';
import { calculateItemSums, formatNumber } from '../utils/calculations';

interface RoutingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: RoutingItem, sendLineAlert: boolean) => void;
  editingItem: RoutingItem | null;
  totalItems: number;
}

export const RoutingModal: React.FC<RoutingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  totalItems,
}) => {
  const [formData, setFormData] = useState<Partial<RoutingItem>>({
    no: totalItems + 1,
    plant: '9771',
    model: '',
    note: '',
    std: { mcTime: 0, laborTime: 0, total: 0 },
    fg: { mcTime: 0, laborTime: 0, cycleTime: 0 },
    cab: {
      r: { mcTime: 0, laborTime: 0, cycleTime: 0 },
      f: { mcTime: 0, laborTime: 0, cycleTime: 0 },
    },
    door: {
      veg: { mcTime: 0, laborTime: 0, cycleTime: 0 },
      fb: { mcTime: 0, laborTime: 0, cycleTime: 0 },
      fl: { mcTime: 0, laborTime: 0, cycleTime: 0 },
      fr: { mcTime: 0, laborTime: 0, cycleTime: 0 },
      rl: { mcTime: 0, laborTime: 0, cycleTime: 0 },
      rrIn: { mcTime: 0, laborTime: 0, cycleTime: 0 },
      rrOut: { mcTime: 0, laborTime: 0, cycleTime: 0 },
      rrDnd: { mcTime: 0, laborTime: 0, cycleTime: 0 },
    },
    sum: { laborTime: 0, mcTime: 0, total: 0 },
  });

  const [sendLineAlert, setSendLineAlert] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'std' | 'fg' | 'cab' | 'door'>('std');

  useEffect(() => {
    if (editingItem) {
      setFormData(JSON.parse(JSON.stringify(editingItem)));
    } else {
      setFormData({
        no: totalItems + 1,
        plant: '9771',
        model: '',
        note: '',
        std: { mcTime: 0, laborTime: 0, total: 0 },
        fg: { mcTime: 0, laborTime: 0, cycleTime: 0 },
        cab: {
          r: { mcTime: 0, laborTime: 0, cycleTime: 0 },
          f: { mcTime: 0, laborTime: 0, cycleTime: 0 },
        },
        door: {
          veg: { mcTime: 0, laborTime: 0, cycleTime: 0 },
          fb: { mcTime: 0, laborTime: 0, cycleTime: 0 },
          fl: { mcTime: 0, laborTime: 0, cycleTime: 0 },
          fr: { mcTime: 0, laborTime: 0, cycleTime: 0 },
          rl: { mcTime: 0, laborTime: 0, cycleTime: 0 },
          rrIn: { mcTime: 0, laborTime: 0, cycleTime: 0 },
          rrOut: { mcTime: 0, laborTime: 0, cycleTime: 0 },
          rrDnd: { mcTime: 0, laborTime: 0, cycleTime: 0 },
        },
        sum: { laborTime: 0, mcTime: 0, total: 0 },
      });
    }
  }, [editingItem, totalItems, isOpen]);

  if (!isOpen) return null;

  // Live recalculated sums
  const currentSums = calculateItemSums(formData);
  const stdTotal = (formData.std?.mcTime || 0) + (formData.std?.laborTime || 0);
  const diffTotal = currentSums.total - stdTotal;
  const isBalanced = Math.abs(diffTotal) <= 1.0;

  const updateNumericField = (path: string[], value: string) => {
    const num = parseFloat(value) || 0;
    const clone = { ...formData } as any;

    let target = clone;
    for (let i = 0; i < path.length - 1; i++) {
      if (!target[path[i]]) target[path[i]] = {};
      target = target[path[i]];
    }
    target[path[path.length - 1]] = num;

    // Auto-update cycleTime if editing mcTime
    if (path[path.length - 1] === 'mcTime' && target.cycleTime !== undefined) {
      target.cycleTime = num;
    }

    // Auto-update std total
    if (path[0] === 'std') {
      const mc = path[1] === 'mcTime' ? num : clone.std?.mcTime || 0;
      const labor = path[1] === 'laborTime' ? num : clone.std?.laborTime || 0;
      clone.std.total = mc + labor;
    }

    // Recalculate sums
    const newSums = calculateItemSums(clone);
    clone.sum = newSums;

    setFormData(clone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.model || formData.model.trim() === '') {
      alert('กรุณากรอกชื่อ Model');
      return;
    }

    const itemToSave: RoutingItem = {
      id: editingItem?.id || `route-${Date.now()}`,
      no: Number(formData.no) || 1,
      plant: formData.plant || '9771',
      model: formData.model.trim(),
      note: formData.note || '',
      std: {
        mcTime: Number(formData.std?.mcTime) || 0,
        laborTime: Number(formData.std?.laborTime) || 0,
        total: (Number(formData.std?.mcTime) || 0) + (Number(formData.std?.laborTime) || 0),
      },
      fg: {
        mcTime: Number(formData.fg?.mcTime) || 0,
        laborTime: Number(formData.fg?.laborTime) || 0,
        cycleTime: Number(formData.fg?.cycleTime) || Number(formData.fg?.mcTime) || 0,
      },
      cab: {
        r: {
          mcTime: Number(formData.cab?.r?.mcTime) || 0,
          laborTime: Number(formData.cab?.r?.laborTime) || 0,
          cycleTime: Number(formData.cab?.r?.cycleTime) || Number(formData.cab?.r?.mcTime) || 0,
        },
        f: {
          mcTime: Number(formData.cab?.f?.mcTime) || 0,
          laborTime: Number(formData.cab?.f?.laborTime) || 0,
          cycleTime: Number(formData.cab?.f?.cycleTime) || Number(formData.cab?.f?.mcTime) || 0,
        },
      },
      door: {
        veg: {
          mcTime: Number(formData.door?.veg?.mcTime) || 0,
          laborTime: Number(formData.door?.veg?.laborTime) || 0,
          cycleTime: Number(formData.door?.veg?.cycleTime) || Number(formData.door?.veg?.mcTime) || 0,
        },
        fb: {
          mcTime: Number(formData.door?.fb?.mcTime) || 0,
          laborTime: Number(formData.door?.fb?.laborTime) || 0,
          cycleTime: Number(formData.door?.fb?.cycleTime) || Number(formData.door?.fb?.mcTime) || 0,
        },
        fl: {
          mcTime: Number(formData.door?.fl?.mcTime) || 0,
          laborTime: Number(formData.door?.fl?.laborTime) || 0,
          cycleTime: Number(formData.door?.fl?.cycleTime) || Number(formData.door?.fl?.mcTime) || 0,
        },
        fr: {
          mcTime: Number(formData.door?.fr?.mcTime) || 0,
          laborTime: Number(formData.door?.fr?.laborTime) || 0,
          cycleTime: Number(formData.door?.fr?.cycleTime) || Number(formData.door?.fr?.mcTime) || 0,
        },
        rl: {
          mcTime: Number(formData.door?.rl?.mcTime) || 0,
          laborTime: Number(formData.door?.rl?.laborTime) || 0,
          cycleTime: Number(formData.door?.rl?.cycleTime) || Number(formData.door?.rl?.mcTime) || 0,
        },
        rrIn: {
          mcTime: Number(formData.door?.rrIn?.mcTime) || 0,
          laborTime: Number(formData.door?.rrIn?.laborTime) || 0,
          cycleTime: Number(formData.door?.rrIn?.cycleTime) || Number(formData.door?.rrIn?.mcTime) || 0,
        },
        rrOut: {
          mcTime: Number(formData.door?.rrOut?.mcTime) || 0,
          laborTime: Number(formData.door?.rrOut?.laborTime) || 0,
          cycleTime: Number(formData.door?.rrOut?.cycleTime) || Number(formData.door?.rrOut?.mcTime) || 0,
        },
        rrDnd: {
          mcTime: Number(formData.door?.rrDnd?.mcTime) || 0,
          laborTime: Number(formData.door?.rrDnd?.laborTime) || 0,
          cycleTime: Number(formData.door?.rrDnd?.cycleTime) || Number(formData.door?.rrDnd?.mcTime) || 0,
        },
      },
      sum: currentSums,
      updatedAt: new Date().toISOString(),
    };

    onSave(itemToSave, sendLineAlert);
    onClose();
  };

  const renderInput = (
    label: string,
    path: string[],
    currentVal: number | undefined,
    colorTheme = 'emerald'
  ) => {
    return (
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-slate-300 block">{label}</label>
        <div className="relative">
          <input
            type="number"
            step="any"
            value={currentVal === 0 ? '' : currentVal}
            placeholder="0"
            onChange={(e) => updateNumericField(path, e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs font-mono-num text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
            sec
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-emerald-400" />
              {editingItem ? `แก้ไขข้อมูล Routing: ${editingItem.model}` : 'เพิ่มข้อมูล Routing โมเดลใหม่'}
            </h2>
            <p className="text-xs text-slate-400">
              กำหนดเวลามาตรฐาน (STD) และเวลาแยกตามสายการผลิตจริง (By Line)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">NO. (ลำดับ)</label>
              <input
                type="number"
                value={formData.no}
                onChange={(e) => setFormData({ ...formData, no: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs font-mono-num text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Plant (โรงงาน)</label>
              <input
                type="text"
                value={formData.plant}
                onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs font-mono-num text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-300 block mb-1">Model Name (ชื่อโมเดล)</label>
              <input
                type="text"
                required
                placeholder="เช่น 1D, BM, SBS550, TM595..."
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('std')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'std' ? 'bg-rose-950 text-rose-200 border border-rose-800/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1. STD (เวลามาตรฐาน)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fg')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'fg' ? 'bg-emerald-950 text-emerald-200 border border-emerald-800/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2. FG Assembly
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cab')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'cab' ? 'bg-teal-950 text-teal-200 border border-teal-800/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3. CAB Line (R & F)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('door')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'door' ? 'bg-emerald-950 text-emerald-200 border border-emerald-800/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              4. DOOR Line (ทุกสถานี)
            </button>
          </div>

          {/* Tab 1: STD Form */}
          {activeTab === 'std' && (
            <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
              <h3 className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
                Standard Time (STD) Reference
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {renderInput('STD Machine Time (MC time)', ['std', 'mcTime'], formData.std?.mcTime)}
                {renderInput('STD Labor Time (Labor time)', ['std', 'laborTime'], formData.std?.laborTime)}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300 block">STD Total (คำนวณอัตโนมัติ)</label>
                  <div className="px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-md text-xs font-mono-num font-bold text-amber-300">
                    {formatNumber(stdTotal)} s
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: FG Form */}
          {activeTab === 'fg' && (
            <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
              <h3 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                Finished Goods Assembly Line (FG)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {renderInput('FG Machine Time', ['fg', 'mcTime'], formData.fg?.mcTime)}
                {renderInput('FG Labor Time', ['fg', 'laborTime'], formData.fg?.laborTime)}
                {renderInput('FG Cycle / MC Time 2', ['fg', 'cycleTime'], formData.fg?.cycleTime)}
              </div>
            </div>
          )}

          {/* Tab 3: CAB Form */}
          {activeTab === 'cab' && (
            <div className="space-y-6">
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
                  CAB Rear (R)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {renderInput('CAB R - Machine Time', ['cab', 'r', 'mcTime'], formData.cab?.r?.mcTime)}
                  {renderInput('CAB R - Labor Time', ['cab', 'r', 'laborTime'], formData.cab?.r?.laborTime)}
                  {renderInput('CAB R - Cycle Time', ['cab', 'r', 'cycleTime'], formData.cab?.r?.cycleTime)}
                </div>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
                  CAB Front (F)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {renderInput('CAB F - Machine Time', ['cab', 'f', 'mcTime'], formData.cab?.f?.mcTime)}
                  {renderInput('CAB F - Labor Time', ['cab', 'f', 'laborTime'], formData.cab?.f?.laborTime)}
                  {renderInput('CAB F - Cycle Time', ['cab', 'f', 'cycleTime'], formData.cab?.f?.cycleTime)}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: DOOR Form */}
          {activeTab === 'door' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* VEG */}
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-medium text-emerald-300">DOOR VEG (Vegetable Box)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {renderInput('MC Time', ['door', 'veg', 'mcTime'], formData.door?.veg?.mcTime)}
                    {renderInput('Labor Time', ['door', 'veg', 'laborTime'], formData.door?.veg?.laborTime)}
                  </div>
                </div>

                {/* FB */}
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-medium text-emerald-300">DOOR FB (Freezer Box)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {renderInput('MC Time', ['door', 'fb', 'mcTime'], formData.door?.fb?.mcTime)}
                    {renderInput('Labor Time', ['door', 'fb', 'laborTime'], formData.door?.fb?.laborTime)}
                  </div>
                </div>

                {/* FL */}
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-medium text-emerald-300">DOOR FL (Front Left)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {renderInput('MC Time', ['door', 'fl', 'mcTime'], formData.door?.fl?.mcTime)}
                    {renderInput('Labor Time', ['door', 'fl', 'laborTime'], formData.door?.fl?.laborTime)}
                  </div>
                </div>

                {/* FR */}
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-medium text-emerald-300">DOOR FR (Front Right)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {renderInput('MC Time', ['door', 'fr', 'mcTime'], formData.door?.fr?.mcTime)}
                    {renderInput('Labor Time', ['door', 'fr', 'laborTime'], formData.door?.fr?.laborTime)}
                  </div>
                </div>

                {/* RL */}
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-medium text-emerald-300">DOOR RL (Rear Left)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {renderInput('MC Time', ['door', 'rl', 'mcTime'], formData.door?.rl?.mcTime)}
                    {renderInput('Labor Time', ['door', 'rl', 'laborTime'], formData.door?.rl?.laborTime)}
                  </div>
                </div>

                {/* RR In */}
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-medium text-emerald-300">DOOR RR In (Rear Right Inside)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {renderInput('MC Time', ['door', 'rrIn', 'mcTime'], formData.door?.rrIn?.mcTime)}
                    {renderInput('Labor Time', ['door', 'rrIn', 'laborTime'], formData.door?.rrIn?.laborTime)}
                  </div>
                </div>

                {/* RR Out */}
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-medium text-emerald-300">DOOR RR Out (Rear Right Outside)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {renderInput('MC Time', ['door', 'rrOut', 'mcTime'], formData.door?.rrOut?.mcTime)}
                    {renderInput('Labor Time', ['door', 'rrOut', 'laborTime'], formData.door?.rrOut?.laborTime)}
                  </div>
                </div>

                {/* RR DND */}
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-medium text-emerald-300">DOOR RR DND (Do Not Disturb)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {renderInput('MC Time', ['door', 'rrDnd', 'mcTime'], formData.door?.rrDnd?.mcTime)}
                    {renderInput('Labor Time', ['door', 'rrDnd', 'laborTime'], formData.door?.rrDnd?.laborTime)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live Mathematical Summary Panel */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                สรุปผลรวมคำนวณ (Live Calculation)
              </span>
              <div className="flex items-center gap-1.5 text-xs">
                {isBalanced ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Line Balanced (ผลรวม By Line ตรงกับ STD)
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    มีผลต่าง {diffTotal > 0 ? `+${diffTotal.toFixed(2)}` : diffTotal.toFixed(2)}s จาก STD
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono-num text-center">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">SUM Labor Time</span>
                <span className="text-sm font-bold text-emerald-400">
                  {formatNumber(currentSums.laborTime)} s
                </span>
                <span className="text-[10px] text-slate-500 block">
                  STD: {formatNumber(formData.std?.laborTime)} s
                </span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">SUM MC Time</span>
                <span className="text-sm font-bold text-emerald-400">
                  {formatNumber(currentSums.mcTime)} s
                </span>
                <span className="text-[10px] text-slate-500 block">
                  STD: {formatNumber(formData.std?.mcTime)} s
                </span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">SUM Total</span>
                <span className="text-sm font-bold text-amber-300">
                  {formatNumber(currentSums.total)} s
                </span>
                <span className="text-[10px] text-slate-500 block">
                  STD Total: {formatNumber(stdTotal)} s
                </span>
              </div>
            </div>
          </div>

          {/* Option: Send LINE Alert */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Bell className="h-4 w-4 text-[#06C755]" />
              <span>ส่งข้อความแจ้งเตือนเข้ากลุ่ม LINE ทันทีที่บันทึกข้อมูลโมเดลนี้</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sendLineAlert}
                onChange={(e) => setSendLineAlert(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#06C755]"></div>
            </label>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            ยกเลิก (Cancel)
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            บันทึกข้อมูล (Save Routing)
          </button>
        </div>
      </div>
    </div>
  );
};
