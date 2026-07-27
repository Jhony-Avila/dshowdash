// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-09-ui-styles
// PURPOSE: Panel-09 UI Styles
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   injectStyles() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
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

export function injectStyles() {
  if (document.getElementById('p09-mega-styles')) return;
  const style = document.createElement('style');
  style.id = 'p09-mega-styles';
  style.textContent = `
    @keyframes p09-fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes p09-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    .p09-animate { animation: p09-fadeIn 0.3s ease-out; }
    .p09-tab:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99,102,241,0.2); }
    .p09-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
    .p09-tooltip { position: absolute; background: #1a1a24; border: 1px solid #3a3a4a; border-radius: 6px; padding: 8px 12px; font-size: 11px; color: #f0f0f5; z-index: 100; pointer-events: none; opacity: 0; transition: opacity 0.2s; }
    .p09-tooltip.visible { opacity: 1; }
    .p09-bar { transition: height 0.5s ease-out; }
    .p09-donut-segment { transition: stroke-dashoffset 0.8s ease-out; }
  `;
  document.head.appendChild(style);
}

export default { injectStyles };

export const MODULE_ID = 'panels-panel-09-ui-styles';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { stylesReady: true } }; }
