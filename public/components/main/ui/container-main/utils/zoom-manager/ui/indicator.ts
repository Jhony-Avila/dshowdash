// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: indicator
// PURPOSE: Zoom Manager - UI Indicator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getZoomIndicator, setZoomIndicator, getIndicatorTimeout, setIndicatorTimeout ...
//
// PROVIDES:
//   showZoomIndicator() — exported function
//   removeZoomIndicator() — exported function
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
  getZoomIndicator, 
  setZoomIndicator,
  getIndicatorTimeout,
  setIndicatorTimeout
} from '../state.js';

export const VERSION = '1.1.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'main.ui.container-main.utils.zoom-manager.ui.indicator';

// ============================================================================
// INDICATOR UI
// ============================================================================

/**
 * Cria elemento do indicador
 */
function createZoomIndicator() {
  let indicator = getZoomIndicator();
  if (indicator) return;
  
  // @ts-expect-error TS migration - TS2352
  indicator = document.createElement('div') as Record<string, unknown>;
  indicator.className = 'dsd-zoom-indicator';
  indicator.innerHTML = '\
    <style>\
      .dsd-zoom-indicator {\
        position: fixed;\
        bottom: 80px;\
        left: 50%;\
        transform: translateX(-50%) translateY(20px);\
        background: rgba(0, 0, 0, 0.8);\
        color: white;\
        padding: 8px 16px;\
        border-radius: 20px;\
        font-size: 14px;\
        font-weight: 600;\
        font-family: system-ui, sans-serif;\
        pointer-events: none;\
        opacity: 0;\
        transition: opacity 0.2s ease, transform 0.2s ease;\
        z-index: 10000;\
        backdrop-filter: blur(8px);\
      }\
      .dsd-zoom-indicator--visible {\
        opacity: 1;\
        transform: translateX(-50%) translateY(0);\
      }\
    </style>\
  ';
  
  // @ts-expect-error TS migration - TS2345
  document.body.appendChild(indicator);
  // @ts-expect-error TS migration - TS2345
  setZoomIndicator(indicator);
}

/**
 * Mostra indicador de zoom
 * @param {number} zoom - Nível de zoom
 */
export function showZoomIndicator(zoom: number) {
  let indicator = getZoomIndicator();
  
  if (!indicator) {
    createZoomIndicator();
    indicator = getZoomIndicator();
  }
  
  const percentage = Math.round(zoom * 100);
  indicator!.textContent = `${percentage}%`;
  ((indicator!.classList as Record<string, unknown>).add as (...args: unknown[]) => unknown)('dsd-zoom-indicator--visible');
  
  const timeout = getIndicatorTimeout();
  // @ts-expect-error TS migration - TS2769
  if (timeout) clearTimeout(timeout);
  
  // @ts-expect-error TS migration - TS2345
  setIndicatorTimeout(setTimeout(() => {
    // @ts-expect-error TS migration - TS2554
    (indicator.classList as HTMLElement).remove('dsd-zoom-indicator--visible');
  }, 1500));
}

/**
 * Remove indicador do DOM
 */
export function removeZoomIndicator() {
  const indicator = getZoomIndicator();
  const timeout = getIndicatorTimeout();
  
  // @ts-expect-error TS migration - TS2769
  if (timeout) clearTimeout(timeout);
  if (indicator) (indicator.remove as (...args: unknown[]) => unknown)();
  
  // @ts-expect-error strict migration — TS2345
  setZoomIndicator(null);
  // @ts-expect-error strict migration — TS2345
  setIndicatorTimeout(null);
}

export default {
  showZoomIndicator,
  removeZoomIndicator
};
