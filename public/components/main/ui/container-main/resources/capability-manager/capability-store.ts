// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: capability-store
// PURPOSE: Capability Store - Armazenamento de capacidades
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createCapabilityStore() — exported function
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
export const MODULE_ID = 'main.ui.container-main.resources.capability-manager.capability-store';


export function createCapabilityStore() {
  // Registry de capacidades por painel
  const _panelCapabilities = new Map();
  
  // Contagem de capacidades ativas por tipo
  const _activeCapabilityCounts = new Map();
  
  // Histórico de requests
  const _requestHistory: unknown[] = [];

  return {
    // Panel record management
    getPanelRecord(panelId: string) {
      if (!_panelCapabilities.has(panelId)) {
        _panelCapabilities.set(panelId, new Map());
      }
      return _panelCapabilities.get(panelId);
    },

    hasPanelRecord(panelId: string) {
      return _panelCapabilities.has(panelId);
    },

    deletePanelRecord(panelId: string) {
      return _panelCapabilities.delete(panelId);
    },

    getAllPanels() {
      return _panelCapabilities;
    },

    getPanelCount() {
      return _panelCapabilities.size;
    },

    // Capability counts
    getCapabilityCount(capability: string) {
      return _activeCapabilityCounts.get(capability) || 0;
    },

    incrementCapabilityCount(capability: string) {
      const current = _activeCapabilityCounts.get(capability) || 0;
      _activeCapabilityCounts.set(capability, current + 1);
    },

    decrementCapabilityCount(capability: string) {
      const current = _activeCapabilityCounts.get(capability) || 0;
      _activeCapabilityCounts.set(capability, Math.max(0, current - 1));
    },

    getActiveCapabilityCounts() {
      const counts: Record<string, unknown> = {};
      _activeCapabilityCounts.forEach((count, cap) => {
        counts[cap] = count;
      });
      return counts;
    },

    // History management
    // @ts-expect-error strict migration — TS2322
    logRequest(panelId: string, capability: string, action: string, status: string, reason: string = null) {
      const entry = {
        panelId,
        capability,
        action,
        status,
        reason,
        timestamp: Date.now()
      };
      _requestHistory.push(entry);
      if (_requestHistory.length > 1000) _requestHistory.shift();
      return entry;
    },

    getHistory(limit = 100) {
      return _requestHistory.slice(-limit);
    },

    // Clear all
    clear() {
      _panelCapabilities.clear();
      _activeCapabilityCounts.clear();
      _requestHistory.length = 0;
    }
  };
}

export default { createCapabilityStore };
