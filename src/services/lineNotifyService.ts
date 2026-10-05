import { LineNotificationConfig, NotificationLog, RoutingItem } from '../types/routing';
import { formatNumber, getVariance, round } from '../utils/calculations';

const NOTIF_CONFIG_KEY = 'routing_line_config_v1';
const NOTIF_LOGS_KEY = 'routing_line_logs_v1';

export const DEFAULT_LINE_CONFIG: LineNotificationConfig = {
  enabled: true,
  token: '',
  webhookUrl: '',
  channelName: 'IE Routing & Production Alert',
  notifyOnEdit: true,
  notifyOnBottleneck: true,
  bottleneckThresholdSec: 2500,
  taktTimeSec: 1800,
};

export const loadLineConfig = (): LineNotificationConfig => {
  try {
    const raw = localStorage.getItem(NOTIF_CONFIG_KEY);
    if (raw) return { ...DEFAULT_LINE_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load line config', e);
  }
  return DEFAULT_LINE_CONFIG;
};

export const saveLineConfig = (config: LineNotificationConfig): void => {
  try {
    localStorage.setItem(NOTIF_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save line config', e);
  }
};

export const loadNotificationLogs = (): NotificationLog[] => {
  try {
    const raw = localStorage.getItem(NOTIF_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load notification logs', e);
  }
  return [
    {
      id: 'log-init-1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'ALERT',
      title: 'ระบบแจ้งเตือน LINE พร้อมใช้งาน',
      message: 'ระบบพร้อมเชื่อมต่อ LINE Notify สำหรับแจ้งเตือนการปรับแก้ Routing และ Bottleneck',
      status: 'SUCCESS',
      details: 'Line notification service initialized',
    },
  ];
};

export const saveNotificationLog = (log: NotificationLog): void => {
  try {
    const logs = loadNotificationLogs();
    const updated = [log, ...logs].slice(0, 50); // keep last 50
    localStorage.setItem(NOTIF_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save notification log', e);
  }
};

export const clearNotificationLogs = (): void => {
  localStorage.removeItem(NOTIF_LOGS_KEY);
};

export interface SendResult {
  success: boolean;
  simulated: boolean;
  message: string;
  error?: string;
}

export const sendLineNotification = async (
  message: string,
  config: LineNotificationConfig,
  type: NotificationLog['type'],
  targetModel?: string
): Promise<SendResult> => {
  const token = config.token?.trim();
  const webhookUrl = config.webhookUrl?.trim();

  let result: SendResult = {
    success: false,
    simulated: false,
    message: '',
  };

  // 1. If Webhook URL is specified (e.g. LINE Messaging API or Custom Webhook)
  if (webhookUrl) {
    try {
      const res = await fetch('/api/webhook-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          payload: {
            message,
            channel: config.channelName,
            type,
            targetModel,
            timestamp: new Date().toISOString(),
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        result = { success: true, simulated: false, message: 'ส่งผ่าน Webhook สำเร็จ' };
      } else {
        result = {
          success: false,
          simulated: false,
          message: data.error || 'Webhook dispatch failed',
          error: data.error,
        };
      }
    } catch (err: any) {
      result = { success: false, simulated: false, message: err.message, error: err.message };
    }
  }
  // 2. If LINE Notify token provided
  else if (token) {
    try {
      const res = await fetch('/api/line-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, message }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        result = {
          success: true,
          simulated: Boolean(data.simulated),
          message: data.message || 'ส่ง LINE Notify สำเร็จ',
        };
      } else {
        result = {
          success: false,
          simulated: false,
          message: data.error || 'LINE Notify error',
          error: data.error,
        };
      }
    } catch (err: any) {
      // In case server endpoint is unreachable, fallback to simulation
      result = {
        success: true,
        simulated: true,
        message: 'จำลองการส่งสำเร็จ (Server offline)',
      };
    }
  }
  // 3. Simulated mode (No token configured)
  else {
    result = {
      success: true,
      simulated: true,
      message: 'โหมดจำลอง: ส่งข้อความตัวอย่างสำเร็จ (กรุณากรอก LINE Token เพื่อส่งเข้าเครื่องจริง)',
    };
  }

  // Record log
  const newLog: NotificationLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    type,
    title: targetModel ? `Routing: ${targetModel}` : 'แจ้งเตือนระบบ Routing',
    message,
    status: result.simulated ? 'SIMULATED' : result.success ? 'SUCCESS' : 'FAILED',
    targetModel,
    responseInfo: result.message,
  };
  saveNotificationLog(newLog);

  return result;
};

// Formatter Helpers
export const formatRoutingUpdateMessage = (item: RoutingItem, action: 'CREATE' | 'UPDATE' | 'DELETE'): string => {
  const v = getVariance(item);
  const actionText = action === 'CREATE' ? '🆕 เพิ่มโมเดลใหม่' : action === 'UPDATE' ? '✏️ อัปเดตข้อมูล Routing' : '🗑️ ลบโมเดล';

  return `
[🏭 ${actionText}]
───────────────────
📌 Model: ${item.model} (Plant ${item.plant})
⏱️ STD Total: ${formatNumber(item.std.total)} s
   - MC: ${formatNumber(item.std.mcTime)} s | Labor: ${formatNumber(item.std.laborTime)} s

🔧 Routing By Line:
   - FG Main: ${formatNumber(item.fg.mcTime)}s MC / ${formatNumber(item.fg.laborTime)}s L
   - CAB R: ${formatNumber(item.cab.r.mcTime)}s MC / ${formatNumber(item.cab.r.laborTime)}s L
   - CAB F: ${formatNumber(item.cab.f.mcTime)}s MC / ${formatNumber(item.cab.f.laborTime)}s L
   - DOOR Sum: ${formatNumber(item.sum.mcTime - item.fg.mcTime - item.cab.r.mcTime - item.cab.f.mcTime)}s MC

📊 SUM Total: ${formatNumber(item.sum.total)} s
   - MC Time: ${formatNumber(item.sum.mcTime)} s
   - Labor Time: ${formatNumber(item.sum.laborTime)} s
⚖️ Status: ${v.isBalanced ? '✅ Line Balanced (ตรงกับ STD)' : `⚠️ ผลรวมต่างจาก STD (${v.diffTotal > 0 ? '+' : ''}${v.diffTotal}s)`}
🕒 เวลาแก้ไข: ${new Date().toLocaleTimeString('th-TH')}
`.trim();
};

export const formatBottleneckAlertMessage = (item: RoutingItem, stationName: string, cycleTime: number, taktTime: number): string => {
  return `
🚨 [แจ้งเตือนสถานีคอขวด / BOTTLENECK ALERT]
───────────────────
⚠️ พบสถานีที่ใช้เวลาผลิตเกินเกณฑ์ Takt Time
📌 Model: ${item.model} (Plant ${item.plant})
🏭 Station: ${stationName}
⏱️ Cycle Time: ${formatNumber(cycleTime)} วินาที
🎯 Target Takt Time: ${formatNumber(taktTime)} วินาที
📈 เกินเป้าหมาย: +${formatNumber(cycleTime - taktTime)} วินาที (${round(((cycleTime - taktTime) / taktTime) * 100, 1)}%)
💡 แนะนำ: พิจารณาปรับ Line Balancing หรือเพิ่มผู้ปฏิบัติงาน
`.trim();
};

export const formatDailySummaryMessage = (items: RoutingItem[]): string => {
  let totalStd = 0;
  let totalLabor = 0;
  let totalMc = 0;
  let balanced = 0;

  items.forEach((item) => {
    totalStd += item.std.total;
    totalLabor += item.sum.laborTime;
    totalMc += item.sum.mcTime;
    if (Math.abs(item.sum.total - item.std.total) <= 1.0) balanced++;
  });

  const count = items.length || 1;
  const avgStd = formatNumber(totalStd / count, 1);
  const avgLabor = formatNumber(totalLabor / count, 1);
  const avgMc = formatNumber(totalMc / count, 1);

  return `
📊 [รายงานสรุป ROUTING BY LINE - ประจำกะ]
───────────────────
🏭 Plant: 9771 (Refrigeration Factory)
📦 จำนวนโมเดลทั้งหมด: ${items.length} โมเดล
✅ โมเดลที่ Line Balanced: ${balanced} / ${items.length} โมเดล (${round((balanced / items.length) * 100, 1)}%)
⏱️ ค่าเฉลี่ย Cycle Time: ${avgStd} วินาที
👷 ค่าเฉลี่ย Labor Time: ${avgLabor} วินาที
⚙️ ค่าเฉลี่ย MC Time: ${avgMc} วินาที
🔝 โมเดลเวลาผลิตสูงสุด: ${items.slice().sort((a, b) => b.sum.total - a.sum.total)[0]?.model || '-'} (${formatNumber(items.slice().sort((a, b) => b.sum.total - a.sum.total)[0]?.sum.total)}s)
📅 วันที่บันทึก: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
`.trim();
};
