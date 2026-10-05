import React, { useState, useEffect } from 'react';
import {
  Factory,
  BarChart3,
  Table as TableIcon,
  Bell,
  Plus,
  Send,
  Download,
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  Clock,
  Edit3,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HeaderProps {
  activeTab: 'table' | 'dashboard' | 'notifications';
  setActiveTab: (tab: 'table' | 'dashboard' | 'notifications') => void;
  onAddNew: () => void;
  onSaveAll: () => void;
  onSendLineSummary: () => void;
  onExport: () => void;
  onImportClick: () => void;
  onResetData: () => void;
  itemCount: number;
  plantId: string;
  isSendingSummary: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;
  isSpreadsheetEditMode: boolean;
  setIsSpreadsheetEditMode: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onAddNew,
  onSaveAll,
  onSendLineSummary,
  onExport,
  onImportClick,
  onResetData,
  itemCount,
  plantId,
  isSendingSummary,
  isSaving,
  hasUnsavedChanges,
  lastSavedAt,
  isSpreadsheetEditMode,
  setIsSpreadsheetEditMode,
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleExportWithConfetti = () => {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.1 },
    });
    onExport();
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30">
      {/* Top Banner with Industrial Branding and Save Status */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2.5 gap-3 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Factory className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                  Routing By Line System
                </h1>
                <span className="text-xs text-slate-400 font-mono-num">
                  Plant {plantId} · {itemCount} Models
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ระบบจัดเก็บ แก้ไขตัวเลข คำนวณเวลา MC / Labor Time และบันทึกข้อมูลบนเว็บแบบ Real-time
              </p>
            </div>
          </div>

          {/* Save Status & Real-time Clock */}
          <div className="flex items-center flex-wrap gap-3 text-xs self-end md:self-auto">
            {hasUnsavedChanges ? (
              <div className="flex items-center gap-1.5 text-amber-300 bg-amber-950/50 border border-amber-700/50 px-2.5 py-1 rounded-md">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                <span>มีการแก้ไขตัวเลข (กดปุ่มบันทึกข้อมูลเพื่อยืนยัน)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-1 rounded-md">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  บันทึกข้อมูลบนเว็บแล้ว
                  {lastSavedAt
                    ? ` (${new Date(lastSavedAt).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })})`
                    : ''}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 font-mono-num text-slate-300">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {time.toLocaleTimeString('th-TH', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation and Action Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-2.5 gap-3">
          {/* Segmented Tab Controls */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg self-start">
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'table'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              ตารางข้อมูล & แก้ไขตัวเลข
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Real-time Dashboard
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors relative ${
                activeTab === 'notifications'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              LINE Notification
              <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Direct Edit Mode Toggle */}
            {activeTab === 'table' && (
              <button
                onClick={() => setIsSpreadsheetEditMode(!isSpreadsheetEditMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all border ${
                  isSpreadsheetEditMode
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                {isSpreadsheetEditMode
                  ? 'กำลังเปิดโหมดพิมพ์แก้ไขทั้งตาราง (ปิด)'
                  : 'โหมดแก้ไขตัวเลขทั้งตาราง'}
              </button>
            )}

            {/* Prominent SAVE Button */}
            <button
              onClick={onSaveAll}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-md transition-all shadow-md ${
                hasUnsavedChanges
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-400/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              } disabled:opacity-50`}
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving
                ? 'กำลังบันทึก...'
                : hasUnsavedChanges
                ? 'บันทึกข้อมูลที่แก้ไข (Save)'
                : 'บันทึกข้อมูลลงเว็บ (Save)'}
            </button>

            <button
              onClick={onAddNew}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              เพิ่มแถว/โมเดล
            </button>

            <button
              onClick={onSendLineSummary}
              disabled={isSendingSummary}
              title="ส่งรายงานสรุปเวลากระบวนการผลิตเข้าห้องแชท LINE ทันที"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[#06C755] hover:bg-[#05b34c] text-white transition-colors shadow-sm disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {isSendingSummary ? 'กำลังส่ง...' : 'ส่งสรุปเข้า LINE'}
            </button>

            <div className="h-4 w-px bg-slate-800 mx-0.5 hidden sm:block" />

            <button
              onClick={handleExportWithConfetti}
              title="ดาวน์โหลดข้อมูลเป็นไฟล์ CSV สำหรับ Excel"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>

            <button
              onClick={onImportClick}
              title="นำเข้าข้อมูลจากไฟล์ CSV หรือ Spreadsheet"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
            >
              <Upload className="h-3.5 w-3.5" />
              Import CSV
            </button>

            <button
              onClick={onResetData}
              title="รีเซ็ตกลับเป็นข้อมูลตัวอย่างเริ่มต้นตามเอกสาร Data 001"
              className="p-1.5 text-xs text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 rounded-md transition-colors border border-transparent hover:border-slate-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
