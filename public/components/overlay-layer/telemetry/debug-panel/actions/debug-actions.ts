// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Debug Panel - Debug Actions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getOverlayLayer, addEvent, clearEventLog as clearLog, isVisible from ../state.js
//   refresh from ../ui/renderer.js
//
// PROVIDES:
//   logEvent() — exported function
//   clearEventLog() — exported function
//   closeAll() — exported function
//   scanOrphans() — exported function
//   exportInfo() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getOverlayLayer, addEvent, clearEventLog as clearLog, isVisible } from '../state.js';
import { refresh } from '../ui/renderer.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.telemetry.debug-panel.actions.debug-actions';

// ============================================================================
// EVENT LOGGING
// ============================================================================

/**
 * Registra evento no log
 * @param {string} type
 * @param {Object} data
 */
export function logEvent(type: DynObj, data: DynObj) {
  data = data || {};
  
  addEvent({
    type,
    id: data.id || null,
    action: data.action || null,
    timestamp: Date.now()
  });
  
  if (isVisible()) refresh();
}

/**
 * Limpa log de eventos
 * @returns {Object}
 */
export function clearEventLog() {
  clearLog();
  if (isVisible()) refresh();
  return { ok: true };
}

// ============================================================================
// DEBUG ACTIONS
// ============================================================================

/**
 * Fecha todos os overlays
 */
export function closeAll() {
  const overlayLayer = getOverlayLayer();
  
  if (overlayLayer && overlayLayer.closeAll) {
    overlayLayer.closeAll({ reason: 'debug-panel' });
    logEvent('DEBUG_ACTION', { action: 'closeAll' });
  }
}

/**
 * Escaneia overlays órfãos
 */
export function scanOrphans() {
  const overlayLayer = getOverlayLayer();
  
  if (overlayLayer && overlayLayer.scanOrphans) {
    const result = overlayLayer.scanOrphans();
    const orphanCount = (result && result.orphans && result.orphans.length) || 0;
    
    logEvent('DEBUG_ACTION', { action: 'scanOrphans', orphans: orphanCount });
    
    if (orphanCount > 0) {
      console.log('[OverlayDebug] Orphans found:', result.orphans);
    }
  }
}

/**
 * Exporta informações para console
 */
export function exportInfo() {
  const overlayLayer = getOverlayLayer();
  
  if (overlayLayer && overlayLayer.info) {
    const info = overlayLayer.info();
    console.log('[OverlayDebug] Full Info:', JSON.stringify(info, null, 2));
    logEvent('DEBUG_ACTION', { action: 'exportInfo' });
  }
}

export default {
  logEvent,
  clearEventLog,
  closeAll,
  scanOrphans,
  exportInfo
};
