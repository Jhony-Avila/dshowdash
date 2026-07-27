// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-11:utils:logger
// PURPOSE: Panel 11 - Logger Utility
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   log() — exported function
//   warn() — exported function
//   error() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Logger (fallback only in non-strict mode)
// ───────────────────────────────────────────────────────────────
// @changelog
//   1.2.0-STRICT-MODE - NR-FULL strict mode migration
//     - Added createUiPorts infrastructure
//     - Added isStrict/recordViolation imports
//     - Logger resolved via Ports first, then Core.windowAdapter
//     - In strict mode: no window.* fallback
//     - In non-strict: window.* fallback with violation recording
//     - Removed console.* fallback (silent in strict mode)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

const MODULE_ID = 'panel-11:utils:logger';
const VERSION = '9.3.0-P2-ENTERPRISE';
const PANEL_NAME = 'panel-11';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _getLogger() {
  const lg = _getPort('logger');
  if (lg) return lg;
  if (typeof window !== 'undefined' && window.Core?.windowAdapter?.get) {
    const wab = (window as any).Core.windowAdapter.get('Logger');
    if (wab) return wab;
  }
  return null;
}

export function log(message: string, data: Record<string, unknown> = {}) {
  const logger = _getLogger();
  if (logger && logger.debug) {
    logger.debug(`[${PANEL_NAME}] ${message}`, data);
  }
}

export function warn(message: string, data: Record<string, unknown> = {}) {
  const logger = _getLogger();
  if (logger && logger.warn) {
    logger.warn(`[${PANEL_NAME}] ${message}`, data);
  }
}

export function error(message: string, err: unknown = null) {
  const logger = _getLogger();
  if (logger && logger.error) {
    logger.error(`[${PANEL_NAME}] ${message}`, err);
  }
}

export { VERSION, MODULE_ID };
export default { log, warn, error, injectPorts, getPorts, VERSION, MODULE_ID };
