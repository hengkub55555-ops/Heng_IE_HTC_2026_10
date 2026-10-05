import { RoutingItem } from '../types/routing';
import { calculateItemSums } from './calculations';

export const exportToCSV = (items: RoutingItem[], filename = 'Routing_By_Line_Data.csv') => {
  const headers = [
    'NO.',
    'Plant',
    'Model',
    'Note',
    'STD_MC_time',
    'STD_Labor_time',
    'STD_Total',
    'FG_MC_time',
    'FG_Labor_time',
    'FG_Cycle_time',
    'CAB_R_MC_time',
    'CAB_R_Labor_time',
    'CAB_R_Cycle_time',
    'CAB_F_MC_time',
    'CAB_F_Labor_time',
    'CAB_F_Cycle_time',
    'DOOR_VEG_MC_time',
    'DOOR_VEG_Labor_time',
    'DOOR_VEG_Cycle_time',
    'DOOR_FB_MC_time',
    'DOOR_FB_Labor_time',
    'DOOR_FB_Cycle_time',
    'DOOR_FL_MC_time',
    'DOOR_FL_Labor_time',
    'DOOR_FL_Cycle_time',
    'DOOR_FR_MC_time',
    'DOOR_FR_Labor_time',
    'DOOR_FR_Cycle_time',
    'DOOR_RL_MC_time',
    'DOOR_RL_Labor_time',
    'DOOR_RL_Cycle_time',
    'DOOR_RR_In_MC_time',
    'DOOR_RR_In_Labor_time',
    'DOOR_RR_In_Cycle_time',
    'DOOR_RR_Out_MC_time',
    'DOOR_RR_Out_Labor_time',
    'DOOR_RR_Out_Cycle_time',
    'DOOR_RR_DND_MC_time',
    'DOOR_RR_DND_Labor_time',
    'DOOR_RR_DND_Cycle_time',
    'SUM_Labor_time',
    'SUM_MC_time',
    'SUM_Total',
  ];

  const rows = items.map((i) => [
    i.no,
    `"${i.plant}"`,
    `"${i.model.replace(/"/g, '""')}"`,
    `"${(i.note || '').replace(/"/g, '""')}"`,
    i.std.mcTime,
    i.std.laborTime,
    i.std.total,
    i.fg.mcTime,
    i.fg.laborTime,
    i.fg.cycleTime,
    i.cab.r.mcTime,
    i.cab.r.laborTime,
    i.cab.r.cycleTime,
    i.cab.f.mcTime,
    i.cab.f.laborTime,
    i.cab.f.cycleTime,
    i.door.veg.mcTime,
    i.door.veg.laborTime,
    i.door.veg.cycleTime,
    i.door.fb.mcTime,
    i.door.fb.laborTime,
    i.door.fb.cycleTime,
    i.door.fl.mcTime,
    i.door.fl.laborTime,
    i.door.fl.cycleTime,
    i.door.fr.mcTime,
    i.door.fr.laborTime,
    i.door.fr.cycleTime,
    i.door.rl.mcTime,
    i.door.rl.laborTime,
    i.door.rl.cycleTime,
    i.door.rrIn.mcTime,
    i.door.rrIn.laborTime,
    i.door.rrIn.cycleTime,
    i.door.rrOut.mcTime,
    i.door.rrOut.laborTime,
    i.door.rrOut.cycleTime,
    i.door.rrDnd?.mcTime || 0,
    i.door.rrDnd?.laborTime || 0,
    i.door.rrDnd?.cycleTime || 0,
    i.sum.laborTime,
    i.sum.mcTime,
    i.sum.total,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSV = (csvText: string): RoutingItem[] => {
  const lines = csvText
    .split(/\r\n|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  // Parse CSV line handling quotes
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const headerRow = parseLine(lines[0]).map((h) => h.toLowerCase().trim());
  const items: RoutingItem[] = [];

  for (let rowIndex = 1; rowIndex < lines.length; rowIndex++) {
    const cols = parseLine(lines[rowIndex]);
    if (cols.length < 3) continue;

    const getNum = (index: number) => {
      if (index >= cols.length) return 0;
      const val = parseFloat(cols[index]);
      return isNaN(val) ? 0 : val;
    };

    const no = parseInt(cols[0], 10) || rowIndex;
    const plant = cols[1]?.replace(/^"|"$/g, '') || '9771';
    const model = cols[2]?.replace(/^"|"$/g, '') || `Model-${rowIndex}`;
    const note = cols[3]?.replace(/^"|"$/g, '') || '';

    const stdMc = getNum(4);
    const stdLabor = getNum(5);
    const stdTotal = getNum(6) || stdMc + stdLabor;

    const item: Partial<RoutingItem> = {
      id: `imported-${Date.now()}-${rowIndex}`,
      no,
      plant,
      model,
      note,
      std: { mcTime: stdMc, laborTime: stdLabor, total: stdTotal },
      fg: { mcTime: getNum(7), laborTime: getNum(8), cycleTime: getNum(9) || getNum(7) },
      cab: {
        r: { mcTime: getNum(10), laborTime: getNum(11), cycleTime: getNum(12) || getNum(10) },
        f: { mcTime: getNum(13), laborTime: getNum(14), cycleTime: getNum(15) || getNum(13) },
      },
      door: {
        veg: { mcTime: getNum(16), laborTime: getNum(17), cycleTime: getNum(18) || getNum(16) },
        fb: { mcTime: getNum(19), laborTime: getNum(20), cycleTime: getNum(21) || getNum(19) },
        fl: { mcTime: getNum(22), laborTime: getNum(23), cycleTime: getNum(24) || getNum(22) },
        fr: { mcTime: getNum(25), laborTime: getNum(26), cycleTime: getNum(27) || getNum(25) },
        rl: { mcTime: getNum(28), laborTime: getNum(29), cycleTime: getNum(30) || getNum(28) },
        rrIn: { mcTime: getNum(31), laborTime: getNum(32), cycleTime: getNum(33) || getNum(31) },
        rrOut: { mcTime: getNum(34), laborTime: getNum(35), cycleTime: getNum(36) || getNum(34) },
        rrDnd: { mcTime: getNum(37), laborTime: getNum(38), cycleTime: getNum(39) || getNum(37) },
      },
      updatedAt: new Date().toISOString(),
    };

    const computedSums = calculateItemSums(item);
    item.sum = {
      laborTime: getNum(40) || computedSums.laborTime,
      mcTime: getNum(41) || computedSums.mcTime,
      total: getNum(42) || computedSums.total,
    };

    items.push(item as RoutingItem);
  }

  return items;
};
