// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-public-methods
// PURPOSE: Sidebar API - Public Methods (Orchestrator)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCollapseMethods, resetDebounce, isDebounceActive from ./collapse-methods.js
//   createAccordionMethods from ./accordion-methods.js
//   createMobileMethods from ./mobile-methods.js
//   createNavigationMethods from ./navigation-methods.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts — exported value
//   getPorts — exported value
//   getMetrics — exported value
//   createPublicMethods() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   resetDebounce — exported value
//   createCollapseMethods — exported value
//   createAccordionMethods — exported value
//   createMobileMethods — exported value
//   createNavigationMethods — exported value
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

import * as Ports from './ports.js';
import * as Metrics from './metrics.js';
import { createCollapseMethods, resetDebounce, isDebounceActive } from './collapse-methods.js';
import { createAccordionMethods } from './accordion-methods.js';
import { createMobileMethods } from './mobile-methods.js';
import { createNavigationMethods } from './navigation-methods.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '6.0.0-MODULAR';
export const MODULE_ID = 'sidebar-public-methods';

// Re-export Ports
export const injectPorts = Ports.inject;
export const getPorts = Ports.snapshot;

// Re-export Metrics
export const getMetrics = Metrics.getAll;

// Re-export Debounce
export { resetDebounce };

// Factory principal - cria todos os métodos públicos
export function createPublicMethods(dependencies: DynObj) {
  return {
    ...createCollapseMethods(dependencies),
    ...createAccordionMethods(dependencies),
    ...createMobileMethods(dependencies),
    ...createNavigationMethods(dependencies)
  };
}

// Re-export factories individuais para uso granular
export { createCollapseMethods, createAccordionMethods, createMobileMethods, createNavigationMethods };


export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    debounceActive: isDebounceActive(),
    metrics: Metrics.getAll(),
    p24AtomicTransitions: true,
    modular: true,
    submodules: ['ports', 'metrics', 'collapse-methods', 'accordion-methods', 'mobile-methods', 'navigation-methods']
  };
}

export function healthCheck() {
  return {
    status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: Ports.isInitialized(),
    checks: {
      debounceActive: isDebounceActive(),
      atomicTransitions: Metrics.get('atomicTransitions'),
      syncFailures: Metrics.get('syncFailures')
    },
    metrics: Metrics.getAll(),
    p24AtomicTransitions: true,
    modular: true
  };
}

export default {
  createCollapseMethods,
  createAccordionMethods,
  createMobileMethods,
  createNavigationMethods,
  createPublicMethods,
  resetDebounce,
  getMetrics,
  injectPorts,
  getPorts,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
