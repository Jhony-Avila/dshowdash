// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Runtime Integration - Mode Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID from ../constants.js
//   createLogger from /assets/js/core/logger-global/index.js
//   * as DegradationPolicy from ../../degradation-policy.js
//
// PROVIDES:
//   handleModeChange() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).OverlayKernel
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MODULE_ID } from '../constants.js';
import { createLogger } from '/assets/js/core/logger-global/index.js';
import {
  getCurrentMode,
  setCurrentMode,
  setLastModeChange,
  incrementMetric,
  getEventBus
} from '../state.js';
import * as DegradationPolicy from '../../degradation-policy.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0-ELEVATION';

const _logger = createLogger(MODULE_ID);

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function _emit(eventName: string, data: DynObj) {
  const eventBus = getEventBus();
  if (eventBus && eventBus.emit) {
    eventBus.emit(eventName, Object.assign({
      source: MODULE_ID,
      timestamp: Date.now()
    }, data || {}));
  }
}

function _log(level: DynObj, message: string, data?: DynObj) {
  const context = data ? { data } : {};
  if (level === 'error') _logger.error(message, context);
  else if (level === 'warn') _logger.warn(message, context);
  else _logger.debug(message, context);
}

// ============================================================================
// MODE CHANGE HANDLER
// ============================================================================

/**
 * Processa mudança de modo do runtime
 * @param {string} newMode
 * @param {string} previousMode
 */
export function handleModeChange(newMode: DynObj, previousMode: DynObj) {
  previousMode = previousMode || getCurrentMode();

  setCurrentMode(newMode);
  setLastModeChange(Date.now());
  incrementMetric('modeChanges');

  _log('info', `Runtime mode changed: ${previousMode} -> ${newMode}`);

  // Emitir evento de mudança de modo para o Overlay Kernel
  _emit('overlay-kernel.mode-change', {
    newMode,
    previousMode,
    policy: DegradationPolicy.getPolicyForMode(newMode)
  });

  // Verificar se há overlays que precisam ser fechados
  _closeOverlaysForMode(newMode);

  // Emitir evento de degradação se aplicável
  if (newMode === 'DEGRADED' || newMode === 'MAINTENANCE' || newMode === 'FAILED') {
    _emit('overlay-kernel.degradation-active', {
      mode: newMode,
      message: DegradationPolicy.getModeMessage(newMode),
      allowedTypes: DegradationPolicy.getAllowedTypesForMode(newMode)
    });
  }
}

/**
 * Fecha overlays que não são permitidos no modo atual
 * @param {string} mode
 */
function _closeOverlaysForMode(mode: DynObj) {
  if (typeof window === 'undefined' || !(window as any).OverlayKernel) return;

  const stackResult = (window as any).OverlayKernel.listStack();
  if (!stackResult.ok || stackResult.data.stack.length === 0) return;

  const toClose = DegradationPolicy.getOverlaysToForceClose(mode, stackResult.data.stack);

  for (let i = 0; i < toClose.length; i++) {
    const item = toClose[i];
    _log('info', `Force closing overlay due to mode change: ${item.id}`);
    (window as any).OverlayKernel.close(item.id);
    incrementMetric('degradationEvents');
  }
}

export default {
  handleModeChange
};
