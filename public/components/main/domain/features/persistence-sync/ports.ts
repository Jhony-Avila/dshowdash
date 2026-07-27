// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ports
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   MODULE_ID from ./constants.js
//
// PROVIDES:
//   initPorts() — exported function
//   getPort() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
/**
 * Persistence Sync - Ports
 * @module persistence-sync/ports
 */
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { MODULE_ID } from './constants.js';

export const VERSION = '1.1.0-ENTERPRISE';

const Ports = createCorePorts({ moduleId: MODULE_ID });

export function initPorts() {
  Ports.init();
}

export function getPort(name: string) {
  return Ports.get(name);
}

export function injectPorts(p: Record<string, unknown>) {
  return Ports.inject(p);
}

export function getPorts() {
  return Ports.snapshot();
}
