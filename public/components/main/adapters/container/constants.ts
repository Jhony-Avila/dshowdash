// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-UNIFIED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-constants
// PURPOSE: Container Constants - Constantes do Container
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CONTAINER_STATES — exported value
//   CONTAINER_EVENTS — exported value
//   CONTAINER_CONFIG — exported value
//   STATE — exported value
//   POLICY — exported value
//   DOCK_SLOTS — exported value
//   LAYOUT_MODE — exported value
//   BUDGET — exported value
//   ENTERPRISE_DEFAULTS — exported value
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

export const VERSION = '8.0.0-UNIFIED';
export const MODULE_ID = 'container-constants';

// Estados do container (legacy)
export const CONTAINER_STATES = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
  RECOVERING: 'recovering'
});

// Eventos do container (legacy)
export const CONTAINER_EVENTS = Object.freeze({
  MOUNT: 'container:mount',
  UNMOUNT: 'container:unmount',
  READY: 'container:ready',
  ERROR: 'container:error',
  STATE_CHANGE: 'container:state:change'
});

// Config do container (legacy)
export const CONTAINER_CONFIG = Object.freeze({
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  LOAD_TIMEOUT: 10000
});

// STATE - Estados da state-machine do container moderno
export const STATE = Object.freeze({
  IDLE: 'idle',
  CREATING: 'creating',
  READY: 'ready',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LOADING: 'loading',
  COLLAPSED: 'collapsed',
  ERROR: 'error',
  DESTROYING: 'destroying',
  DESTROYED: 'destroyed',
  DEGRADED: 'degraded'
});

// POLICY - Políticas de lifecycle
export const POLICY = Object.freeze({
  EPHEMERAL: 'ephemeral',
  PERSISTENT: 'persistent'
});

// DOCK_SLOTS - Slots de docking
export const DOCK_SLOTS = Object.freeze({
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary'
});

// LAYOUT_MODE - Modos de layout
export const LAYOUT_MODE = Object.freeze({
  INHERIT: 'inherit',
  OVERRIDE: 'override'
});

// BUDGET - Limites operacionais
export const BUDGET = Object.freeze({
  MAX_CONTAINERS: 10,
  MAX_OPS_PER_CYCLE: 50,
  ORPHAN_THRESHOLD: 3
});

// ENTERPRISE_DEFAULTS - Features habilitadas por padrão
export const ENTERPRISE_DEFAULTS = Object.freeze({
  // Features habilitadas por padrão no enterprise
  showControls: true,
  collapsible: true,
  closable: false,
  fullscreenable: true,
  contextMenuEnabled: true,
  keyboardEnabled: true,
  statePersistenceEnabled: true,
  progressEnabled: true,
  toastEnabled: true,
  accessibilityEnabled: true,
  errorBoundaryEnabled: true,
  eventHooksEnabled: true,
  // Features opcionais (desabilitadas por padrão)
  breadcrumbEnabled: false,
  toolbarEnabled: false,
  searchEnabled: false,
  tabsEnabled: false,
  splitViewEnabled: false,
  zoomEnabled: false,
  debugEnabled: false,
  metricsEnabled: false,
  performanceEnabled: false,
  draggable: false,
  resizable: false,
  snapEnabled: false,
  multiWindowEnabled: false,
  notificationBadgeEnabled: false,
  pluginSystemEnabled: false
});

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { 
      constantsAvailable: [
        'CONTAINER_STATES', 'CONTAINER_EVENTS', 'CONTAINER_CONFIG',
        'STATE', 'POLICY', 'DOCK_SLOTS', 'LAYOUT_MODE', 'BUDGET', 'ENTERPRISE_DEFAULTS'
      ] 
    }
  };
}

export default { 
  CONTAINER_STATES, CONTAINER_EVENTS, CONTAINER_CONFIG,
  STATE, POLICY, DOCK_SLOTS, LAYOUT_MODE, BUDGET, ENTERPRISE_DEFAULTS,
  healthCheck, VERSION, MODULE_ID 
};
