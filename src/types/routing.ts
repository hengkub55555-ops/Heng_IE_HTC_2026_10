export interface StationTiming {
  mcTime: number;      // Machine time (s)
  laborTime: number;   // Labor time (s)
  cycleTime: number;   // Process / Cycle time (s)
}

export interface RoutingItem {
  id: string;
  no: number;
  plant: string;
  model: string;
  note?: string;

  // Standard Timing (STD)
  std: {
    mcTime: number;
    laborTime: number;
    total: number;
  };

  // Finished Goods Assembly (FG)
  fg: StationTiming;

  // Cabinet Assembly (CAB)
  cab: {
    r: StationTiming;  // CAB R
    f: StationTiming;  // CAB F
  };

  // Door Assembly Lines (DOOR)
  door: {
    veg: StationTiming;
    fb: StationTiming;
    fl: StationTiming;
    fr: StationTiming;
    rl: StationTiming;
    rrIn: StationTiming;
    rrOut: StationTiming;
    rrDnd?: StationTiming;
  };

  // Summary (SUM)
  sum: {
    laborTime: number;
    mcTime: number;
    total: number;
  };

  updatedAt: string;
  lastEditedBy?: string;
}

export interface StationDefinition {
  id: string;
  group: 'STD' | 'FG' | 'CAB' | 'DOOR' | 'SUM';
  subGroup?: string;
  name: string;
  labelTh: string;
  color: string;
}

export interface RoutingMetrics {
  totalModels: number;
  avgStdTotal: number;
  avgSumTotal: number;
  avgLaborTime: number;
  avgMcTime: number;
  balancedCount: number;
  discrepancyCount: number;
  maxCycleModel: { model: string; time: number };
  minCycleModel: { model: string; time: number };
  bottleneckStation: { name: string; avgTime: number };
}

export interface LineNotificationConfig {
  enabled: boolean;
  token: string;
  webhookUrl: string;
  channelName: string;
  notifyOnEdit: boolean;
  notifyOnBottleneck: boolean;
  bottleneckThresholdSec: number;
  taktTimeSec: number;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  type: 'UPDATE' | 'BOTTLENECK' | 'DAILY_REPORT' | 'TEST' | 'IMPORT' | 'ALERT';
  title: string;
  message: string;
  status: 'SUCCESS' | 'SIMULATED' | 'FAILED';
  targetModel?: string;
  responseInfo?: string;
  details?: string;
}

export interface FilterOptions {
  search: string;
  plant: string;
  balanceStatus: 'ALL' | 'BALANCED' | 'DISCREPANCY';
  sortBy: 'no' | 'model' | 'stdTotal' | 'sumTotal' | 'laborTime' | 'mcTime';
  sortOrder: 'asc' | 'desc';
}
