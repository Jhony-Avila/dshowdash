// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-HARDENED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:contracts:layout
// PURPOSE: Layout Contract - Interface formal para operações de layout de painéis
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   PANEL_LAYOUT_STATES — exported value
//   DOCK_ZONES — exported value
//   SPLIT_MODES — exported value
//   LAYOUT_TRANSITIONS — exported value
//   DEFAULT_CONSTRAINTS — exported value
//   CONSTRAINT_SCHEMA — exported value
//   REQUIRED_OPERATIONS — exported value
//   LAYOUT_PANEL_EVENTS — exported value
//   INVARIANTS — exported value
//   isValidLayoutTransition() — exported function
//   validateConstraints() — exported function
//   validateLayoutManager() — exported function
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
export const MODULE_ID = 'container-main:contracts:layout';

let logger;
try { logger = createLogger(MODULE_ID); } catch (e) { logger = null; }
const _log = (level: string, msg: string, data: Record<string, unknown>) => {
  if (logger && typeof (logger as Record<string, unknown>)[level] === 'function') {
    try { ((logger as Record<string, unknown>)[level] as (msg: string, data: Record<string, unknown>) => void)(msg, data); } catch (e) { /* silent */ }
  }
};

// ─── ESTADOS DE LAYOUT DE PAINEL ───
export const PANEL_LAYOUT_STATES = Object.freeze({
  NORMAL: 'normal',
  DOCKED: 'docked',
  FLOATING: 'floating',
  MAXIMIZED: 'maximized',
  MINIMIZED: 'minimized',
  FULLSCREEN: 'fullscreen',
  SPLIT_LEFT: 'split-left',
  SPLIT_RIGHT: 'split-right',
  SPLIT_TOP: 'split-top',
  SPLIT_BOTTOM: 'split-bottom'
});

// ─── ZONAS DE DOCK ───
export const DOCK_ZONES = Object.freeze({
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  BOTTOM: 'bottom',
  CENTER: 'center'
});

// ─── MODOS DE SPLIT ───
export const SPLIT_MODES = Object.freeze({
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  QUAD: 'quad'
});

// ─── TRANSIÇÕES VÁLIDAS ───
export const LAYOUT_TRANSITIONS = Object.freeze({
  [PANEL_LAYOUT_STATES.NORMAL]: [
    PANEL_LAYOUT_STATES.DOCKED, PANEL_LAYOUT_STATES.FLOATING,
    PANEL_LAYOUT_STATES.MAXIMIZED, PANEL_LAYOUT_STATES.MINIMIZED,
    PANEL_LAYOUT_STATES.FULLSCREEN,
    PANEL_LAYOUT_STATES.SPLIT_LEFT, PANEL_LAYOUT_STATES.SPLIT_RIGHT,
    PANEL_LAYOUT_STATES.SPLIT_TOP, PANEL_LAYOUT_STATES.SPLIT_BOTTOM
  ],
  [PANEL_LAYOUT_STATES.DOCKED]: [
    PANEL_LAYOUT_STATES.NORMAL, PANEL_LAYOUT_STATES.FLOATING,
    PANEL_LAYOUT_STATES.MAXIMIZED, PANEL_LAYOUT_STATES.FULLSCREEN
  ],
  [PANEL_LAYOUT_STATES.FLOATING]: [
    PANEL_LAYOUT_STATES.NORMAL, PANEL_LAYOUT_STATES.DOCKED,
    PANEL_LAYOUT_STATES.MAXIMIZED, PANEL_LAYOUT_STATES.FULLSCREEN
  ],
  [PANEL_LAYOUT_STATES.MAXIMIZED]: [
    PANEL_LAYOUT_STATES.NORMAL, PANEL_LAYOUT_STATES.FULLSCREEN,
    PANEL_LAYOUT_STATES.MINIMIZED
  ],
  [PANEL_LAYOUT_STATES.MINIMIZED]: [
    PANEL_LAYOUT_STATES.NORMAL, PANEL_LAYOUT_STATES.MAXIMIZED
  ],
  [PANEL_LAYOUT_STATES.FULLSCREEN]: [
    PANEL_LAYOUT_STATES.NORMAL, PANEL_LAYOUT_STATES.MAXIMIZED
  ],
  [PANEL_LAYOUT_STATES.SPLIT_LEFT]: [
    PANEL_LAYOUT_STATES.NORMAL, PANEL_LAYOUT_STATES.FULLSCREEN
  ],
  [PANEL_LAYOUT_STATES.SPLIT_RIGHT]: [
    PANEL_LAYOUT_STATES.NORMAL, PANEL_LAYOUT_STATES.FULLSCREEN
  ],
  [PANEL_LAYOUT_STATES.SPLIT_TOP]: [
    PANEL_LAYOUT_STATES.NORMAL, PANEL_LAYOUT_STATES.FULLSCREEN
  ],
  [PANEL_LAYOUT_STATES.SPLIT_BOTTOM]: [
    PANEL_LAYOUT_STATES.NORMAL, PANEL_LAYOUT_STATES.FULLSCREEN
  ]
});

// ─── CONSTRAINTS PADRÃO ───
export const DEFAULT_CONSTRAINTS = Object.freeze({
  minWidth: 200,
  minHeight: 100,
  maxWidth: Infinity,
  maxHeight: Infinity,
  aspectRatio: null,
  resizable: true,
  draggable: true,
  dockable: true
});

// ─── CONSTRAINT SCHEMA ───
export const CONSTRAINT_SCHEMA = {
  minWidth: { type: 'number', min: 50, default: 200 },
  minHeight: { type: 'number', min: 50, default: 100 },
  maxWidth: { type: 'number', min: 100, default: Infinity },
  maxHeight: { type: 'number', min: 100, default: Infinity },
  aspectRatio: { type: 'number', nullable: true, default: null as Record<string, unknown> | null },
  resizable: { type: 'boolean', default: true },
  draggable: { type: 'boolean', default: true },
  dockable: { type: 'boolean', default: true }
};

// ─── OPERAÇÕES OBRIGATÓRIAS ───
export const REQUIRED_OPERATIONS = Object.freeze({
  stateManagement: ['getState', 'setState', 'canTransition'],
  panelRegistry: ['register', 'unregister', 'getPanel', 'getPanels'],
  geometry: ['resize', 'move', 'getPosition', 'getSize'],
  dock: ['dock', 'undock'],
  split: ['split', 'unsplit'],
  fullscreen: ['enterFullscreen', 'exitFullscreen', 'toggleFullscreen']
});

// ─── EVENTOS DE LAYOUT (contrato público) ───
export const LAYOUT_PANEL_EVENTS = Object.freeze({
  STATE_CHANGED: 'layout.panel.state-changed',
  RESIZED: 'layout.panel.resized',
  MOVED: 'layout.panel.moved',
  DOCKED: 'layout.panel.docked',
  UNDOCKED: 'layout.panel.undocked',
  SPLIT: 'layout.panel.split',
  UNSPLIT: 'layout.panel.unsplit',
  FULLSCREEN_ENTER: 'layout.panel.fullscreen.enter',
  FULLSCREEN_EXIT: 'layout.panel.fullscreen.exit',
  REGISTERED: 'layout.panel.registered',
  UNREGISTERED: 'layout.panel.unregistered',
  CONSTRAINTS_CHANGED: 'layout.panel.constraints-changed'
});

// ─── INVARIANTES ───
export const INVARIANTS = Object.freeze([
  'Não pode haver dois painéis em fullscreen simultâneo',
  'Split requer pelo menos dois painéis registrados',
  'Transições DEVEM seguir LAYOUT_TRANSITIONS',
  'Constraints DEVEM respeitar minWidth/minHeight',
  'Painel minimizado não pode ser splitado',
  'Dock zone CENTER não permite split'
]);

// ─── VALIDADORES ───

export function isValidLayoutTransition(fromState: string, toState: string) {
  const allowed = (LAYOUT_TRANSITIONS as Record<string, string[]>)[fromState];
  if (!allowed) return false;
  return allowed.includes(toState);
}

export function validateConstraints(constraints: Record<string, unknown>) {
  const errors = [];
  if (!constraints || typeof constraints !== 'object') {
    return { valid: false, errors: ['Constraints must be an object'] };
  }

  if (constraints.minWidth !== undefined && (constraints.minWidth as number) < 50) {
    errors.push('minWidth must be >= 50');
  }
  if (constraints.minHeight !== undefined && (constraints.minHeight as number) < 50) {
    errors.push('minHeight must be >= 50');
  }
  if (constraints.maxWidth !== undefined && (constraints.maxWidth as number) < (constraints.minWidth as number)) {
    errors.push('maxWidth must be >= minWidth');
  }
  if (constraints.maxHeight !== undefined && (constraints.maxHeight as number) < (constraints.minHeight as number)) {
    errors.push('maxHeight must be >= minHeight');
  }
  if (constraints.aspectRatio !== null && constraints.aspectRatio !== undefined) {
    if (typeof constraints.aspectRatio !== 'number' || constraints.aspectRatio <= 0) {
      errors.push('aspectRatio must be a positive number or null');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateLayoutManager(manager: unknown) {
  const missing = [];
  const categories = Object.entries(REQUIRED_OPERATIONS);

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i][0];
    const methods = categories[i][1];
    for (let j = 0; j < methods.length; j++) {
      if (typeof (manager as Record<string, unknown>)[methods[j]] !== 'function') {
        missing.push({ category, method: methods[j] });
      }
    }
  }

  const valid = missing.length === 0;
  if (!valid) {
    _log('warn', 'Layout manager validation failed', { missing: missing.length, details: missing });
  }

  return {
    valid,
    missing,
    checkedMethods: categories.reduce((sum, c) => sum + c[1].length, 0),
    missingCount: missing.length
  };
}

// ─── INFO / HEALTHCHECK ───

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    states: Object.keys(PANEL_LAYOUT_STATES).length,
    dockZones: Object.keys(DOCK_ZONES).length,
    splitModes: Object.keys(SPLIT_MODES).length,
    events: Object.keys(LAYOUT_PANEL_EVENTS).length,
    requiredOperations: Object.values(REQUIRED_OPERATIONS).flat().length,
    invariants: INVARIANTS.length,
    validators: ['isValidLayoutTransition', 'validateConstraints', 'validateLayoutManager']
  };
}

export function healthCheck() {
  try {
    const statesOk = Object.keys(PANEL_LAYOUT_STATES).length === 10;
    const transitionsOk = Object.keys(LAYOUT_TRANSITIONS).length === Object.keys(PANEL_LAYOUT_STATES).length;
    const eventsOk = Object.keys(LAYOUT_PANEL_EVENTS).length === 12;
    return {
      status: statesOk && transitionsOk && eventsOk ? 'HEALTHY' : 'DEGRADED',
      version: VERSION,
      moduleId: MODULE_ID,
      checks: { statesOk, transitionsOk, eventsOk }
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
  PANEL_LAYOUT_STATES, DOCK_ZONES, SPLIT_MODES,
  LAYOUT_TRANSITIONS, DEFAULT_CONSTRAINTS, CONSTRAINT_SCHEMA,
  REQUIRED_OPERATIONS, LAYOUT_PANEL_EVENTS, INVARIANTS,
  isValidLayoutTransition, validateConstraints, validateLayoutManager,
  info, healthCheck
};
