// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-observability/utils/helpers
// PURPOSE: Panel Observability - Helpers
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
//   calculateHealthScore() — exported function
//   determineOverallHealth() — exported function
//   groupModulesByStatus() — exported function
//   sortModulesByHealth() — exported function
//   filterRecentErrors() — exported function
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
export const MODULE_ID = 'panel-observability/utils/helpers';

export function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 9); }
export function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
export function deepClone<T>(obj: T): T { if (!obj) return obj; return JSON.parse(JSON.stringify(obj)); }
export function isEmpty(obj: unknown): boolean { if (!obj) return true; if (Array.isArray(obj)) return obj.length === 0; if (typeof obj === 'object') return Object.keys(obj as object).length === 0; return false; }

export function calculateHealthScore(modules: Record<string, unknown>): number {
  if (!modules || isEmpty(modules)) return 0;
  const entries = Object.entries(modules);

  const healthy = entries.filter(([, m]) => (m as Record<string, unknown>)?.status === 'HEALTHY').length;
  return Math.round((healthy / entries.length) * 100);
}

export function determineOverallHealth(modules: Record<string, unknown>): string {
  if (!modules || isEmpty(modules)) return 'unknown';
  const entries = Object.values(modules);

  const unhealthy = entries.filter(m => (m as Record<string, unknown>)?.status === 'UNHEALTHY').length;
  const degraded = entries.filter(m => (m as Record<string, unknown>)?.status === 'DEGRADED').length;
  if (unhealthy > 0) return 'UNHEALTHY';
  if (degraded > 0) return 'DEGRADED';
  return 'HEALTHY';
}

export function groupModulesByStatus(modules: Record<string, unknown>): Record<string, unknown[]> {
  if (!modules) return { HEALTHY: [], DEGRADED: [], UNHEALTHY: [], unknown: [] };
  return Object.entries(modules).reduce((acc: Record<string, unknown[]>, [name, data]) => {
    const status = (data as Record<string, unknown>)?.status as string || 'unknown';
    if (!acc[status]) acc[status] = [];
    acc[status].push({ name, ...(data as Record<string, unknown>) });
    return acc;
  }, { HEALTHY: [], DEGRADED: [], UNHEALTHY: [], unknown: [] });
}

export function sortModulesByHealth(modules: Record<string, unknown>): [string, unknown][] {
  const order: Record<string, number> = { UNHEALTHY: 0, DEGRADED: 1, unknown: 2, HEALTHY: 3 };
  return Object.entries(modules).sort((a, b) => (order[((a[1] as Record<string, unknown>)?.status as string) || 'unknown'] ?? 2) - (order[((b[1] as Record<string, unknown>)?.status as string) || 'unknown'] ?? 2));
}

export function filterRecentErrors(errors: Array<{ timestamp: number }>, minutes = 60): Array<{ timestamp: number }> {
  const cutoff = Date.now() - (minutes * 60 * 1000);
  return errors.filter((e: { timestamp: number }) => e.timestamp > cutoff);
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { generateId, sleep, deepClone, isEmpty, calculateHealthScore, determineOverallHealth, groupModulesByStatus, sortModulesByHealth, filterRecentErrors };
