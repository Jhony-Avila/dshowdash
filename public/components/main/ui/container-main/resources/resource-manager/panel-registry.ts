// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-registry
// PURPOSE: Resource Manager Panel Registry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createPanelRegistry() — exported function
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

export const VERSION = '2.1.0-EVENT-CONSTANTS';
export const MODULE_ID = 'main.ui.container-main.resources.resource-manager.panel-registry';

export function createPanelRegistry(options: Record<string, unknown> = {}) {
  const { emitter } = options;

  // Panel resource registry
  const _panelResources = new Map();

  return {
    // Obtém ou cria registro do painel
    getOrCreate(panelId: string) {
      if (!_panelResources.has(panelId)) {
        _panelResources.set(panelId, {
          resources: new Map(),
          memoryUsage: 0,
          createdAt: Date.now(),
          lastActivity: Date.now()
        });
      }
      return _panelResources.get(panelId);
    },

    // Obtém registro existente
    get(panelId: string) {
      return _panelResources.get(panelId) || null;
    },

    // Verifica se existe
    has(panelId: string) {
      return _panelResources.has(panelId);
    },

    // Remove registro
    delete(panelId: string) {
      return _panelResources.delete(panelId);
    },

    // Itera sobre todos
    forEach(callback: (...args: unknown[]) => void) {
      _panelResources.forEach(callback);
    },

    // Contagem
    size() {
      return _panelResources.size;
    },

    // Limpa tudo
    clear() {
      _panelResources.clear();
    },

    // Obtém estatísticas de todos os painéis
    getStats(throttledPanels: Set<string> | null) {
      const stats: Record<string, unknown> = {};
      _panelResources.forEach((record, panelId) => {
        stats[panelId] = {
          resources: record.resources.size,
          memoryUsage: record.memoryUsage,
          throttled: throttledPanels?.has(panelId) || false
        };
      });
      return stats;
    },

    // Atualiza atividade
    updateActivity(panelId: string) {
      const record = _panelResources.get(panelId);
      if (record) {
        record.lastActivity = Date.now();
      }
    },

    // Atualiza uso de memória
    updateMemory(panelId: string, delta: number) {
      const record = _panelResources.get(panelId);
      if (record) {
        record.memoryUsage += delta;
      }
    },

    // Obtém Map interno (para cleanup strategies)
    getMap() {
      return _panelResources;
    }
  };
}

export default { createPanelRegistry };
