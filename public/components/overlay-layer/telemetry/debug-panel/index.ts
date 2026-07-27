// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   getConfig, setConfig, isVisible, setVisible,
//     setOverlayLayer, etc from ./state.js
//   removeStyles from ./styles.js
//   ensurePanelElement, removePanelElement from ./ui/panel.js
//   refresh from ./ui/renderer.js
//   logEvent, clearEventLog, closeAll,
//     scanOrphans, exportInfo from ./actions/debug-actions.js
//   healthCheck, info from ./diagnostics/health.js
//
// PROVIDES:
//   inject(), init(), destroy(), show(), hide(),
//   toggle(), toggleCollapse(), configure(),
//   isVisible(), logEvent(), clearEventLog(),
//   closeAll(), scanOrphans(), exportInfo(),
//   healthCheck(), info(), VERSION, MODULE_ID
//
// RECEIVES (via inject/init):
//   dependencies.overlayLayer — overlay layer reference
//
// BROWSER APIs (legítimo — debug panel):
//   document.addEventListener(keydown) — hotkey
//
// WINDOW ACCESS (legítimo — debug):
//   (window as any).__overlayDebugPanel — debug actions
// ═══════════════════════════════════════════════════════════════
// Overlay Layer - Debug Panel
// @version 1.0.0-ES6
// @description Painel de debug para diagnóstico de overlays em tempo real
// @sprint Sprint 4 - Melhoria #30
// @modularized true
'use strict';

// ============================================================================
// IMPORTS
// ============================================================================

import { VERSION, MODULE_ID } from './constants.js';
import {
  getConfig,
  setConfig,
  isVisible as _isVisible,
  setVisible,
  setOverlayLayer,
  getOverlayLayer,
  getPanelElement,
  setRefreshIntervalId,
  clearRefreshInterval,
  resetState
} from './state.js';

import { removeStyles } from './styles.js';
import { ensurePanelElement, removePanelElement, updatePanelClasses } from './ui/panel.js';
import { refresh } from './ui/renderer.js';
import { logEvent, clearEventLog, closeAll, scanOrphans, exportInfo } from './actions/debug-actions.js';
import { healthCheck, info } from './diagnostics/health.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


// ============================================================================
// DEPENDENCY INJECTION
// ============================================================================

/**
 * Injeta dependências
 * @param {Object} dependencies
 */
export function inject(dependencies: DynObj) {
  if (dependencies && dependencies.overlayLayer) {
    setOverlayLayer(dependencies.overlayLayer);
  }
}

// ============================================================================
// VISIBILITY CONTROL
// ============================================================================

/**
 * Mostra o painel
 * @returns {Object}
 */
export function show() {
  if (typeof document === 'undefined') {
    return { ok: false, error: 'no-document' };
  }
  
  const panel = ensurePanelElement();
  setVisible(true);
  panel.style.display = 'block';
  refresh();
  
  // Iniciar refresh automático
  const config = getConfig();
  if (config.refreshInterval > 0) {
    const intervalId = setInterval(refresh, config.refreshInterval);
    setRefreshIntervalId(intervalId);
  }
  
  return { ok: true };
}

/**
 * Esconde o painel
 * @returns {Object}
 */
export function hide() {
  setVisible(false);
  
  const panel = getPanelElement();
  if (panel) {
    panel.style.display = 'none';
  }
  
  clearRefreshInterval();
  
  return { ok: true };
}

/**
 * Toggle visibilidade
 * @returns {Object}
 */
export function toggle() {
  if (_isVisible()) {
    hide();
  } else {
    show();
  }
  return { ok: true, visible: _isVisible() };
}

/**
 * Toggle collapse
 * @returns {Object}
 */
export function toggleCollapse() {
  const config = getConfig();
  setConfig({ collapsed: !config.collapsed });
  
  const panel = getPanelElement();
  if (panel) {
    panel.classList.toggle('collapsed', getConfig().collapsed);
    refresh();
  }
  
  return { ok: true, collapsed: getConfig().collapsed };
}

// ============================================================================
// HOTKEY SETUP
// ============================================================================

/**
 * Setup hotkey listener
 */
function setupHotkey() {
  if (typeof document === 'undefined') return;
  
  document.addEventListener('keydown', e => {
    const config = getConfig();
    const hotkey = config.hotkey.toLowerCase();
    const keys = hotkey.split('+');
    
    const ctrlMatch = (keys.indexOf('ctrl') >= 0) === e.ctrlKey;
    const shiftMatch = (keys.indexOf('shift') >= 0) === e.shiftKey;
    const altMatch = (keys.indexOf('alt') >= 0) === e.altKey;
    
    let keyMatch = false;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (k !== 'ctrl' && k !== 'shift' && k !== 'alt') {
        if (e.key.toLowerCase() === k) {
          keyMatch = true;
          break;
        }
      }
    }
    
    if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
      e.preventDefault();
      toggle();
    }
  });
}

// ============================================================================
// LIFECYCLE
// ============================================================================

/**
 * Inicializa o painel
 * @param {Object} overlayLayerRef
 * @returns {Object}
 */
export function init(overlayLayerRef: DynObj) {
  if (overlayLayerRef) {
    setOverlayLayer(overlayLayerRef);
  }
  
  setupHotkey();
  
  // Expor globalmente para botões do painel
  if (typeof window !== 'undefined') {
    (window as any).__overlayDebugPanel = {
      toggle: toggleCollapse,
      closeAll,
      scanOrphans,
      exportInfo
    };
  }
  
  setConfig({ enabled: true });
  
  return { ok: true };
}

/**
 * Destrói o painel
 * @returns {Object}
 */
export function destroy() {
  hide();
  removePanelElement();
  removeStyles();
  
  if (typeof window !== 'undefined') {
    delete (window as any).__overlayDebugPanel;
  }
  
  setConfig({ enabled: false });
  resetState();
  
  return { ok: true };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Atualiza configuração
 * @param {Object} config
 * @returns {boolean}
 */
export function configure(config: DynObj) {
  if (!config || typeof config !== 'object') return false;
  
  setConfig(config);
  updatePanelClasses();
  
  return true;
}

/**
 * Verifica se está visível
 * @returns {boolean}
 */
export function isVisible() {
  return _isVisible();
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { VERSION, MODULE_ID };
export { logEvent, clearEventLog, closeAll, scanOrphans, exportInfo };
export { healthCheck, info };

export function getConfigExport() {
  return Object.assign({}, getConfig());
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  inject,
  init,
  destroy,
  show,
  hide,
  toggle,
  toggleCollapse,
  logEvent,
  clearEventLog,
  closeAll,
  scanOrphans,
  exportInfo,
  configure,
  getConfig: getConfigExport,
  isVisible,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
