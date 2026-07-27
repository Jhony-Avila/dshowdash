// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Debug Panel - Health & Diagnostics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ../constants.js
//   getConfig, getPanelElement, isVisible, getEventLog, getOverlayLayer from ../state.js
//
// PROVIDES:
//   healthCheck() — exported function
//   info() — exported function
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

import { VERSION, MODULE_ID } from '../constants.js';
import { getConfig, getPanelElement, isVisible, getEventLog, getOverlayLayer } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Health check do módulo
 * @returns {Object}
 */
export function healthCheck() {
  const config = getConfig();
  const panel = getPanelElement();
  const visible = isVisible();
  const eventLog = getEventLog();
  const overlayLayer = getOverlayLayer();
  
  const checks = {
    enabled: config.enabled,
    overlayLayerInjected: !!overlayLayer,
    panelCreated: !!panel || !visible
  };
  
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if ((checks as DynObj)[keys[i]]) passed++;
  }
  const total = keys.length;
  
  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${total}`,
    checks,
    visible,
    eventLogSize: eventLog.length,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

// ============================================================================
// INFO
// ============================================================================

/**
 * Informações do módulo
 * @returns {Object}
 */
export function info() {
  const config = getConfig();
  const eventLog = getEventLog();
  
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: config.enabled,
    visible: isVisible(),
    collapsed: config.collapsed,
    position: config.position,
    hotkey: config.hotkey,
    eventLogSize: eventLog.length,
    timestamp: Date.now()
  };
}

export default {
  healthCheck,
  info
};
