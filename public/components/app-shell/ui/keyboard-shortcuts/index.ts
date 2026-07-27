
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   VERSION, MODULE_ID, MODIFIER_KEYS, SHORTCUT_SCOPES
//     from ./constants.js
//   isEnabled, setEnabled, getConfig, updateConfig,
//     getSubscribers, resetState from ./state.js
//   register, unregister, unregisterGroup, registerMany,
//     get, getAll, getByGroup, getGroupList, isRegistered,
//     setShortcutEnabled from ./core/registration.js
//   setScope, restoreScope, getScope from ./core/scope.js
//   trigger, initKeyboardListener,
//     removeKeyboardListener from ./core/trigger.js
//   showHelp, hideHelp from ./ui/help-panel.js
//   getMetrics, healthCheck, info from ./diagnostics/health.js
//
// PROVIDES:
//   register(), unregister(), unregisterGroup(),
//   registerMany(), setScope(), restoreScope(), getScope(),
//   enable(), disable(), isEnabled(), setEnabled(),
//   get(), getAll(), getByGroup(), getGroups(),
//   isRegistered(), trigger(), showHelp(), hideHelp(),
//   configure(), getConfig(), subscribe(), destroy(),
//   getMetrics(), healthCheck(), info(),
//   VERSION, MODULE_ID, MODIFIER_KEYS, SCOPES
//
// BROWSER APIs (legítimo — keyboard listener):
//   document — initKeyboardListener auto-init
// ═══════════════════════════════════════════════════════════════
// App Shell Keyboard Shortcuts - Orchestrator
// @version 1.0.0-P2-ENTERPRISE
// @description Sprint 7 Fase 2: Melhoria #20 - API de Shortcuts Customizaveis
// @modularized true
'use strict';

// ============================================================================
// IMPORTS
// ============================================================================

import { VERSION, MODULE_ID, MODIFIER_KEYS, SHORTCUT_SCOPES } from './constants.js';
import { 
  isEnabled as _isEnabled, 
  setEnabled as _setEnabled,
  getConfig as _getConfig,
  updateConfig,
  getSubscribers,
  resetState
} from './state.js';

import {
  register as _register,
  unregister,
  unregisterGroup,
  registerMany as _registerMany,
  get,
  getAll,
  getByGroup,
  getGroupList,
  isRegistered,
  setShortcutEnabled
} from './core/registration.js';

import {
  setScope as _setScope,
  restoreScope,
  getScope
} from './core/scope.js';

import {
  trigger,
  initKeyboardListener,
  removeKeyboardListener
} from './core/trigger.js';

import {
  showHelp,
  hideHelp
} from './ui/help-panel.js';

import {

  getMetrics,
  healthCheck,
  info
} from './diagnostics/health.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function _notifySubscribers(event: DynObj) {
  const subscribers = getSubscribers();
  for (let i = 0; i < subscribers.length; i++) {
    try { subscribers[i](event); } catch (e) {}
  }
}

// ============================================================================
// PUBLIC API - REGISTRATION (with notification)
// ============================================================================

/**
 * Registra um shortcut
 * @param {string} combo - Ex: 'ctrl+s', 'alt+shift+p'
 * @param {function} handler
 * @param {Object} [options]
 */
export function register(combo: DynObj, handler: DynObj, options: DynObj) {
  const result = _register(Object.assign({ combo, handler }, options));
  _notifySubscribers({ type: 'register', combo });
  return result;
}

/**
 * Registra múltiplos shortcuts
 * @param {Array} shortcuts
 */
export function registerMany(shortcuts: DynObj) {
  const result = _registerMany(shortcuts);
  _notifySubscribers({ type: 'registerMany', count: shortcuts.length });
  return result;
}

// ============================================================================
// PUBLIC API - SCOPE (with notification)
// ============================================================================

/**
 * Define escopo ativo
 * @param {string} scope
 */
export function setScope(scope: DynObj) {
  return _setScope(scope, _notifySubscribers);
}

// ============================================================================
// PUBLIC API - ENABLE/DISABLE
// ============================================================================

/**
 * Habilita shortcuts
 */
export function enable() {
  _setEnabled(true);
}

/**
 * Desabilita shortcuts
 */
export function disable() {
  _setEnabled(false);
}

/**
 * Verifica se está habilitado
 */
export function isEnabled() {
  return _isEnabled();
}

/**
 * Habilita/desabilita shortcut específico
 * @param {string} combo
 * @param {boolean} enabled
 */
export function setEnabled(combo: DynObj, enabled: boolean) {
  return setShortcutEnabled(combo, enabled);
}

// ============================================================================
// PUBLIC API - CONFIGURATION
// ============================================================================

/**
 * Configura opções globais
 * @param {Object} options
 */
export function configure(options: DynObj) {
  updateConfig(options);
}

/**
 * Retorna configuração atual
 */
export function getConfig() {
  return Object.assign({}, _getConfig());
}

// ============================================================================
// PUBLIC API - SUBSCRIPTION
// ============================================================================

/**
 * Inscreve callback para eventos
 * @param {function} callback
 * @returns {function} Unsubscribe function
 */
export function subscribe(callback: DynObj) {
  if (typeof callback !== 'function') return () => {};
  
  const subscribers = getSubscribers();
  subscribers.push(callback);
  
  return () => {
    const idx = subscribers.indexOf(callback);
    if (idx >= 0) subscribers.splice(idx, 1);
  };
}

// ============================================================================
// PUBLIC API - LIFECYCLE
// ============================================================================

/**
 * Destrói o módulo
 */
export function destroy() {
  removeKeyboardListener();
  hideHelp();
  resetState();
}

// ============================================================================
// PUBLIC API - QUERIES (re-exports)
// ============================================================================

export { 
  unregister, 
  unregisterGroup,
  get,
  getAll,
  getByGroup,
  isRegistered
};

// Alias para manter compatibilidade
export function getGroups() {
  return getGroupList();
}

// ============================================================================
// PUBLIC API - SCOPE (re-exports)
// ============================================================================

export { restoreScope, getScope };

// ============================================================================
// PUBLIC API - TRIGGER (re-exports)
// ============================================================================

export { trigger };

// ============================================================================
// PUBLIC API - HELP (re-exports)
// ============================================================================

export { showHelp, hideHelp };

// ============================================================================
// PUBLIC API - DIAGNOSTICS (re-exports)
// ============================================================================

export { getMetrics, healthCheck, info };

// ============================================================================
// PUBLIC API - CONSTANTS (re-exports)
// ============================================================================

export { VERSION, MODULE_ID, MODIFIER_KEYS, SHORTCUT_SCOPES };

// Alias para compatibilidade
export const SCOPES = SHORTCUT_SCOPES;

// ============================================================================
// INITIALIZATION
// ============================================================================

if (typeof document !== 'undefined') {
  initKeyboardListener();
  
  // Registra shortcut de help
  const config = _getConfig();
  if (config.showHelp && config.helpKey) {
    register(config.helpKey, showHelp, {
      description: 'Mostrar atalhos de teclado',
      group: 'system',
      allowInInputs: false
    });
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  VERSION,
  MODULE_ID,
  MODIFIER_KEYS,
  SCOPES: SHORTCUT_SCOPES,
  // Registration
  register,
  unregister,
  unregisterGroup,
  registerMany,
  // Scope
  setScope,
  restoreScope,
  getScope,
  // Enable/Disable
  enable,
  disable,
  isEnabled,
  setEnabled,
  // Queries
  get,
  getAll,
  getByGroup,
  getGroups,
  isRegistered,
  // Trigger
  trigger,
  // Help
  showHelp,
  hideHelp,
  // Config
  configure,
  getConfig,
  // Subscription
  subscribe,
  // Lifecycle
  destroy,
  // Health
  getMetrics,
  healthCheck,
  info
};
