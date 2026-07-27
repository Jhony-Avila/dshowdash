// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-status/utils/helpers
// PURPOSE: Panel Status - Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   generateId() — exported function
//   sleep() — exported function
//   deepClone() — exported function
//   isEmpty() — exported function
//   determineLevel() — exported function
//   aggregateStatuses() — exported function
//   sortStatusesByLevel() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-status/utils/helpers';

export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
export const deepClone = <T>(obj: T): T => { if (!obj) return obj; return JSON.parse(JSON.stringify(obj)); };
export const isEmpty = (obj: unknown) => { if (!obj) return true; if (Array.isArray(obj)) return obj.length === 0; if (typeof obj === 'object') return Object.keys(obj as object).length === 0; return false; };

export const determineLevel = (value: number, thresholds: { error?: number; warning?: number } | null) => {
  if (!thresholds) return 'unknown';
  if (value >= (thresholds.error || 90)) return 'error';
  if (value >= (thresholds.warning || 70)) return 'warning';
  return 'ok';
};

export const aggregateStatuses = (statuses: Record<string, Record<string, unknown>>) => {
  const values = Object.values(statuses || {});
  if (values.length === 0) return { total: 0, ok: 0, warning: 0, error: 0, unknown: 0, level: 'unknown' };
  const counts: Record<string, number> = { total: values.length, ok: 0, warning: 0, error: 0, unknown: 0 };
  values.forEach((s: Record<string, unknown>) => { const lvl = (s.level as string) || 'unknown'; counts[lvl] = (counts[lvl] || 0) + 1; });
  const level = counts.error > 0 ? 'error' : counts.warning > 0 ? 'warning' : counts.ok > 0 ? 'ok' : 'unknown';
  return { ...counts, level };
};

export const sortStatusesByLevel = (statuses: Record<string, Record<string, unknown>>) => {
  const order: Record<string, number> = { error: 0, warning: 1, unknown: 2, ok: 3 };
  return Object.entries(statuses).sort((a, b) => (order[a[1].level as string] ?? 2) - (order[b[1].level as string] ?? 2));
};

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });

export default { generateId, sleep, deepClone, isEmpty, determineLevel, aggregateStatuses, sortStatusesByLevel };
