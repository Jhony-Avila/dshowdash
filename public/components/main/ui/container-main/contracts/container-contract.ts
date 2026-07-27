// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-HARDENED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:contracts:container
// PURPOSE: Container Contract - Interface pública formal do Container-Main
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CONTAINER_STATES — exported value
//   VALID_TRANSITIONS — exported value
//   CONTAINER_EVENTS — exported value
//   REQUIRED_API — exported value
//   OPTIONAL_API — exported value
//   LAYOUT_OPERATIONS — exported value
//   INVARIANTS — exported value
//   isValidTransition() — exported function
//   validateContainerApi() — exported function
//   validateContainerConfig() — exported function
//   validateHealthResponse() — exported function
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

import { createLogger } from '../utils/logger.js';

export const VERSION = '1.1.0-HARDENED';
export const MODULE_ID = 'container-main:contracts:container';

let logger;
try { logger = createLogger(MODULE_ID); } catch (e) { logger = null; }
const _log = (level: string, msg: string, data: Record<string, unknown>) => {
  if (logger && typeof (logger as Record<string, unknown>)[level] === 'function') {
    try { ((logger as Record<string, unknown>)[level] as (msg: string, data: Record<string, unknown>) => void)(msg, data); } catch (e) { /* silent */ }
  }
};

// ─── ESTADOS VÁLIDOS DO CONTAINER ───
export const CONTAINER_STATES = Object.freeze({
  INITIALIZING: 'initializing',
  READY: 'ready',
  LOADING: 'loading',
  ERROR: 'error',
  COLLAPSED: 'collapsed',
  FULLSCREEN: 'fullscreen',
  MINIMIZED: 'minimized',
  DESTROYED: 'destroyed'
});

// ─── TRANSIÇÕES VÁLIDAS (state machine) ───
export const VALID_TRANSITIONS = Object.freeze({
  initializing: ['ready', 'error'],
  ready: ['loading', 'collapsed', 'fullscreen', 'minimized', 'destroyed', 'error'],
  loading: ['ready', 'error'],
  error: ['ready', 'destroyed'],
  collapsed: ['ready', 'fullscreen', 'destroyed'],
  fullscreen: ['ready', 'collapsed', 'destroyed'],
  minimized: ['ready', 'destroyed'],
  destroyed: []
});

// ─── EVENTOS EMITIDOS (contrato público) ───
export const CONTAINER_EVENTS = Object.freeze({
  STATE_CHANGED: 'container-main.state.changed',
  STATE_RESTORE: 'container-main.state.restore',
  READY: 'container-main.ready',
  MOUNTED: 'container-main.mounted',
  UNMOUNTED: 'container-main.unmounted',
  DESTROYED: 'container-main.destroyed',
  ERROR: 'container-main.error',
  RECOVER: 'container-main.recover',
  NAVIGATION_SYNC: 'main.navigation.sync',
  PANEL_CHANGE: 'container-main.panel.change',
  COLLAPSE: 'container-main.collapse',
  EXPAND: 'container-main.expand',
  FULLSCREEN_ENTER: 'container-main.fullscreen.enter',
  FULLSCREEN_EXIT: 'container-main.fullscreen.exit',
  RESIZE: 'container-main.resize',
  CONTENT_LOADED: 'container-main.content.loaded',
  CONTENT_ERROR: 'container-main.content.error',
  THEME_CHANGE: 'container-main.theme.change',
  LAYOUT_CHANGE: 'container-main.layout.change',
  BREAKPOINT_CHANGE: 'container-main.breakpoint.change'
});

// ─── API PÚBLICA MÍNIMA GARANTIDA ───
export const REQUIRED_API = Object.freeze({
  lifecycle: ['unmount', 'getState', 'isMounted'],
  stateQueries: ['isCollapsed', 'isFullscreen', 'isMinimized', 'isLoading'],
  stateMutations: ['collapse', 'expand', 'toggle', 'fullscreen', 'close'],
  content: ['setContent', 'getContent', 'setTitle', 'setIcon'],
  loading: ['showLoading', 'hideLoading', 'setProgress'],
  diagnostics: ['healthCheck', 'audit', 'getMetrics', 'getPerformance'],
  identity: ['getId', 'getElement', 'getOptions']
});

// ─── API OPCIONAL (depende de componentes inicializados) ───
export const OPTIONAL_API = Object.freeze({
  toast: ['toast', 'toastSuccess', 'toastError', 'toastWarning', 'toastInfo'],
  tabs: ['addTab', 'removeTab', 'setActiveTab'],
  badge: ['setBadge', 'clearBadge'],
  toolbar: ['setToolbarItems', 'addToolbarItem'],
  zoom: ['zoomIn', 'zoomOut', 'setZoom', 'resetZoom', 'getZoom'],
  accessibility: ['announce', 'focusFirst', 'enableFocusTrap', 'disableFocusTrap'],
  plugins: ['registerPlugin', 'unregisterPlugin', 'getPlugin'],
  events: ['on', 'off', 'emit'],
  debug: ['debug']
});

// ─── OPERAÇÕES DE LAYOUT (via layout-facade) ───
export const LAYOUT_OPERATIONS = Object.freeze({
  required: ['register', 'unregister'],
  panel: ['resize', 'move', 'dock', 'toggleFullscreen']
});

// ─── INVARIANTES ───
export const INVARIANTS = Object.freeze([
  'Um container destruído não pode ser remontado',
  'Não pode haver dois containers em fullscreen simultâneo',
  'Estado collapsed e fullscreen são mutuamente exclusivos',
  'Todo container DEVE ter um containerId único',
  'healthCheck() DEVE retornar objeto com status string',
  'Transições de estado DEVEM seguir VALID_TRANSITIONS'
]);

// ─── VALIDADORES ───

export function isValidTransition(fromState: string, toState: string) {
  const allowed = (VALID_TRANSITIONS as Record<string, string[]>)[fromState];
  if (!allowed) return false;
  return allowed.includes(toState);
}

export function validateContainerApi(api: unknown) {
  const missing = [];
  const categories = Object.entries(REQUIRED_API);

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i][0];
    const methods = categories[i][1];
    for (let j = 0; j < methods.length; j++) {
      if (typeof (api as Record<string, unknown>)[methods[j]] !== 'function') {
        missing.push({ category, method: methods[j] });
      }
    }
  }

  const valid = missing.length === 0;
  if (!valid) {
    _log('warn', 'Container API validation failed', { missing: missing.length, details: missing });
  }

  return {
    valid,
    missing,
    checkedMethods: categories.reduce((sum, c) => sum + c[1].length, 0),
    missingCount: missing.length
  };
}

export function validateContainerConfig(config: Record<string, unknown>) {
  const errors = [];
  if (!config) { errors.push('Config is null/undefined'); return { valid: false, errors }; }
  if (!config.containerId || typeof config.containerId !== 'string') errors.push('containerId must be a non-empty string');
  if (!config.options || typeof config.options !== 'object') errors.push('options must be an object');
  return { valid: errors.length === 0, errors };
}

export function validateHealthResponse(response: Record<string, unknown>) {
  if (!response || typeof response !== 'object') return { valid: false, reason: 'Response must be an object' };
  if (!response.status || typeof response.status !== 'string') return { valid: false, reason: 'status must be a string' };
  const validStatuses = ['HEALTHY', 'DEGRADED', 'NOT_INITIALIZED', 'ERROR'];
  if (validStatuses.indexOf(response.status) === -1) return { valid: false, reason: `status must be one of: ${validStatuses.join(', ')}` };
  return { valid: true };
}

// ─── INFO / HEALTHCHECK ───

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    states: Object.keys(CONTAINER_STATES).length,
    events: Object.keys(CONTAINER_EVENTS).length,
    requiredApiMethods: Object.values(REQUIRED_API).flat().length,
    optionalApiMethods: Object.values(OPTIONAL_API).flat().length,
    layoutOperations: Object.values(LAYOUT_OPERATIONS).flat().length,
    invariants: INVARIANTS.length,
    validators: ['isValidTransition', 'validateContainerApi', 'validateContainerConfig', 'validateHealthResponse']
  };
}

export function healthCheck() {
  try {
    const statesOk = Object.keys(CONTAINER_STATES).length === 8;
    const eventsOk = Object.keys(CONTAINER_EVENTS).length === 20;
    const transitionsOk = Object.keys(VALID_TRANSITIONS).length === Object.keys(CONTAINER_STATES).length;
    return {
      status: statesOk && eventsOk && transitionsOk ? 'HEALTHY' : 'DEGRADED',
      version: VERSION,
      moduleId: MODULE_ID,
      checks: { statesOk, eventsOk, transitionsOk }
    };
  } catch (e) {
    return {
      status: 'ERROR',
      version: VERSION,
      moduleId: MODULE_ID,
      error: (e as Error).message || 'healthCheck failed'
    };
  }
}

export default {
  VERSION, MODULE_ID,
  CONTAINER_STATES, VALID_TRANSITIONS, CONTAINER_EVENTS,
  REQUIRED_API, OPTIONAL_API, LAYOUT_OPERATIONS, INVARIANTS,
  isValidTransition, validateContainerApi, validateContainerConfig, validateHealthResponse,
  info, healthCheck
};
