// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: throttle-controller
// PURPOSE: Resource Manager Throttle Controller
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   RESOURCE_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   createThrottleController() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   RESOURCE_EVENT_NAMES.PANEL_THROTTLED
//   RESOURCE_EVENT_NAMES.PANEL_UNTHROTTLED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { RESOURCE_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '2.1.0-EVENT-CONSTANTS';
export const MODULE_ID = 'main.ui.container-main.resources.resource-manager.throttle-controller';

export function createThrottleController(options: Record<string, any> = {}) {
  const { emitter } = options;

  // Throttled panels
  const _throttledPanels = new Set<string>();

  return {
    // Adiciona painel ao throttle
    throttle(panelId: string) {
      if (!_throttledPanels.has(panelId)) {
        _throttledPanels.add(panelId);
        emitter?.emit(RESOURCE_EVENT_NAMES.PANEL_THROTTLED, { panelId });
        return true;
      }
      return false;
    },

    // Remove painel do throttle
    unthrottle(panelId: string) {
      if (_throttledPanels.has(panelId)) {
        _throttledPanels.delete(panelId);
        emitter?.emit(RESOURCE_EVENT_NAMES.PANEL_UNTHROTTLED, { panelId });
        return true;
      }
      return false;
    },

    // Verifica se painel está throttled
    isThrottled(panelId: string) {
      return _throttledPanels.has(panelId);
    },

    // Lista painéis throttled
    getAll() {
      return Array.from(_throttledPanels);
    },

    // Contagem
    count() {
      return _throttledPanels.size;
    },

    // Obtém Set interno (para cleanup strategies)
    getSet() {
      return _throttledPanels;
    },

    // Limpa tudo
    clear() {
      _throttledPanels.clear();
    }
  };
}

export default { createThrottleController };
