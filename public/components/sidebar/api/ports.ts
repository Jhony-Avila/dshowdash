// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-api-ports
// PURPOSE: Sidebar API - Ports Management
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   init() — exported function
//   get() — exported function
//   inject() — exported function
//   snapshot() — exported function
//   isInitialized() — exported function
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

import { createUiPorts } from '/core/runtime/ports-profiles.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0';
export const MODULE_ID = 'sidebar-api-ports';

const Ports = createUiPorts({ moduleId: MODULE_ID });

export function init() {
  Ports.init();
}

export function get(name: string) {
  return Ports.get(name);
}

export function inject(p: DynObj) {
  return Ports.inject(p);
}

export function snapshot() {
  return Ports.snapshot();
}

export function isInitialized() {
  return Ports.isInitialized();
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: isInitialized()
  };
}

export function healthCheck() {
  return {
    status: isInitialized() ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { portsInitialized: isInitialized() }
  };
}

export default { init, get, inject, snapshot, isInitialized, info, healthCheck, VERSION, MODULE_ID };
