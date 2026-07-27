// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: zoom-controls
// PURPOSE: Zoom Manager - Zoom Controls
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ZOOM_PRESETS from ../constants.js
//   getConfig, getContainer, getContent, getCurrentZoom from ../state.js
//   applyZoom from ./zoom-apply.js
//
// PROVIDES:
//   setZoom() — exported function
//   zoomIn() — exported function
//   zoomOut() — exported function
//   zoomTo() — exported function
//   zoomToFit() — exported function
//   zoomToFill() — exported function
//   zoomToActual() — exported function
//   resetZoom() — exported function
//   setMinZoom() — exported function
//   setMaxZoom() — exported function
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

import { ZOOM_PRESETS } from '../constants.js';
import { getConfig, getContainer, getContent, getCurrentZoom } from '../state.js';
import { applyZoom } from './zoom-apply.js';

export const VERSION = '1.1.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'main.ui.container-main.utils.zoom-manager.core.zoom-controls';

// ============================================================================
// ZOOM CONTROLS
// ============================================================================

/**
 * Define o zoom
 * @param {number} zoom - Nível de zoom
 * @param {Object} options - { origin, animate }
 * @returns {number}
 */
export function setZoom(zoom: number, options: Record<string, unknown>) {
  options = options || {};
  const origin = options.origin || null;
  const animate = options.animate !== false;
  return applyZoom(zoom, (origin as Record<string, unknown>), animate);
}

/**
 * Aumenta o zoom
 * @param {number} amount - Quantidade (opcional)
 * @returns {number}
 */
export function zoomIn(amount: number) {
  const config = getConfig();
  if (amount === undefined) amount = config.zoomStep;
  return applyZoom(getCurrentZoom() + amount);
}

/**
 * Diminui o zoom
 * @param {number} amount - Quantidade (opcional)
 * @returns {number}
 */
export function zoomOut(amount: number) {
  const config = getConfig();
  if (amount === undefined) amount = config.zoomStep;
  return applyZoom(getCurrentZoom() - amount);
}

/**
 * Zoom para um preset
 * @param {string|number} preset
 * @returns {number}
 */
export function zoomTo(preset: unknown) {
  switch (preset) {
    case ZOOM_PRESETS.FIT:
      return zoomToFit();
    case ZOOM_PRESETS.FILL:
      return zoomToFill();
    case ZOOM_PRESETS.ACTUAL:
      return zoomToActual();
    default:
      if (typeof preset === 'number') {
        return applyZoom(preset);
      }
      return getCurrentZoom();
  }
}

/**
 * Zoom para caber no container
 * @returns {number}
 */
export function zoomToFit() {
  const container = getContainer();
  const content = getContent();
  if (!container || !content) return getCurrentZoom();
  
  const containerRect = container.getBoundingClientRect();
  
  // Reset transform para pegar dimensões reais
  const originalTransform = content.style.transform;
  content.style.transform = 'none';
  const realContentRect = content.getBoundingClientRect();
  content.style.transform = originalTransform;

  const scaleX = containerRect.width / realContentRect.width;
  const scaleY = containerRect.height / realContentRect.height;
  const fitZoom = Math.min(scaleX, scaleY, 1);

  return applyZoom(fitZoom);
}

/**
 * Zoom para preencher o container
 * @returns {number}
 */
export function zoomToFill() {
  const container = getContainer();
  const content = getContent();
  if (!container || !content) return getCurrentZoom();

  const containerRect = container.getBoundingClientRect();

  // Reset transform para pegar dimensões reais
  const originalTransform = content.style.transform;
  content.style.transform = 'none';
  const realContentRect = content.getBoundingClientRect();
  content.style.transform = originalTransform;

  const scaleX = containerRect.width / realContentRect.width;
  const scaleY = containerRect.height / realContentRect.height;
  const fillZoom = Math.max(scaleX, scaleY);

  return applyZoom(fillZoom);
}

/**
 * Zoom para 100%
 * @returns {number}
 */
export function zoomToActual() {
  return applyZoom(1.0);
}

/**
 * Reseta zoom para o padrão
 * @returns {number}
 */
export function resetZoom() {
  const config = getConfig();
  return applyZoom(config.defaultZoom);
}

/**
 * Define zoom mínimo
 * @param {number} min
 */
export function setMinZoom(min: number) {
  const config = getConfig();
  (config as any).minZoom = Math.max(0.1, min);
  if (getCurrentZoom() < config.minZoom) {
    applyZoom(config.minZoom);
  }
}

/**
 * Define zoom máximo
 * @param {number} max
 */
export function setMaxZoom(max: number) {
  const config = getConfig();
  (config as any).maxZoom = Math.min(10, max);
  if (getCurrentZoom() > config.maxZoom) {
    applyZoom(config.maxZoom);
  }
}

export default {
  setZoom,
  zoomIn,
  zoomOut,
  zoomTo,
  zoomToFit,
  zoomToFill,
  zoomToActual,
  resetZoom,
  setMinZoom,
  setMaxZoom
};
