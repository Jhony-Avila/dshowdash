// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: query-methods
// PURPOSE: Listener Query Methods
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createQueryMethods() — exported function
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

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.listener-tracker.query-methods';

export function createQueryMethods(options: Record<string, any> = {}) {
  const { panelRegistry } = options;

  return {
    // Obtém contagem de listeners por painel
    getCount(panelId: string) {
      const registry = panelRegistry.get(panelId);
      if (!registry) return null;

      return {
        listeners: registry.listeners.size,
        timers: registry.timers.size,
        intervals: registry.intervals.size,
        observers: registry.observers.size,
        rafs: registry.rafs.size,
        total: registry.listeners.size + registry.timers.size + 
               registry.intervals.size + registry.observers.size + registry.rafs.size
      };
    },

    // Obtém detalhes de listeners de um painel
    getDetails(panelId: string) {
      const registry = panelRegistry.get(panelId);
      if (!registry) return null;

      return {
        panelId,
        createdAt: registry.createdAt,
        lastActivity: registry.lastActivity,
        listeners: Array.from(registry.listeners.values()),
        timers: Array.from(registry.timers.values()),
        intervals: Array.from(registry.intervals.values()),
        observers: Array.from(registry.observers.values()),
        rafs: Array.from(registry.rafs.values())
      };
    },

    // Lista todos os painéis rastreados
    listPanels() {
      const panels: unknown[] = [];
      panelRegistry.forEach((registry: Record<string, unknown>, panelId: string) => {
        panels.push({
          panelId,
          counts: this.getCount(panelId),
          lastActivity: registry.lastActivity
        });
      });
      return panels;
    },

    // Obtém total de listeners ativos
    getTotalActive() {
      let total = 0;
      panelRegistry.forEach((registry: Record<string, Map<string, unknown>>) => {
        total += registry.listeners.size + registry.timers.size +
                 registry.intervals.size + registry.observers.size + registry.rafs.size;
      });
      return total;
    }
  };
}

export default { createQueryMethods };
