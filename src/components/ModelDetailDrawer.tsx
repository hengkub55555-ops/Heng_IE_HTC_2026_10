import React from 'react';
import { X, Edit2, Send, Copy, AlertTriangle, CheckCircle, Cpu, Users, Timer } from 'lucide-react';
import { RoutingItem } from '../types/routing';
import { formatNumber, getModelStations, getVariance, round } from '../utils/calculations';

interface ModelDetailDrawerProps {
  item: RoutingItem | null;
  onClose: () => void;
  onEdit: (item: RoutingItem) => void;
  onSendLine: (item: RoutingItem) => void;
  onDuplicate: (item: RoutingItem) => void;
}

export const ModelDetailDrawer: React.FC<ModelDetailDrawerProps> = ({
  item,
  onClose,
  onEdit,
  onSendLine,
  onDuplicate,
}) => {
  if (!item) return null;

  const variance = getVariance(item);
  const stations = getModelStations(item).filter((s) => s.totalTime > 0);
  const maxStationTime = Math.max(...stations.map((s) => s.totalTime), 1);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40 font-mono-num">
                NO. {item.no}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono-num">
                Plant {item.plant}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-1">{item.model}</h2>
            {item.note && <p className="text-xs text-slate-400 mt-0.5">{item.note}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Summary Box */}
          <div className="grid grid-cols-2 gap-3 font-mono-num">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">Standard Time (STD)</span>
              <span className="text-lg font-bold text-amber-300">
                {formatNumber(item.std.total)} s
              </span>
              <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                <div>MC: {formatNumber(item.std.mcTime)}s</div>
                <div>Labor: {formatNumber(item.std.laborTime)}s</div>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">Routing By Line SUM</span>
              <span className="text-lg font-bold text-emerald-400">
                {formatNumber(item.sum.total)} s
              </span>
              <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                <div>MC: {formatNumber(item.sum.mcTime)}s</div>
                <div>Labor: {formatNumber(item.sum.laborTime)}s</div>
              </div>
            </div>
          </div>

          {/* Variance Status */}
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              variance.isBalanced
                ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/40 text-rose-300'
            }`}
          >
            {variance.isBalanced ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span>
              {variance.isBalanced
                ? 'Line Balanced: ผลรวมเวลากระบวนการผลิตตรงตามมาตรฐาน STD'
                : `มีผลต่างจาก STD: ${variance.diffTotal > 0 ? '+' : ''}${variance.diffTotal}s (Labor: ${variance.diffLabor}s, MC: ${variance.diffMc}s)`}
            </span>
          </div>

          {/* Station breakdown list */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase text-slate-300 tracking-wider">
              ภาระงานแยกตามสถานีผลิต (Stations Breakdown)
            </h4>

            <div className="space-y-2 font-mono-num text-xs">
              {stations.map((st, idx) => {
                const widthPct = (st.totalTime / maxStationTime) * 100;
                const shareOfModel = (st.totalTime / (item.sum.total || 1)) * 100;

                return (
                  <div
                    key={st.id}
                    className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200 font-sans font-medium flex items-center gap-1.5">
                        <span className="text-slate-500 text-[11px]">{idx + 1}.</span>
                        {st.name}
                      </span>
                      <span className="font-bold text-slate-100">
                        {formatNumber(st.totalTime)} s
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>MC: {formatNumber(st.mcTime)}s</span>
                      <span>Labor: {formatNumber(st.laborTime)}s</span>
                      <span className="text-emerald-400 font-semibold">{round(shareOfModel, 1)}%</span>
                    </div>

                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${widthPct}%` }}
                        className="h-full bg-emerald-500 rounded-full transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
          <button
            onClick={() => onSendLine(item)}
            className="flex-1 py-2 px-3 bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Send className="h-3.5 w-3.5" />
            ส่งเข้า LINE
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(item);
            }}
            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Edit2 className="h-3.5 w-3.5" />
            แก้ไขข้อมูล
          </button>
          <button
            onClick={() => {
              onDuplicate(item);
              onClose();
            }}
            title="คัดลอกโมเดลนี้"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
