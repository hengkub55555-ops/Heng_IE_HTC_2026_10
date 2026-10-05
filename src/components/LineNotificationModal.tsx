import React, { useState } from 'react';
import {
  Bell,
  Send,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Smartphone,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Check,
  Clock,
  Sparkles,
  Settings,
} from 'lucide-react';
import { LineNotificationConfig, NotificationLog, RoutingItem } from '../types/routing';
import {
  formatDailySummaryMessage,
  formatBottleneckAlertMessage,
  sendLineNotification,
  saveLineConfig,
  clearNotificationLogs,
} from '../services/lineNotifyService';

interface LineNotificationModalProps {
  config: LineNotificationConfig;
  onUpdateConfig: (config: LineNotificationConfig) => void;
  logs: NotificationLog[];
  onRefreshLogs: () => void;
  items: RoutingItem[];
}

export const LineNotificationModal: React.FC<LineNotificationModalProps> = ({
  config,
  onUpdateConfig,
  logs,
  onRefreshLogs,
  items,
}) => {
  const [tokenInput, setTokenInput] = useState<string>(config.token || '');
  const [webhookInput, setWebhookInput] = useState<string>(config.webhookUrl || '');
  const [notifyOnEdit, setNotifyOnEdit] = useState<boolean>(config.notifyOnEdit);
  const [notifyOnBottleneck, setNotifyOnBottleneck] = useState<boolean>(config.notifyOnBottleneck);
  const [taktTimeThreshold, setTaktTimeThreshold] = useState<number>(config.bottleneckThresholdSec || 2500);

  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    simulated?: boolean;
    message?: string;
  }>({ loading: false });

  // Preview message state
  const [previewType, setPreviewType] = useState<'update' | 'bottleneck' | 'summary'>('summary');

  const handleSaveConfig = () => {
    const updated: LineNotificationConfig = {
      ...config,
      token: tokenInput.trim(),
      webhookUrl: webhookInput.trim(),
      notifyOnEdit,
      notifyOnBottleneck,
      bottleneckThresholdSec: taktTimeThreshold,
    };
    onUpdateConfig(updated);
    saveLineConfig(updated);
    setTestStatus({
      loading: false,
      success: true,
      message: 'บันทึกการตั้งค่า LINE สำเร็จ',
    });
  };

  const handleSendTestMessage = async (type: 'update' | 'bottleneck' | 'summary') => {
    setTestStatus({ loading: true });

    let message = '';
    const sampleItem = items[0] || {
      model: '1D',
      plant: '9771',
      std: { total: 1796, mcTime: 1158, laborTime: 638 },
      sum: { total: 1796, mcTime: 1158, laborTime: 638 },
      fg: { mcTime: 683.65, laborTime: 239.636, cycleTime: 683.65 },
      cab: { r: { mcTime: 401.875, laborTime: 187.667, cycleTime: 401.875 }, f: { mcTime: 72.475, laborTime: 210.697, cycleTime: 72.475 } },
      door: { veg: { mcTime: 0, laborTime: 0, cycleTime: 0 } },
    } as any;

    if (type === 'summary') {
      message = formatDailySummaryMessage(items);
    } else if (type === 'bottleneck') {
      message = formatBottleneckAlertMessage(sampleItem, 'FG Main Assembly', 2904.85, taktTimeThreshold);
    } else {
      message = `
[🏭 ✏️ อัปเดตข้อมูล Routing By Line]
───────────────────
📌 Model: ${sampleItem.model} (Plant ${sampleItem.plant})
⏱️ STD Total: 1,796.00 s
📊 SUM Total: 1,796.00 s (Balanced ✅)
🕒 เวลาแก้ไข: ${new Date().toLocaleTimeString('th-TH')}
`.trim();
    }

    const currentConfig: LineNotificationConfig = {
      ...config,
      token: tokenInput.trim(),
      webhookUrl: webhookInput.trim(),
    };

    const res = await sendLineNotification(
      message,
      currentConfig,
      type === 'summary' ? 'DAILY_REPORT' : type === 'bottleneck' ? 'BOTTLENECK' : 'UPDATE',
      sampleItem.model
    );

    setTestStatus({
      loading: false,
      success: res.success,
      simulated: res.simulated,
      message: res.message,
    });

    onRefreshLogs();
  };

  const getPreviewText = () => {
    const sampleItem = items[0];
    if (previewType === 'summary') {
      return formatDailySummaryMessage(items);
    }
    if (previewType === 'bottleneck' && sampleItem) {
      return formatBottleneckAlertMessage(sampleItem, 'FG Main Assembly', 2904.85, taktTimeThreshold);
    }
    return `
[🏭 ✏️ อัปเดตข้อมูล Routing By Line]
───────────────────
📌 Model: ${sampleItem?.model || '1D'} (Plant 9771)
⏱️ STD Total: 1,796.00 s
   - MC: 1,158.00 s | Labor: 638.00 s
🔧 Routing By Line:
   - FG Main: 683.65s MC / 239.64s L
   - CAB R: 401.88s MC / 187.67s L
   - CAB F: 72.48s MC / 210.70s L
📊 SUM Total: 1,796.00 s
⚖️ Status: ✅ Line Balanced (ตรงกับ STD)
🕒 เวลาแก้ไข: ${new Date().toLocaleTimeString('th-TH')}
`.trim();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#06C755]/10 border border-[#06C755]/30 text-[#06C755]">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                LINE Notification Integration
              </h2>
              <p className="text-xs text-slate-400">
                ส่งข้อความแจ้งเตือนผลการปรับแก้เวลาผลิต สถานีคอขวด และรายงานสรุปประจำวันเข้ากลุ่ม LINE อัตโนมัติ
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => handleSendTestMessage('summary')}
            disabled={testStatus.loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#06C755] hover:bg-[#05b34c] text-white transition-colors shadow-sm disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {testStatus.loading ? 'กำลังส่ง...' : 'ทดสอบส่งสรุปเข้า LINE'}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Settings, Right Live LINE Chat Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Connection Config */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Settings className="h-4 w-4 text-emerald-400" />
              การเชื่อมต่อ (Connection Settings)
            </h3>

            {/* Token Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>LINE Notify Token</span>
                <span className="text-[11px] text-slate-400 hover:text-emerald-400">
                  รับ Token ฟรีได้ที่ notify-bot.line.me
                </span>
              </label>
              <input
                type="text"
                placeholder="กรอก LINE Notify Token (หรือเว้นว่างไว้เพื่อใช้งานโหมดจำลอง)"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono-num text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755]"
              />
              <p className="text-[11px] text-slate-500">
                💡 หากยังไม่มี Token ระบบจะทำงานใน <strong>Simulation Mode</strong> แสดงผลข้อความและการทำงานอย่างสมบูรณ์แบบ
              </p>
            </div>

            {/* Optional Custom Webhook URL */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-slate-300 block">
                Webhook URL (ตัวเลือกเสริม: สำหรับ LINE Messaging API / Slack / ERP)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={webhookInput}
                onChange={(e) => setWebhookInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono-num text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#06C755]"
              />
            </div>

            {/* Trigger Toggles */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <span className="text-xs font-medium text-slate-300 block">
                เงื่อนไขการส่งแจ้งเตือนอัตโนมัติ (Automated Triggers)
              </span>

              {/* Toggle 1: On Edit */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div>
                  <span className="text-xs font-medium text-slate-200 block">
                    แจ้งเตือนเมื่อมีการแก้ไขข้อมูล Routing
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ส่งข้อมูลรุ่น เวลาจักรกล (MC) และเวลาแรงงาน (Labor) ที่ถูกปรับเปลี่ยน
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnEdit}
                  onChange={(e) => setNotifyOnEdit(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 text-[#06C755] focus:ring-[#06C755] bg-slate-900"
                />
              </div>

              {/* Toggle 2: On Bottleneck */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div>
                  <span className="text-xs font-medium text-slate-200 block">
                    แจ้งเตือนคอขวด (Bottleneck Alert)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    แจ้งเตือนทันทีเมื่อ Cycle Time ของสถานีเกินเกณฑ์ที่กำหนด
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnBottleneck}
                  onChange={(e) => setNotifyOnBottleneck(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 text-[#06C755] focus:ring-[#06C755] bg-slate-900"
                />
              </div>

              {/* Bottleneck threshold input */}
              {notifyOnBottleneck && (
                <div className="flex items-center justify-between pl-4 pr-3 py-2 rounded-lg bg-slate-950/40 text-xs text-slate-300 border border-slate-800">
                  <span>เกณฑ์เวลาคอขวด (Bottleneck Threshold):</span>
                  <div className="flex items-center gap-1.5 font-mono-num">
                    <input
                      type="number"
                      value={taktTimeThreshold}
                      onChange={(e) => setTaktTimeThreshold(Number(e.target.value) || 2000)}
                      className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-right text-xs focus:outline-none"
                    />
                    <span className="text-slate-500">วินาที</span>
                  </div>
                </div>
              )}
            </div>

            {/* Save Config Button */}
            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
              >
                บันทึกการตั้งค่า LINE
              </button>

              {testStatus.message && (
                <span
                  className={`text-xs flex items-center gap-1 ${
                    testStatus.success ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {testStatus.success ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                  {testStatus.message}
                </span>
              )}
            </div>
          </div>

          {/* Quick instructions card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-2">
            <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#06C755]" />
              วิธีตั้งค่ารับการแจ้งเตือน LINE สำหรับทีมวิศวกรโรงงาน
            </h4>
            <ol className="list-decimal pl-5 space-y-1 text-slate-400 text-[11.5px]">
              <li>เข้าสู่ระบบเว็บไซต์ LINE Notify ที่ notify-bot.line.me</li>
              <li>เลือกเมนู "Generate Token" สำหรับห้องแชทส่วนตัว หรือกลุ่มวิศวกรรมการผลิต (IE/Production Team)</li>
              <li>คัดลอก Token มาวางในช่องด้านบนแล้วกด "บันทึกการตั้งค่า"</li>
              <li>เชิญบัญชี "LINE Notify" เข้าสู่กลุ่มไลน์ที่ต้องการรับข้อความ</li>
            </ol>
          </div>
        </div>

        {/* Right Column: Live Smartphone Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[340px] bg-slate-950 border-[6px] border-slate-800 rounded-[38px] shadow-2xl overflow-hidden flex flex-col">
            {/* Phone Top Notch */}
            <div className="bg-slate-900 px-6 py-2 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800">
              <span className="font-mono-num font-semibold text-slate-300">
                {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <div className="h-3 w-16 bg-slate-950 rounded-full mx-auto" />
              <div className="flex items-center gap-1">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* LINE Chat Header */}
            <div className="bg-[#20272F] px-4 py-3 flex items-center justify-between border-b border-slate-800 text-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-[#06C755] flex items-center justify-center font-bold text-white text-xs">
                  LINE
                </div>
                <div>
                  <h4 className="text-xs font-semibold leading-tight">LINE Notify</h4>
                  <span className="text-[10px] text-slate-400">กลุ่ม: IE Routing Plant 9771</span>
                </div>
              </div>
            </div>

            {/* Segmented switcher for preview type */}
            <div className="flex border-b border-slate-800 text-[10px] bg-slate-900">
              <button
                onClick={() => setPreviewType('summary')}
                className={`flex-1 py-1.5 text-center transition-colors ${
                  previewType === 'summary'
                    ? 'bg-[#06C755]/20 text-[#06C755] font-semibold border-b-2 border-[#06C755]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                สรุปประจำกะ
              </button>
              <button
                onClick={() => setPreviewType('update')}
                className={`flex-1 py-1.5 text-center transition-colors ${
                  previewType === 'update'
                    ? 'bg-[#06C755]/20 text-[#06C755] font-semibold border-b-2 border-[#06C755]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                อัปเดตโมเดล
              </button>
              <button
                onClick={() => setPreviewType('bottleneck')}
                className={`flex-1 py-1.5 text-center transition-colors ${
                  previewType === 'bottleneck'
                    ? 'bg-[#06C755]/20 text-[#06C755] font-semibold border-b-2 border-[#06C755]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                คอขวด
              </button>
            </div>

            {/* Chat Body (LINE Bubble) */}
            <div className="flex-1 bg-[#191F26] p-3 min-h-[380px] max-h-[440px] overflow-y-auto space-y-3 font-sans">
              <div className="text-center text-[10px] text-slate-500 py-1">
                วันนี้ {new Date().toLocaleDateString('th-TH')}
              </div>

              {/* LINE Message Bubble */}
              <div className="flex items-start gap-2">
                <div className="h-7 w-7 rounded-full bg-[#06C755] shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow">
                  LN
                </div>
                <div className="max-w-[85%] bg-[#242E38] text-slate-100 rounded-2xl rounded-tl-sm p-3 text-xs shadow-md border border-slate-700/60 leading-relaxed font-mono-num whitespace-pre-wrap">
                  {getPreviewText()}
                </div>
              </div>

              <div className="text-right text-[10px] text-slate-500 pr-2">
                อ่านแล้ว {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Test action bar inside phone */}
            <div className="p-2.5 bg-[#20272F] border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">ส่งรูปแบบที่เลือกเข้า LINE:</span>
              <button
                onClick={() => handleSendTestMessage(previewType)}
                disabled={testStatus.loading}
                className="px-2.5 py-1 bg-[#06C755] hover:bg-[#05b34c] text-white text-[11px] font-medium rounded-md transition-colors"
              >
                ส่งข้อความนี้
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Logs History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              ประวัติการส่งแจ้งเตือน (Notification Audit Log)
            </h3>
            <p className="text-xs text-slate-400">
              บันทึกประวัติการส่งแจ้งเตือนทั้งหมด 50 รายการล่าสุด
            </p>
          </div>
          {logs.length > 0 && (
            <button
              onClick={() => {
                clearNotificationLogs();
                onRefreshLogs();
              }}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              ล้างประวัติ
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-3 py-2">เวลา</th>
                <th className="px-3 py-2">ประเภท</th>
                <th className="px-3 py-2">หัวข้อ / โมเดล</th>
                <th className="px-3 py-2">ข้อความ</th>
                <th className="px-3 py-2 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-num">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500 font-sans">
                    ยังไม่มีประวัติการส่งแจ้งเตือน
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {log.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-200 font-sans font-medium whitespace-nowrap">
                      {log.title}
                    </td>
                    <td className="px-3 py-2 text-slate-400 font-sans truncate max-w-xs" title={log.message}>
                      {log.message.replace(/\n/g, ' ')}
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {log.status === 'SUCCESS' ? (
                        <span className="text-emerald-400 text-[11px] flex items-center justify-center gap-1">
                          <Check className="h-3 w-3" /> สำเร็จ
                        </span>
                      ) : log.status === 'SIMULATED' ? (
                        <span className="text-cyan-400 text-[11px] flex items-center justify-center gap-1">
                          จำลองสำเร็จ
                        </span>
                      ) : (
                        <span className="text-rose-400 text-[11px] flex items-center justify-center gap-1">
                          ล้มเหลว
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
