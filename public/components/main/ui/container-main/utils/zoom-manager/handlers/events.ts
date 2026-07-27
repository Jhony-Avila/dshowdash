// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: events
// PURPOSE: Zoom Manager - Event Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, getCurrentZoom, isPinching, setPinching, getInitialPinchDistance, ...
//   applyZoom from ../core/zoom-apply.js
//
// PROVIDES:
//   handleWheel() — exported function
//   handleTouchStart() — exported function
//   handleTouchMove() — exported function
//   handleTouchEnd() — exported function
//   handleDoubleClick() — exported function
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

import { 
  getConfig, 
  getCurrentZoom,
  isPinching,
  setPinching,
  getInitialPinchDistance,
  setInitialPinchDistance,
  getInitialPinchZoom,
  setInitialPinchZoom,
  incrementMetric
} from '../state.js';
import { applyZoom } from '../core/zoom-apply.js';

export const VERSION = '1.1.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'main.ui.container-main.utils.zoom-manager.handlers.events';

// ============================================================================
// TOUCH HELPERS
// ============================================================================

/**
 * Calcula distância entre dois toques
 * @param {TouchList} touches
 * @returns {number}
 */
function getPinchDistance(touches: unknown) {
  // @ts-expect-error TS migration - TS2339
  const dx = (touches as Record<string, unknown>)[0].clientX - (touches as Record<string, unknown>)[1].clientX;
  // @ts-expect-error TS migration - TS2339
  const dy = (touches as Record<string, unknown>)[0].clientY - (touches as Record<string, unknown>)[1].clientY;
  return Math.hypot(dx, dy);
}

/**
 * Calcula centro entre dois toques
 * @param {TouchList} touches
 * @returns {Object}
 */
function getPinchCenter(touches: unknown) {
  return {
    // @ts-expect-error TS migration - TS2339
    x: ((touches as Record<string, unknown>)[0].clientX + (touches as Record<string, unknown>)[1].clientX) / 2,
    // @ts-expect-error TS migration - TS2339
    y: ((touches as Record<string, unknown>)[0].clientY + (touches as Record<string, unknown>)[1].clientY) / 2
  };
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handler para scroll wheel
 * @param {WheelEvent} e
 */
export function handleWheel(e: Event) {
  const config = getConfig();
  
  // Verifica tecla modificadora
  const modifierMap = {
    // @ts-expect-error TS migration - TS2339
    ctrl: e.ctrlKey,
    // @ts-expect-error TS migration - TS2339
    alt: e.altKey,
    // @ts-expect-error TS migration - TS2339
    shift: e.shiftKey,
    none: true
  };
  const modifierPressed = modifierMap[config.scrollZoomModifier];
  
  if (!modifierPressed) return;
  
  e.preventDefault();
  
  // @ts-expect-error TS migration - TS2339
  const delta = e.deltaY > 0 ? -config.zoomStep : config.zoomStep;
  const newZoom = getCurrentZoom() + delta;
  
  // @ts-expect-error TS migration - TS2339
  const origin = { x: e.clientX, y: e.clientY };
  applyZoom(newZoom, origin, false);
  incrementMetric('scrollZooms');
}

/**
 * Handler para início de toque
 * @param {TouchEvent} e
 */
export function handleTouchStart(e: Event) {
  const config = getConfig();
  
  // @ts-expect-error TS migration - TS2339
  if (e.touches.length === 2 && config.enablePinchZoom) {
    setPinching(true);
    // @ts-expect-error TS migration - TS2339
    setInitialPinchDistance(getPinchDistance(e.touches));
    setInitialPinchZoom(getCurrentZoom());
  }
}

/**
 * Handler para movimento de toque
 * @param {TouchEvent} e
 */
export function handleTouchMove(e: Event) {
  // @ts-expect-error TS migration - TS2339
  if (!isPinching() || e.touches.length !== 2) return;
  
  e.preventDefault();
  
  // @ts-expect-error TS migration - TS2339
  const currentDistance = getPinchDistance(e.touches);
  const scale = currentDistance / getInitialPinchDistance();
  const newZoom = getInitialPinchZoom() * scale;
  
  // @ts-expect-error TS migration - TS2339
  const origin = getPinchCenter(e.touches);
  applyZoom(newZoom, origin, false);
  incrementMetric('pinchZooms');
}

/**
 * Handler para fim de toque
 * @param {TouchEvent} e
 */
export function handleTouchEnd(e: Event) {
  // @ts-expect-error TS migration - TS2339
  if (e.touches.length < 2) {
    setPinching(false);
  }
}

/**
 * Handler para double-click
 * @param {MouseEvent} e
 */
export function handleDoubleClick(e: Event) {
  const config = getConfig();
  
  if (!config.enableDoubleClickZoom) return;
  
  e.preventDefault();
  
  const currentZoom = getCurrentZoom();
  const targetZoom = currentZoom >= config.defaultZoom + config.doubleClickZoomAmount
    ? config.defaultZoom
    : currentZoom + config.doubleClickZoomAmount;
  
  // @ts-expect-error TS migration - TS2339
  const origin = { x: e.clientX, y: e.clientY };
  applyZoom(targetZoom, origin, true);
}

export default {
  handleWheel,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleDoubleClick
};
