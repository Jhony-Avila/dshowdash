// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: helpers
// PURPOSE: Main module - Features Integration Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   getCM() — exported function
//   getEventBus() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).ContainerMain (getCM only - necessary for container access)
// ═══════════════════════════════════════════════════════════════
// @changelog v1.1.0-P0-ENTERPRISE - Migrated getEventBus to Ports pattern
/**
 * Features Integration - Helpers
 * @module features-integration/helpers
 * @version 1.1.0-P0-ENTERPRISE
 */
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const MODULE_ID = 'features-integration.helpers';
export const VERSION = '1.1.0-P0-ENTERPRISE';

const Ports = createUiPorts({ moduleId: MODULE_ID });
let _portsInitialized = false;

function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}

export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function getCM() {
  return typeof window !== 'undefined' ? (window as any).ContainerMain : null;
}

export function getEventBus() {
  _initPorts();
  return Ports.get('eventBus');
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, p0Enterprise: true, portsInitialized: _portsInitialized };
}

export default { getCM, getEventBus, injectPorts, getPorts, info, MODULE_ID, VERSION };
