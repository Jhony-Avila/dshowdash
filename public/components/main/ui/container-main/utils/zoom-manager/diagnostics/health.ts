// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: health
// PURPOSE: Zoom Manager - Health & Diagnostics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, ZOOM_PRESETS, ZOOM_ORIGINS from ../constants.js
//   getConfig, getContainer, getContent, getCurrentZoom, isInitialized, getMetric...
//
// PROVIDES:
//   healthCheck() — exported function
//   info() — exported function
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

import { VERSION, MODULE_ID, ZOOM_PRESETS, ZOOM_ORIGINS } from '../constants.js';
import { 
  getConfig, 
  getContainer, 
  getContent, 
  getCurrentZoom, 
  isInitialized,
  getMetrics
} from '../state.js';

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Health check do módulo
 * @returns {Object}
 */
export function healthCheck() {
  const config = getConfig();
  const currentZoom = getCurrentZoom();
  const metrics = getMetrics();
  
  const checks = {
    initialized: isInitialized(),
    hasContainer: !!getContainer(),
    hasContent: !!getContent(),
    zoomInRange: currentZoom >= config.minZoom && currentZoom <= config.maxZoom,
    noErrors: metrics.errors === 0
  };
  
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if ((checks as Record<string, unknown>)[keys[i]]) passed++;
  }
  const total = keys.length;
  
  let status = 'UNHEALTHY';
  if (passed === total) status = 'HEALTHY';
  else if (passed >= 3) status = 'DEGRADED';
  
  return {
    status,
    score: `${passed}/${total}`,
    checks,
    currentZoom,
    zoomRange: { min: config.minZoom, max: config.maxZoom },
    metrics: {
      zoomChanges: metrics.zoomChanges,
      pinchZooms: metrics.pinchZooms,
      scrollZooms: metrics.scrollZooms,
      errors: metrics.errors
    },
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
  const currentZoom = getCurrentZoom();
  
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    presets: [ZOOM_PRESETS.FIT, ZOOM_PRESETS.FILL, ZOOM_PRESETS.ACTUAL, ZOOM_PRESETS.CUSTOM],
    origins: [ZOOM_ORIGINS.CENTER, ZOOM_ORIGINS.CURSOR, ZOOM_ORIGINS.TOP_LEFT],
    config: {
      minZoom: config.minZoom,
      maxZoom: config.maxZoom,
      defaultZoom: config.defaultZoom,
      zoomStep: config.zoomStep,
      enablePinchZoom: config.enablePinchZoom,
      enableScrollZoom: config.enableScrollZoom,
      scrollZoomModifier: config.scrollZoomModifier
    },
    isInitialized: isInitialized(),
    currentZoom,
    percentage: `${Math.round(currentZoom * 100)}%`
  };
}

export default {
  healthCheck,
  info
};
