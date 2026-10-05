import { RoutingItem, RoutingMetrics } from '../types/routing';

export const round = (num: number, decimals: number = 3): number => {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
};

export const formatNumber = (val: number | undefined | null, decimals: number = 2): string => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  if (val === 0) return '0';
  // If integer, don't show trailing zeros unless decimals requested
  if (Number.isInteger(val)) return val.toLocaleString();
  return val.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

export const calculateItemSums = (item: Partial<RoutingItem>): {
  laborTime: number;
  mcTime: number;
  total: number;
} => {
  const fgLabor = item.fg?.laborTime || 0;
  const fgMc = item.fg?.mcTime || 0;

  const cabRLabor = item.cab?.r?.laborTime || 0;
  const cabRMc = item.cab?.r?.mcTime || 0;
  const cabFLabor = item.cab?.f?.laborTime || 0;
  const cabFMc = item.cab?.f?.mcTime || 0;

  const doorVegLabor = item.door?.veg?.laborTime || 0;
  const doorVegMc = item.door?.veg?.mcTime || 0;
  const doorFbLabor = item.door?.fb?.laborTime || 0;
  const doorFbMc = item.door?.fb?.mcTime || 0;
  const doorFlLabor = item.door?.fl?.laborTime || 0;
  const doorFlMc = item.door?.fl?.mcTime || 0;
  const doorFrLabor = item.door?.fr?.laborTime || 0;
  const doorFrMc = item.door?.fr?.mcTime || 0;
  const doorRlLabor = item.door?.rl?.laborTime || 0;
  const doorRlMc = item.door?.rl?.mcTime || 0;
  const doorRrInLabor = item.door?.rrIn?.laborTime || 0;
  const doorRrInMc = item.door?.rrIn?.mcTime || 0;
  const doorRrOutLabor = item.door?.rrOut?.laborTime || 0;
  const doorRrOutMc = item.door?.rrOut?.mcTime || 0;
  const doorRrDndLabor = item.door?.rrDnd?.laborTime || 0;
  const doorRrDndMc = item.door?.rrDnd?.mcTime || 0;

  const totalLabor =
    fgLabor +
    cabRLabor +
    cabFLabor +
    doorVegLabor +
    doorFbLabor +
    doorFlLabor +
    doorFrLabor +
    doorRlLabor +
    doorRrInLabor +
    doorRrOutLabor +
    doorRrDndLabor;

  const totalMc =
    fgMc +
    cabRMc +
    cabFMc +
    doorVegMc +
    doorFbMc +
    doorFlMc +
    doorFrMc +
    doorRlMc +
    doorRrInMc +
    doorRrOutMc +
    doorRrDndMc;

  return {
    laborTime: round(totalLabor, 4),
    mcTime: round(totalMc, 4),
    total: round(totalLabor + totalMc, 4),
  };
};

export const getVariance = (item: RoutingItem) => {
  const diffLabor = round(item.sum.laborTime - item.std.laborTime, 2);
  const diffMc = round(item.sum.mcTime - item.std.mcTime, 2);
  const diffTotal = round(item.sum.total - item.std.total, 2);
  const isBalanced = Math.abs(diffTotal) <= 1.0; // 1 second tolerance for rounding differences in legacy sheets

  return {
    diffLabor,
    diffMc,
    diffTotal,
    isBalanced,
  };
};

export interface StationBreakdown {
  id: string;
  name: string;
  line: 'FG' | 'CAB' | 'DOOR';
  mcTime: number;
  laborTime: number;
  totalTime: number;
}

export const getModelStations = (item: RoutingItem): StationBreakdown[] => {
  return [
    {
      id: 'fg',
      name: 'FG Main Assembly',
      line: 'FG',
      mcTime: item.fg.mcTime,
      laborTime: item.fg.laborTime,
      totalTime: item.fg.mcTime + item.fg.laborTime,
    },
    {
      id: 'cab_r',
      name: 'CAB Rear (R)',
      line: 'CAB',
      mcTime: item.cab.r.mcTime,
      laborTime: item.cab.r.laborTime,
      totalTime: item.cab.r.mcTime + item.cab.r.laborTime,
    },
    {
      id: 'cab_f',
      name: 'CAB Front (F)',
      line: 'CAB',
      mcTime: item.cab.f.mcTime,
      laborTime: item.cab.f.laborTime,
      totalTime: item.cab.f.mcTime + item.cab.f.laborTime,
    },
    {
      id: 'door_veg',
      name: 'DOOR Vegetable (VEG)',
      line: 'DOOR',
      mcTime: item.door.veg.mcTime,
      laborTime: item.door.veg.laborTime,
      totalTime: item.door.veg.mcTime + item.door.veg.laborTime,
    },
    {
      id: 'door_fb',
      name: 'DOOR Freezing Box (FB)',
      line: 'DOOR',
      mcTime: item.door.fb.mcTime,
      laborTime: item.door.fb.laborTime,
      totalTime: item.door.fb.mcTime + item.door.fb.laborTime,
    },
    {
      id: 'door_fl',
      name: 'DOOR Front Left (FL)',
      line: 'DOOR',
      mcTime: item.door.fl.mcTime,
      laborTime: item.door.fl.laborTime,
      totalTime: item.door.fl.mcTime + item.door.fl.laborTime,
    },
    {
      id: 'door_fr',
      name: 'DOOR Front Right (FR)',
      line: 'DOOR',
      mcTime: item.door.fr.mcTime,
      laborTime: item.door.fr.laborTime,
      totalTime: item.door.fr.mcTime + item.door.fr.laborTime,
    },
    {
      id: 'door_rl',
      name: 'DOOR Rear Left (RL)',
      line: 'DOOR',
      mcTime: item.door.rl.mcTime,
      laborTime: item.door.rl.laborTime,
      totalTime: item.door.rl.mcTime + item.door.rl.laborTime,
    },
    {
      id: 'door_rr_in',
      name: 'DOOR Rear Right In',
      line: 'DOOR',
      mcTime: item.door.rrIn.mcTime,
      laborTime: item.door.rrIn.laborTime,
      totalTime: item.door.rrIn.mcTime + item.door.rrIn.laborTime,
    },
    {
      id: 'door_rr_out',
      name: 'DOOR Rear Right Out',
      line: 'DOOR',
      mcTime: item.door.rrOut.mcTime,
      laborTime: item.door.rrOut.laborTime,
      totalTime: item.door.rrOut.mcTime + item.door.rrOut.laborTime,
    },
    ...(item.door.rrDnd
      ? [
          {
            id: 'door_rr_dnd',
            name: 'DOOR RR DND',
            line: 'DOOR' as const,
            mcTime: item.door.rrDnd.mcTime,
            laborTime: item.door.rrDnd.laborTime,
            totalTime: item.door.rrDnd.mcTime + item.door.rrDnd.laborTime,
          },
        ]
      : []),
  ];
};

export const getBottleneckStation = (item: RoutingItem) => {
  const stations = getModelStations(item);
  let maxStation = stations[0];

  for (const s of stations) {
    if (s.totalTime > maxStation.totalTime) {
      maxStation = s;
    }
  }

  return maxStation;
};

export const computeMetrics = (items: RoutingItem[]): RoutingMetrics => {
  if (items.length === 0) {
    return {
      totalModels: 0,
      avgStdTotal: 0,
      avgSumTotal: 0,
      avgLaborTime: 0,
      avgMcTime: 0,
      balancedCount: 0,
      discrepancyCount: 0,
      maxCycleModel: { model: '-', time: 0 },
      minCycleModel: { model: '-', time: 0 },
      bottleneckStation: { name: '-', avgTime: 0 },
    };
  }

  let totalStd = 0;
  let totalSum = 0;
  let totalLabor = 0;
  let totalMc = 0;
  let balanced = 0;
  let maxModel = items[0];
  let minModel = items[0];

  const stationTimeSums: Record<string, { name: string; sum: number; count: number }> = {};

  items.forEach((item) => {
    totalStd += item.std.total;
    totalSum += item.sum.total;
    totalLabor += item.sum.laborTime;
    totalMc += item.sum.mcTime;

    const diff = Math.abs(item.sum.total - item.std.total);
    if (diff <= 1.0) {
      balanced++;
    }

    if (item.sum.total > maxModel.sum.total) maxModel = item;
    if (item.sum.total < minModel.sum.total) minModel = item;

    const stations = getModelStations(item);
    stations.forEach((s) => {
      if (!stationTimeSums[s.id]) {
        stationTimeSums[s.id] = { name: s.name, sum: 0, count: 0 };
      }
      if (s.totalTime > 0) {
        stationTimeSums[s.id].sum += s.totalTime;
        stationTimeSums[s.id].count += 1;
      }
    });
  });

  let topStationName = 'FG Main Assembly';
  let topStationAvg = 0;

  Object.values(stationTimeSums).forEach((entry) => {
    const avg = entry.count > 0 ? entry.sum / entry.count : 0;
    if (avg > topStationAvg) {
      topStationAvg = avg;
      topStationName = entry.name;
    }
  });

  return {
    totalModels: items.length,
    avgStdTotal: round(totalStd / items.length, 1),
    avgSumTotal: round(totalSum / items.length, 1),
    avgLaborTime: round(totalLabor / items.length, 1),
    avgMcTime: round(totalMc / items.length, 1),
    balancedCount: balanced,
    discrepancyCount: items.length - balanced,
    maxCycleModel: { model: maxModel.model, time: maxModel.sum.total },
    minCycleModel: { model: minModel.model, time: minModel.sum.total },
    bottleneckStation: { name: topStationName, avgTime: round(topStationAvg, 1) },
  };
};
