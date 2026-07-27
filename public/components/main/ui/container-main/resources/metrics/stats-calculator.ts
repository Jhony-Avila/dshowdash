// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: stats-calculator
// PURPOSE: Metrics Stats Calculator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   calculateStats() — exported function
//   aggregateByPeriod() — exported function
//   calculateRate() — exported function
//   movingAverage() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.length
//   window.reduce
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.metrics.stats-calculator';

// Calcula estatísticas de uma série de valores
export function calculateStats(values: number[]) {
  if (!values || values.length === 0) {
    return { min: 0, max: 0, avg: 0, sum: 0, count: 0, p50: 0, p95: 0, p99: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a: number, b: number) => a + b, 0);
  const count = values.length;

  return {
    min: sorted[0],
    max: sorted[count - 1],
    avg: sum / count,
    sum,
    count,
    p50: sorted[Math.floor(count * 0.5)],
    p95: sorted[Math.floor(count * 0.95)],
    p99: sorted[Math.floor(count * 0.99)]
  };
}

// Agrega métricas por período
export function aggregateByPeriod(entries: Array<{ timestamp: number; value: number }>, period: number) {
  const buckets = new Map<number, number[]>();

  entries.forEach((entry) => {
    const bucketTime = Math.floor(entry.timestamp / period) * period;
    
    if (!buckets.has(bucketTime)) {
      buckets.set(bucketTime, []);
    }
    // @ts-expect-error strict migration — TS2532
    buckets.get(bucketTime).push(entry.value);
  });

  const aggregated: unknown[] = [];
  buckets.forEach((values, time) => {
    aggregated.push({
      timestamp: time,
      stats: calculateStats(values)
    });
  });

  return aggregated.sort((a, b) => (a as Record<string, number>).timestamp - (b as Record<string, number>).timestamp);
}

// Calcula taxa de variação
export function calculateRate(entries: Array<{ timestamp: number; value: number }>, windowMs = 60000) {
  if (!entries || entries.length < 2) return 0;

  const now = Date.now();
  const windowStart = now - windowMs;
  const inWindow = entries.filter((e) => e.timestamp >= windowStart);

  if (inWindow.length < 2) return 0;

  const first = inWindow[0];
  const last = inWindow[inWindow.length - 1];
  const timeDiff = (last.timestamp - first.timestamp) / 1000; // segundos

  if (timeDiff === 0) return 0;
  return (last.value - first.value) / timeDiff;
}

// Calcula média móvel
export function movingAverage(entries: Array<{ timestamp: number; value: number }>, windowSize = 5) {
  if (!entries || entries.length === 0) return [];

  const result = [];
  for (let i = 0; i < entries.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const windowSlice = entries.slice(start, i + 1);
    const avg = windowSlice.reduce((sum: number, e) => sum + e.value, 0) / windowSlice.length;

    result.push({
      timestamp: entries[i].timestamp,
      value: avg,
      originalValue: entries[i].value
    });
  }

  return result;
}

export default {
  calculateStats,
  aggregateByPeriod,
  calculateRate,
  movingAverage
};
