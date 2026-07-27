// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: zoom-apply
// PURPOSE: Zoom Manager - Zoom Apply
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ZOOM_ORIGINS from ../constants.js
//   getConfig, getContent, getCurrentZoom, setCurrentZoom, getListeners, getMetri...
//   showZoomIndicator from ../ui/indicator.js
//
// PROVIDES:
//   clampZoom() — exported function
//   emit() — exported function
//   applyZoom() — exported function
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

import { ZOOM_ORIGINS } from '../constants.js';
import { 
  getConfig, 
  getContent, 
  getCurrentZoom, 
  setCurrentZoom,
  getListeners,
  getMetrics,
  incrementMetric,
  saveZoom
} from '../state.js';
import { showZoomIndicator } from '../ui/indicator.js';

export const VERSION = '1.1.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'main.ui.container-main.utils.zoom-manager.core.zoom-apply';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Limita zoom ao range configurado
 * @param {number} zoom
 * @returns {number}
 */
export function clampZoom(zoom: number) {
  const config = getConfig();
  return Math.max(config.minZoom, Math.min(config.maxZoom, zoom));
}

/**
 * Emite evento para listeners
 * @param {string} event
 * @param {Object} data
 */
export function emit(event: string, data: Record<string, unknown>) {
  const listeners = getListeners();
  const metrics = getMetrics();
  
  listeners.forEach(listener => {
    try {
      (listener as (...args: unknown[]) => unknown)({ type: event, data, timestamp: Date.now() });
    } catch (e) {
      metrics.errors++;
    }
  });
}

// ============================================================================
// MAIN ZOOM APPLICATION
// ============================================================================

/**
 * Aplica zoom ao conteúdo
 * @param {number} zoom - Nível de zoom
 * @param {Object} origin - Ponto de origem {x, y}
 * @param {boolean} animate - Animar transição
 * @returns {number} Zoom aplicado
 */
export function applyZoom(zoom: number, origin?: Record<string, unknown>, animate?: unknown) {
  if (animate === undefined) animate = true;
  
  const content = getContent();
  if (!content) return getCurrentZoom();
  
  const config = getConfig();
  const clampedZoom = clampZoom(zoom);
  const previousZoom = getCurrentZoom();
  setCurrentZoom(clampedZoom);
  
  // Calcula transform origin
  let transformOrigin = 'center center';
  if (origin && config.zoomOrigin === ZOOM_ORIGINS.CURSOR) {
    const rect = content.getBoundingClientRect();
    const x = (((origin.x as number) - rect.left) / rect.width) * 100;
    const y = (((origin.y as number) - rect.top) / rect.height) * 100;
    transformOrigin = `${x}% ${y}%`;

  } else if ((config.zoomOrigin as string) === ZOOM_ORIGINS.TOP_LEFT) {
    transformOrigin = 'top left';
  }
  
  content.style.transformOrigin = transformOrigin;
  
  if (animate && config.smoothZoom) {
    content.style.transition = `transform ${config.animationDuration}ms ease-out`;
  } else {
    content.style.transition = 'none';
  }
  
  content.style.transform = `scale(${clampedZoom})`;
  
  // Mostra indicador
  if (config.showZoomIndicator) {
    showZoomIndicator(clampedZoom);
  }
  
  incrementMetric('zoomChanges');
  saveZoom();
  
  emit('zoomChanged', { 
    zoom: clampedZoom, 
    previousZoom, 
    origin 
  });
  
  return clampedZoom;
}

export default {
  clampZoom,
  emit,
  applyZoom
};
