// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-DI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-tab-manager-ports
// PURPOSE: Tab Manager - Ports
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
//   emitEvent() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventType
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '8.1.0-DI-STRICT';
export const MODULE_ID = 'container-tab-manager-ports';

const Ports = createUiPorts({ moduleId: MODULE_ID });

export function init() { Ports.init(); }
export function get(name: string) { return Ports.get(name); }
export function inject(p: unknown) { return Ports.inject(p); }
export function snapshot() { return Ports.snapshot(); }
export function isInitialized() { return Ports.isInitialized(); }

export function emitEvent(eventType: string, payload: Record<string, unknown>) {
  const eb = get('eventBus');
  if (eb?.emit) {
    eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
    return true;
  }
  return false;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: isInitialized() };
}

export function healthCheck() {
  return { status: isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { portsInitialized: isInitialized() } };
}

export default { init, get, inject, snapshot, isInitialized, emitEvent, info, healthCheck, VERSION, MODULE_ID };
