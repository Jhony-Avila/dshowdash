// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.0-INTEGRATED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: metrics-facade
// PURPOSE: Metrics Facade
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createMetricsFacade() — exported function
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

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.kernel.facades.metrics-facade';

export function createMetricsFacade(registry: { get: (name: string) => Record<string, (...args: unknown[]) => unknown> | null }) {
  return {
    record(panelId: string, name: string, value: unknown, options: Record<string, unknown> = {}) {
      return registry.get('metrics')?.record(panelId, name, value, options) || null;
    },

    get(panelId: string, options: Record<string, unknown> = {}) {
      return registry.get('metrics')?.get(panelId, options) || [];
    },

    getStats(panelId: string, metricName: string, options: Record<string, unknown> = {}) {
      return registry.get('metrics')?.getStats(panelId, metricName, options) || null;
    },

    export(format: string) {
      return registry.get('metrics')?.export(format) || null;
    },

    import(data: Record<string, unknown>, options: Record<string, unknown>) {
      return registry.get('metrics')?.import(data, options);
    }
  };
}

export default { createMetricsFacade };
