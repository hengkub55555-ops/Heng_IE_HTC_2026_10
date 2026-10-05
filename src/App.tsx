import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { RoutingTable } from './components/RoutingTable';
import { Dashboard } from './components/Dashboard';
import { LineNotificationModal } from './components/LineNotificationModal';
import { RoutingModal } from './components/RoutingModal';
import { ModelDetailDrawer } from './components/ModelDetailDrawer';
import { RoutingItem, LineNotificationConfig, NotificationLog } from './types/routing';
import { INITIAL_ROUTING_DATA } from './data/initialData';
import { calculateItemSums, round } from './utils/calculations';
import { exportToCSV, parseCSV } from './utils/exportImport';
import {
  loadLineConfig,
  saveLineConfig,
  loadNotificationLogs,
  sendLineNotification,
  formatRoutingUpdateMessage,
  formatDailySummaryMessage,
  formatBottleneckAlertMessage,
} from './services/lineNotifyService';
import { CheckCircle2, AlertCircle, Info, X, Save } from 'lucide-react';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'routing_items_data_v2';
const LAST_SAVED_KEY = 'routing_items_last_saved_v2';

export default function App() {
  // Load data from localStorage initially, then sync with backend /api/routing
  const [items, setItems] = useState<RoutingItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load stored routing data', e);
    }
    return INITIAL_ROUTING_DATA;
  });

  const [activeTab, setActiveTab] = useState<'table' | 'dashboard' | 'notifications'>('table');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<RoutingItem | null>(null);
  const [detailItem, setDetailItem] = useState<RoutingItem | null>(null);

  // Editing & Saving state
  const [isSpreadsheetEditMode, setIsSpreadsheetEditMode] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(() => {
    return localStorage.getItem(LAST_SAVED_KEY) || new Date().toISOString();
  });

  // Line notification config and logs
  const [lineConfig, setLineConfig] = useState<LineNotificationConfig>(loadLineConfig);
  const [logs, setLogs] = useState<NotificationLog[]>(loadNotificationLogs);
  const [isSendingSummary, setIsSendingSummary] = useState<boolean>(false);

  // Toast feedback state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch saved data from backend server on mount
  useEffect(() => {
    fetch('/api/routing')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.items) && data.items.length > 0) {
          // If localStorage has no custom unsaved override, use server data
          const localRaw = localStorage.getItem(STORAGE_KEY);
          if (!localRaw) {
            setItems(data.items);
            if (data.updatedAt) {
              setLastSavedAt(data.updatedAt);
              localStorage.setItem(LAST_SAVED_KEY, data.updatedAt);
            }
          }
        }
      })
      .catch(() => {
        // Offline / fallback to localStorage
      });
  }, []);

  // Always keep localStorage synced so user never loses typed numbers on refresh
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist items to localStorage', e);
    }
  }, [items]);

  const showToast = (
    message: string,
    type: 'success' | 'info' | 'error' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleRefreshLogs = () => {
    setLogs(loadNotificationLogs());
  };

  // Save all items to backend server & localStorage
  const persistItemsToServer = async (
    itemsToSave: RoutingItem[],
    silent = false
  ) => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsToSave));
      const res = await fetch('/api/routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToSave }),
      });
      const data = await res.json();
      const savedTime = data?.updatedAt || new Date().toISOString();
      setLastSavedAt(savedTime);
      localStorage.setItem(LAST_SAVED_KEY, savedTime);
      setHasUnsavedChanges(false);

      if (!silent) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.15 },
        });
        showToast('บันทึกข้อมูลตัวเลขทั้งหมดลงบนเว็บเรียบร้อยแล้ว', 'success');
      }
    } catch (err) {
      const savedTime = new Date().toISOString();
      setLastSavedAt(savedTime);
      localStorage.setItem(LAST_SAVED_KEY, savedTime);
      setHasUnsavedChanges(false);
      if (!silent) {
        showToast('บันทึกข้อมูลลงเบราว์เซอร์เรียบร้อยแล้ว', 'success');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Direct cell edit from table
  const handleQuickUpdateCell = (
    itemId: string,
    fieldPath: string,
    value: number | string,
    autoSyncStd = true,
    autoSyncCycleMc = true
  ) => {
    setItems((prevItems) => {
      const nextItems = prevItems.map((item) => {
        if (item.id !== itemId) return item;

        const clone: RoutingItem = JSON.parse(JSON.stringify(item));
        const parts = fieldPath.split('.');
        let current: any = clone;

        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) current[parts[i]] = {};
          current = current[parts[i]];
        }
        const lastKey = parts[parts.length - 1];
        current[lastKey] = value;

        // If user edited station mcTime or cycleTime and autoSyncCycleMc is on, sync them
        if (autoSyncCycleMc && parts[0] !== 'std' && typeof value === 'number') {
          if (lastKey === 'mcTime' && current.cycleTime !== undefined) {
            current.cycleTime = value;
          } else if (lastKey === 'cycleTime' && current.mcTime !== undefined) {
            current.mcTime = value;
          }
        }

        // If user edited std.mcTime or std.laborTime, recalculate std.total
        if (parts[0] === 'std') {
          clone.std.total = round(
            (Number(clone.std.mcTime) || 0) + (Number(clone.std.laborTime) || 0),
            4
          );
        }

        // Auto-recalculate row SUM (Labor, MC, Total)
        const sums = calculateItemSums(clone);
        clone.sum = sums;

        // If user edited a station field and autoSyncStd is enabled, keep STD in sync with SUM
        if (
          autoSyncStd &&
          (parts[0] === 'fg' || parts[0] === 'cab' || parts[0] === 'door')
        ) {
          clone.std = {
            mcTime: round(sums.mcTime, 4),
            laborTime: round(sums.laborTime, 4),
            total: round(sums.total, 4),
          };
        }

        clone.updatedAt = new Date().toISOString();

        // Check if bottleneck exceeded
        if (
          lineConfig.notifyOnBottleneck &&
          sums.total > lineConfig.bottleneckThresholdSec
        ) {
          const msg = formatBottleneckAlertMessage(
            clone,
            'Total Cycle Time',
            sums.total,
            lineConfig.bottleneckThresholdSec
          );
          sendLineNotification(msg, lineConfig, 'BOTTLENECK', clone.model).then(
            () => {
              handleRefreshLogs();
            }
          );
        }

        return clone;
      });

      return nextItems;
    });

    setHasUnsavedChanges(true);
  };

  // Sync a single row's STD with its calculated SUM
  const handleSyncRowStdWithSum = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          std: {
            mcTime: round(item.sum.mcTime, 4),
            laborTime: round(item.sum.laborTime, 4),
            total: round(item.sum.total, 4),
          },
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setHasUnsavedChanges(true);
    showToast('ปรับค่า STD ให้ตรงกับผลรวม SUM แล้ว', 'info');
  };

  // Add / Edit Model Save from Modal
  const handleSaveItem = async (
    item: RoutingItem,
    shouldSendLineAlert: boolean
  ) => {
    const isNew = !items.some((i) => i.id === item.id);
    const updatedList = isNew
      ? [...items, item]
      : items.map((i) => (i.id === item.id ? item : i));

    setItems(updatedList);
    await persistItemsToServer(updatedList, false);

    // Trigger LINE Alert if requested
    if (shouldSendLineAlert || (lineConfig.enabled && lineConfig.notifyOnEdit)) {
      const msg = formatRoutingUpdateMessage(
        item,
        isNew ? 'CREATE' : 'UPDATE'
      );
      const res = await sendLineNotification(
        msg,
        lineConfig,
        'UPDATE',
        item.model
      );
      handleRefreshLogs();
      if (res.simulated) {
        showToast(
          'จำลองการแจ้งเตือน LINE สำเร็จ (กรอก Token ในแท็บ LINE เพื่อส่งจริง)',
          'info'
        );
      } else if (res.success) {
        showToast('ส่งแจ้งเตือนเข้า LINE เรียบร้อยแล้ว', 'success');
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;

    const updatedList = items.filter((i) => i.id !== id);
    setItems(updatedList);
    await persistItemsToServer(updatedList, true);
    showToast(`ลบโมเดล ${target.model} และบันทึกแล้ว`, 'info');

    if (lineConfig.enabled && lineConfig.notifyOnEdit) {
      const msg = formatRoutingUpdateMessage(target, 'DELETE');
      sendLineNotification(msg, lineConfig, 'UPDATE', target.model).then(() => {
        handleRefreshLogs();
      });
    }
  };

  const handleDuplicateItem = async (item: RoutingItem) => {
    const duplicated: RoutingItem = {
      ...JSON.parse(JSON.stringify(item)),
      id: `route-${Date.now()}`,
      no: items.length + 1,
      model: `${item.model} (Copy)`,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [...items, duplicated];
    setItems(updatedList);
    await persistItemsToServer(updatedList, true);
    showToast(`คัดลอกโมเดล ${item.model} และบันทึกแล้ว`, 'success');
  };

  // Send Line Summary broadcast
  const handleSendLineSummary = async () => {
    setIsSendingSummary(true);
    const summaryMsg = formatDailySummaryMessage(items);
    const res = await sendLineNotification(
      summaryMsg,
      lineConfig,
      'DAILY_REPORT'
    );
    setIsSendingSummary(false);
    handleRefreshLogs();

    if (res.success) {
      confetti({ particleCount: 50, spread: 70 });
      showToast(
        res.simulated
          ? 'ส่งสรุปในโหมดจำลองสำเร็จ'
          : 'ส่งรายงานสรุปเข้า LINE เรียบร้อยแล้ว!',
        'success'
      );
    } else {
      showToast(res.message || 'ส่งข้อความไม่สำเร็จ', 'error');
    }
  };

  // Single model send to LINE from drawer
  const handleSendModelToLine = async (item: RoutingItem) => {
    const msg = formatRoutingUpdateMessage(item, 'UPDATE');
    const res = await sendLineNotification(msg, lineConfig, 'UPDATE', item.model);
    handleRefreshLogs();
    if (res.success) {
      showToast(
        res.simulated
          ? 'ส่งข้อมูลโมเดลเข้า LINE (โหมดจำลอง) สำเร็จ'
          : 'ส่งเข้า LINE สำเร็จ',
        'success'
      );
    }
  };

  // Reset to original dataset from Data 001.jpg
  const handleResetData = async () => {
    setItems(INITIAL_ROUTING_DATA);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ROUTING_DATA));
    try {
      await fetch('/api/routing/reset', { method: 'POST' });
    } catch {
      // ignore if offline
    }
    setHasUnsavedChanges(false);
    setLastSavedAt(new Date().toISOString());
    showToast('รีเซ็ตข้อมูลกลับสู่ค่าเริ่มต้นตามเอกสาร Data 001 สำเร็จ', 'success');
  };

  // Export CSV
  const handleExport = () => {
    exportToCSV(
      items,
      `Routing_By_Line_Plant9771_${new Date().toISOString().slice(0, 10)}.csv`
    );
    showToast('ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว', 'success');
  };

  // Import CSV
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const imported = parseCSV(text);
        if (imported.length > 0) {
          setItems(imported);
          await persistItemsToServer(imported, false);
          showToast(
            `นำเข้าและบันทึกข้อมูลสำเร็จ ${imported.length} รายการ`,
            'success'
          );
        } else {
          showToast('ไม่พบข้อมูลที่ถูกต้องในไฟล์ CSV', 'error');
        }
      } catch (err) {
        showToast('เกิดข้อผิดพลาดในการประมวลผลไฟล์ CSV', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Hidden file input for CSV import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".csv,.txt"
        className="hidden"
      />

      {/* Application Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddNew={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        onSaveAll={() => persistItemsToServer(items, false)}
        onSendLineSummary={handleSendLineSummary}
        onExport={handleExport}
        onImportClick={() => fileInputRef.current?.click()}
        onResetData={handleResetData}
        itemCount={items.length}
        plantId="9771"
        isSendingSummary={isSendingSummary}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSavedAt={lastSavedAt}
        isSpreadsheetEditMode={isSpreadsheetEditMode}
        setIsSpreadsheetEditMode={setIsSpreadsheetEditMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5">
        {activeTab === 'table' && (
          <RoutingTable
            items={items}
            onEditItem={(item) => {
              setEditingItem(item);
              setIsModalOpen(true);
            }}
            onDeleteItem={handleDeleteItem}
            onDuplicateItem={handleDuplicateItem}
            onQuickUpdateCell={handleQuickUpdateCell}
            onSyncRowStdWithSum={handleSyncRowStdWithSum}
            onSelectModelForDetail={(item) => setDetailItem(item)}
            onSaveAll={() => persistItemsToServer(items, false)}
            onAddNew={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
            isSpreadsheetEditMode={isSpreadsheetEditMode}
            setIsSpreadsheetEditMode={setIsSpreadsheetEditMode}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            items={items}
            onSelectModel={(item) => {
              setActiveTab('table');
              setDetailItem(item);
            }}
          />
        )}

        {activeTab === 'notifications' && (
          <LineNotificationModal
            config={lineConfig}
            onUpdateConfig={(newConfig) => {
              setLineConfig(newConfig);
              saveLineConfig(newConfig);
              showToast('บันทึกการตั้งค่า LINE สำเร็จ', 'success');
            }}
            logs={logs}
            onRefreshLogs={handleRefreshLogs}
            items={items}
          />
        )}
      </main>

      {/* Floating Unsaved Changes Action Bar */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-5 py-3 rounded-xl bg-slate-900/95 border-2 border-emerald-500 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-slate-100">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
            <span>มีการแก้ไขตัวเลขในตาราง — กดปุ่มบันทึกเพื่อยืนยันข้อมูลลงบนเว็บ</span>
          </div>
          <button
            onClick={() => persistItemsToServer(items, false)}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลเดี๋ยวนี้ (Save)'}
          </button>
        </div>
      )}

      {/* Model Add / Edit Modal */}
      <RoutingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        editingItem={editingItem}
        totalItems={items.length}
      />

      {/* Model Detailed Drawer */}
      <ModelDetailDrawer
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={(item) => {
          setDetailItem(null);
          setEditingItem(item);
          setIsModalOpen(true);
        }}
        onSendLine={handleSendModelToLine}
        onDuplicate={handleDuplicateItem}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs text-slate-100">
          {toast.type === 'success' && (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          {toast.type === 'info' && (
            <Info className="h-4 w-4 text-cyan-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Industrial Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 mt-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Plant 9771 Industrial Engineering · Line Balancing & Routing Management System
          </div>
          <div className="flex items-center gap-3">
            <span>Precision: Standard Cycle Math</span>
            <span>·</span>
            <span>Web Server & Local Persistence Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
