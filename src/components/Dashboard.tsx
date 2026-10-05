import React, { useState } from 'react';
import {
  TrendingUp,
  Cpu,
  Users,
  Timer,
  AlertOctagon,
  CheckCircle2,
  Gauge,
  Layers,
  BarChart2,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react';
import { RoutingItem } from '../types/routing';
import { computeMetrics, formatNumber, getModelStations, round } from '../utils/calculations';

interface DashboardProps {
  items: RoutingItem[];
  onSelectModel: (item: RoutingItem) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ items, onSelectModel }) => {
  const metrics = computeMetrics(items);

  // Takt Time Simulation state
  const [shiftHours, setShiftHours] = useState<number>(8);
  const [targetUnits, setTargetUnits] = useState<number>(100);
  const [lineEfficiency, setLineEfficiency] = useState<number>(85); // 85%
  const [selectedModelId, setSelectedModelId] = useState<string>(items[0]?.id || '');

  const selectedModel = items.find((i) => i.id === selectedModelId) || items[0];

  // Simulation calculations
  const totalAvailableSec = shiftHours * 3600 * (lineEfficiency / 100);
  const calculatedTaktTimeSec = targetUnits > 0 ? totalAvailableSec / targetUnits : 0;
  const modelCycleTime = selectedModel ? selectedModel.sum.total : 0;
  const theoreticalCapacity = modelCycleTime > 0 ? Math.floor(totalAvailableSec / modelCycleTime) : 0;
  const isBottleneckExceeded = modelCycleTime > calculatedTaktTimeSec;

  // Max value for bar scaling
  const maxModelTime = Math.max(...items.map((i) => i.sum.total), 1);

  // Station bottleneck ranking across all models
  const allStations = [
    { id: 'fg', name: 'FG Main Assembly', color: '#10b981' },
    { id: 'cab_r', name: 'CAB Rear (R)', color: '#06b6d4' },
    { id: 'cab_f', name: 'CAB Front (F)', color: '#0284c7' },
    { id: 'door_veg', name: 'DOOR Vegetable (VEG)', color: '#84cc16' },
    { id: 'door_fb', name: 'DOOR Freezer (FB)', color: '#22c55e' },
    { id: 'door_fl', name: 'DOOR Front Left (FL)', color: '#3b82f6' },
    { id: 'door_fr', name: 'DOOR Front Right (FR)', color: '#6366f1' },
    { id: 'door_rl', name: 'DOOR Rear Left (RL)', color: '#8b5cf6' },
    { id: 'door_rr_in', name: 'DOOR Rear Right In', color: '#ec4899' },
    { id: 'door_rr_out', name: 'DOOR Rear Right Out', color: '#f43f5e' },
  ];

  const stationAverages = allStations.map((st) => {
    let sum = 0;
    let count = 0;
    items.forEach((item) => {
      const stations = getModelStations(item);
      const found = stations.find((s) => s.id === st.id);
      if (found && found.totalTime > 0) {
        sum += found.totalTime;
        count++;
      }
    });
    return {
      ...st,
      avgTime: count > 0 ? sum / count : 0,
      activeCount: count,
    };
  }).sort((a, b) => b.avgTime - a.avgTime);

  const maxStationTime = Math.max(...stationAverages.map((s) => s.avgTime), 1);

  return (
    <div className="space-y-6">
      {/* 1. Executive Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Models */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">โมเดลในสายการผลิต</span>
            <Layers className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-slate-100">
            {metrics.totalModels}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Plant 9771 ครอบคลุม 100%</span>
          </div>
        </div>

        {/* Line Balancing Accuracy */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Line Balance Match</span>
            <Gauge className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-emerald-400">
            {round((metrics.balancedCount / (metrics.totalModels || 1)) * 100, 1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ตรงกับ STD {metrics.balancedCount} จาก {metrics.totalModels} รุ่น
          </div>
        </div>

        {/* Avg Labor Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">เวลาแรงงานเฉลี่ย (Labor)</span>
            <Users className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-amber-300">
            {formatNumber(metrics.avgLaborTime)} s
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            สัดส่วน {round((metrics.avgLaborTime / (metrics.avgSumTotal || 1)) * 100, 1)}% ของ Cycle
          </div>
        </div>

        {/* Avg MC Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">เวลาเครื่องจักรเฉลี่ย (MC)</span>
            <Cpu className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-cyan-300">
            {formatNumber(metrics.avgMcTime)} s
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ระบบจักรอัตโนมัติ {round((metrics.avgMcTime / (metrics.avgSumTotal || 1)) * 100, 1)}%
          </div>
        </div>

        {/* Critical Bottleneck Station */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">สถานีคอขวดหลัก</span>
            <AlertOctagon className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-sm font-bold text-rose-300 truncate" title={metrics.bottleneckStation.name}>
            {metrics.bottleneckStation.name}
          </div>
          <div className="text-[11px] text-rose-400 font-mono-num mt-1">
            เฉลี่ย {formatNumber(metrics.bottleneckStation.avgTime)} s / unit
          </div>
        </div>
      </div>

      {/* 2. Main Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Cycle Time by Model Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-emerald-400" />
                เปรียบเทียบ Cycle Time แยกตามโมเดล (Routing By Line vs STD)
              </h3>
              <p className="text-xs text-slate-400">
                แท่งกราฟแสดงเวลาผลิตรวม (วินาที) พร้อมสัดส่วน Labor Time vs MC Time
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-500"></span>
                <span>Labor Time</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-cyan-600"></span>
                <span>MC Time</span>
              </div>
            </div>
          </div>

          {/* Graphical Stacked Bar Chart */}
          <div className="space-y-3 pt-2">
            {items.map((item) => {
              const laborPct = (item.sum.laborTime / maxModelTime) * 100;
              const mcPct = (item.sum.mcTime / maxModelTime) * 100;
              const isSelected = item.id === selectedModelId;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedModelId(item.id)}
                  className={`group p-2 rounded-lg cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500/80 shadow-md'
                      : 'hover:bg-slate-800/40 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono-num w-5 text-right">{item.no}.</span>
                      <span className="text-slate-100 font-semibold group-hover:text-emerald-300 transition-colors">
                        {item.model}
                      </span>
                      <span className="text-[10px] text-slate-500">Plant {item.plant}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono-num">
                      <span className="text-slate-400 text-[11px]">
                        L: <strong className="text-emerald-400">{formatNumber(item.sum.laborTime, 0)}s</strong>
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        MC: <strong className="text-cyan-400">{formatNumber(item.sum.mcTime, 0)}s</strong>
                      </span>
                      <span className="text-amber-300 font-bold text-xs min-w-[65px] text-right">
                        {formatNumber(item.sum.total, 0)} s
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar Graphic */}
                  <div className="h-3.5 w-full bg-slate-950 rounded-full overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${laborPct}%` }}
                      title={`Labor Time: ${formatNumber(item.sum.laborTime)}s`}
                      className="bg-emerald-500 hover:bg-emerald-400 transition-all rounded-l-full"
                    />
                    <div
                      style={{ width: `${mcPct}%` }}
                      title={`MC Time: ${formatNumber(item.sum.mcTime)}s`}
                      className="bg-cyan-600 hover:bg-cyan-500 transition-all rounded-r-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (1 col): Selected Model Station Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] font-semibold uppercase text-emerald-400 tracking-wider">
                รายละเอียดสายการผลิต
              </span>
              <h3 className="text-base font-bold text-slate-100 truncate">
                {selectedModel?.model}
              </h3>
              <p className="text-xs text-slate-400 font-mono-num mt-0.5">
                STD Total: {formatNumber(selectedModel?.std.total)}s | Routing Sum: {formatNumber(selectedModel?.sum.total)}s
              </p>
            </div>

            {/* Station breakdown list for selected model */}
            <div className="mt-4 space-y-2.5 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
              {selectedModel &&
                getModelStations(selectedModel)
                  .filter((s) => s.totalTime > 0)
                  .sort((a, b) => b.totalTime - a.totalTime)
                  .map((station, idx) => {
                    const pctOfModel = (station.totalTime / (selectedModel.sum.total || 1)) * 100;
                    return (
                      <div
                        key={station.id}
                        className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-200 flex items-center gap-1.5">
                            {idx === 0 && <span className="text-rose-400 text-[10px]">🔥 คอขวด</span>}
                            {station.name}
                          </span>
                          <span className="font-mono-num font-bold text-slate-100">
                            {formatNumber(station.totalTime, 1)} s
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono-num">
                          <span>MC: {formatNumber(station.mcTime, 1)}s</span>
                          <span>Labor: {formatNumber(station.laborTime, 1)}s</span>
                          <span className="text-emerald-400 font-semibold">{round(pctOfModel, 1)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pctOfModel}%` }}
                            className={`h-full rounded-full ${
                              idx === 0 ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>

          {/* Quick inspect button */}
          {selectedModel && (
            <button
              onClick={() => onSelectModel(selectedModel)}
              className="w-full mt-4 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-700 text-center"
            >
              แก้ไขหรือดูโมเดล {selectedModel.model} ในตาราง
            </button>
          )}
        </div>
      </div>

      {/* 3. Station Bottleneck Ranking & Takt Time Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Station Bottleneck Ranking */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-rose-400" />
              การจัดอันดับภาระงานเฉลี่ยตามสถานี (Station Bottleneck Ranking)
            </h3>
            <p className="text-xs text-slate-400">
              สถานีที่มี Cycle Time สูงสุดจะเป็นตัวกำหนดอัตราการผลิตรวมของโรงงาน
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {stationAverages.map((station, index) => {
              const widthPct = (station.avgTime / maxStationTime) * 100;
              return (
                <div key={station.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      <span className="text-slate-500 font-mono-num">{index + 1}.</span>
                      {station.name}
                      <span className="text-[10px] text-slate-500">
                        ({station.activeCount} โมเดลใช้งาน)
                      </span>
                    </span>
                    <span className="font-mono-num font-bold text-slate-100">
                      {formatNumber(station.avgTime, 1)} s
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: index === 0 ? '#ef4444' : station.color,
                      }}
                      className="h-full rounded-full transition-all"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Takt Time & Line Capacity Simulator */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" />
                จำลองคำนวณ Takt Time & กำลังการผลิต (Line Capacity)
              </h3>
              <p className="text-xs text-slate-400">
                วิเคราะห์ว่าความเร็วสายการผลิตสามารถรองรับเป้าหมายการผลิตต่อกะได้หรือไม่
              </p>
            </div>
          </div>

          {/* Interactive Sliders */}
          <div className="space-y-4 pt-1">
            {/* Model Selector */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                โมเดลเป้าหมายในการผลิต:
              </label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.model} (Total Cycle: {formatNumber(i.sum.total)}s)
                  </option>
                ))}
              </select>
            </div>

            {/* Inputs: Hours & Target */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">ชั่วโมงทำงาน/กะ</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={shiftHours}
                  onChange={(e) => setShiftHours(Number(e.target.value) || 8)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono-num text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">เป้าหมายผลิต (ชิ้น)</label>
                <input
                  type="number"
                  min={1}
                  value={targetUnits}
                  onChange={(e) => setTargetUnits(Number(e.target.value) || 100)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono-num text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">OEE / ประสิทธิภาพ (%)</label>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={lineEfficiency}
                  onChange={(e) => setLineEfficiency(Number(e.target.value) || 85)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono-num text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Calculated Output Cards */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase block">Required Takt Time</span>
                <span className="text-xl font-bold font-mono-num text-cyan-400">
                  {formatNumber(calculatedTaktTimeSec, 1)} s
                </span>
                <span className="text-[10px] text-slate-500 block">เวลาต่อชิ้นที่ต้องทำได้</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase block">ความจุการผลิตต่อกะ</span>
                <span className="text-xl font-bold font-mono-num text-amber-300">
                  {formatNumber(theoreticalCapacity, 0)} ชิ้น
                </span>
                <span className="text-[10px] text-slate-500 block">
                  ({formatNumber(theoreticalCapacity / (shiftHours || 1), 1)} ชิ้น/ชม.)
                </span>
              </div>
            </div>

            {/* Evaluation Message */}
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2.5 border ${
                theoreticalCapacity >= targetUnits
                  ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/40 text-rose-300'
              }`}
            >
              {theoreticalCapacity >= targetUnits ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertOctagon className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <div>
                <strong>
                  {theoreticalCapacity >= targetUnits
                    ? '✅ สายการผลิตรองรับเป้าหมายได้ตามกำหนด'
                    : '⚠️ เสี่ยงไม่ทันเป้าหมายการผลิต (Bottleneck Risk)'}
                </strong>
                <p className="mt-0.5 opacity-90 text-[11px]">
                  {theoreticalCapacity >= targetUnits
                    ? `โมเดล ${selectedModel?.model} มีกำลังการผลิต ${theoreticalCapacity} ชิ้น ซึ่งมากกว่าเป้าหมาย ${targetUnits} ชิ้น`
                    : `โมเดล ${selectedModel?.model} ผลิตได้ ${theoreticalCapacity} ชิ้น ซึ่งต่ำกว่าเป้าหมาย ${targetUnits} ชิ้น ควรปรับเกลี่ยงาน (Line Balancing) หรือลดเวลาสถานีคอขวด`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
