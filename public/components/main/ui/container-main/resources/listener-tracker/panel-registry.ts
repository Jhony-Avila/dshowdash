// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-registry
// PURPOSE: Listener Panel Registry
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

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.listener-tracker.panel-registry';

export function createPanelRegistry() {
  // Registry: panelId -> panel data
  const _panelListeners = new Map();

  return {
    // Obtém ou cria registry do painel
    getOrCreate(panelId: string) {
      if (!_panelListeners.has(panelId)) {
        _panelListeners.set(panelId, {
          listeners: new Map(),
          timers: new Map(),
          intervals: new Map(),
          observers: new Map(),
          rafs: new Map(),
          createdAt: Date.now(),
          lastActivity: Date.now()
        });
      }
      return _panelListeners.get(panelId);
    },

    // Obtém registry existente
    get(panelId: string) {
      return _panelListeners.get(panelId) || null;
    },

    // Verifica se existe
    has(panelId: string) {
      return _panelListeners.has(panelId);
    },

    // Remove registry
    delete(panelId: string) {
      return _panelListeners.delete(panelId);
    },

    // Itera sobre todos
    forEach(callback: (...args: unknown[]) => void) {
      _panelListeners.forEach(callback);
    },

    // Contagem de painéis
    size() {
      return _panelListeners.size;
    },

    // Limpa tudo
    clear() {
      _panelListeners.clear();
    },

    // Atualiza lastActivity
    updateActivity(panelId: string) {
      const registry = _panelListeners.get(panelId);
      if (registry) {
        registry.lastActivity = Date.now();
      }
    }
  };
}

export default { createPanelRegistry };
