// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Debug Panel - Styles
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   PANEL_STYLES — exported value
//   injectStyles() — exported function
//   removeStyles() — exported function
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

export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.telemetry.debug-panel.styles';

export const PANEL_STYLES = '\
  .overlay-debug-panel {\
    position: fixed;\
    z-index: 99999;\
    font-family: "Monaco", "Consolas", monospace;\
    font-size: 11px;\
    background: rgba(0, 0, 0, 0.92);\
    color: #0f0;\
    border: 1px solid #0f0;\
    border-radius: 4px;\
    max-width: 420px;\
    max-height: 500px;\
    overflow: hidden;\
    box-shadow: 0 4px 20px rgba(0, 255, 0, 0.2);\
    transition: all 0.2s ease;\
  }\
  .overlay-debug-panel.collapsed {\
    max-height: 32px;\
    overflow: hidden;\
  }\
  .overlay-debug-panel.bottom-right { bottom: 10px; right: 10px; }\
  .overlay-debug-panel.bottom-left { bottom: 10px; left: 10px; }\
  .overlay-debug-panel.top-right { top: 10px; right: 10px; }\
  .overlay-debug-panel.top-left { top: 10px; left: 10px; }\
  .overlay-debug-header {\
    background: rgba(0, 255, 0, 0.1);\
    padding: 6px 10px;\
    cursor: pointer;\
    display: flex;\
    justify-content: space-between;\
    align-items: center;\
    border-bottom: 1px solid rgba(0, 255, 0, 0.2);\
  }\
  .overlay-debug-header:hover { background: rgba(0, 255, 0, 0.2); }\
  .overlay-debug-title { font-weight: bold; }\
  .overlay-debug-status { font-size: 10px; opacity: 0.8; }\
  .overlay-debug-body {\
    padding: 8px;\
    overflow-y: auto;\
    max-height: 460px;\
  }\
  .overlay-debug-section {\
    margin-bottom: 10px;\
    padding-bottom: 8px;\
    border-bottom: 1px solid rgba(0, 255, 0, 0.1);\
  }\
  .overlay-debug-section:last-child { border-bottom: none; margin-bottom: 0; }\
  .overlay-debug-section-title {\
    color: #0ff;\
    font-weight: bold;\
    margin-bottom: 4px;\
    font-size: 10px;\
    text-transform: uppercase;\
  }\
  .overlay-debug-row {\
    display: flex;\
    justify-content: space-between;\
    padding: 2px 0;\
  }\
  .overlay-debug-label { opacity: 0.7; }\
  .overlay-debug-value { font-weight: bold; }\
  .overlay-debug-value.healthy { color: #0f0; }\
  .overlay-debug-value.degraded { color: #ff0; }\
  .overlay-debug-value.unhealthy { color: #f00; }\
  .overlay-debug-stack-item {\
    background: rgba(0, 255, 0, 0.05);\
    padding: 4px 6px;\
    margin: 2px 0;\
    border-radius: 2px;\
    font-size: 10px;\
  }\
  .overlay-debug-event {\
    font-size: 10px;\
    padding: 2px 0;\
    opacity: 0.8;\
  }\
  .overlay-debug-event-time { color: #666; margin-right: 6px; }\
  .overlay-debug-event-type { color: #0ff; }\
  .overlay-debug-actions {\
    display: flex;\
    gap: 4px;\
    margin-top: 8px;\
  }\
  .overlay-debug-btn {\
    background: rgba(0, 255, 0, 0.1);\
    border: 1px solid #0f0;\
    color: #0f0;\
    padding: 4px 8px;\
    font-size: 10px;\
    cursor: pointer;\
    border-radius: 2px;\
  }\
  .overlay-debug-btn:hover { background: rgba(0, 255, 0, 0.2); }\
';

/**
 * Injeta estilos no documento
 */
export function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('overlay-debug-styles')) return;
  
  const styleEl = document.createElement('style');
  styleEl.id = 'overlay-debug-styles';
  styleEl.textContent = PANEL_STYLES;
  document.head.appendChild(styleEl);
}

/**
 * Remove estilos do documento
 */
export function removeStyles() {
  if (typeof document === 'undefined') return;
  
  const styleEl = document.getElementById('overlay-debug-styles');
  if (styleEl) styleEl.remove();
}

export default {
  PANEL_STYLES,
  injectStyles,
  removeStyles
};
