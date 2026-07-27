// toolbar-wiring/wire-refresh.js
// @version 1.1.0-PAB-ES6
// @description Wiring do botão refresh via EventBus
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: getEventBus from ./helpers.js
// IMPORTS: PANEL_EVENT_NAMES from event-names.js
// PROVIDES: wireRefresh(toolbar, wired, failed, logger)
// ACTIONS: refresh
'use strict';

import { getEventBus } from './helpers.js';
import { PANEL_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.toolbar-wiring.wire-refresh';

/**
 * Conecta botão refresh — emite PANEL_EVENT_NAMES.REFRESH via EventBus
 * @param {object} toolbar - Instância da toolbar com registerAction
 * @param {Array} wired - Array de ações conectadas com sucesso
 * @param {Array} failed - Array de ações que falharam
 * @param {object} logger - Logger do módulo
 */
export async function wireRefresh(toolbar: Record<string, (...args: unknown[]) => unknown>, wired: string[], failed: string[], logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  try {
    toolbar.registerAction('refresh', () => {
      const eventBus = getEventBus();
      if (eventBus && eventBus.emit) {
        eventBus.emit(PANEL_EVENT_NAMES.REFRESH, { source: 'toolbar' });
      } else {
        logger.warn('EventBus indisponível para refresh');
      }
    });
    wired.push('refresh');
  } catch (e) {
    logger.warn('Refresh indisponível', { error: (e as Error).message });
    failed.push('refresh');
  }
}
