// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Debug Panel - Panel UI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, getPanelElement, setPanelElement from ../state.js
//   injectStyles from ../styles.js
//
// PROVIDES:
//   createPanelElement() — exported function
//   ensurePanelElement() — exported function
//   removePanelElement() — exported function
//   updatePanelClasses() — exported function
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

import { getConfig, getPanelElement, setPanelElement } from '../state.js';
import { injectStyles } from '../styles.js';

export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.telemetry.debug-panel.ui.panel';

// ============================================================================
// PANEL CREATION
// ============================================================================

/**
 * Cria elemento do painel
 * @returns {HTMLElement}
 */
export function createPanelElement() {
  injectStyles();
  
  const config = getConfig();
  
  const panel = document.createElement('div');
  panel.id = 'overlay-debug-panel';
  panel.className = `overlay-debug-panel ${config.position}${config.collapsed ? ' collapsed' : ''}`;
  panel.style.opacity = String(config.opacity);
  
  return panel;
}

/**
 * Garante que o painel existe
 * @returns {HTMLElement}
 */
export function ensurePanelElement() {
  let panel = getPanelElement();
  
  if (!panel) {
    panel = createPanelElement();
    document.body.appendChild(panel);
    setPanelElement(panel);
  }
  
  return panel;
}

/**
 * Remove o painel do DOM
 */
export function removePanelElement() {
  const panel = getPanelElement();
  
  if (panel && panel.parentNode) {
    panel.parentNode.removeChild(panel);
  }
  
  // @ts-expect-error strict migration — TS2345
  setPanelElement(null);
}

/**
 * Atualiza classes do painel
 */
export function updatePanelClasses() {
  const panel = getPanelElement();
  const config = getConfig();
  
  if (panel) {
    panel.className = `overlay-debug-panel ${config.position}${config.collapsed ? ' collapsed' : ''}`;
    panel.style.opacity = String(config.opacity);
  }
}

export default {
  createPanelElement,
  ensurePanelElement,
  removePanelElement,
  updatePanelClasses
};
