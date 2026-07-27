// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-charts:telemetry:logger
// PURPOSE: Panel Charts - Telemetry Logger
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   logDebug() — exported function
//   logInfo() — exported function
//   logWarn() — exported function
//   logError() — exported function
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
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

const MODULE_ID = 'panel-charts:telemetry:logger';
const VERSION = '9.3.0-P2-ENTERPRISE';
const PANEL_NAME = 'panel-charts';

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

export function logDebug(message: string, data: Record<string, unknown> = {}) {
  const logger = _getLogger();
  if (logger && logger.debug) {
    logger.debug(`[${PANEL_NAME}] ${message}`, data);
  }
}

export function logInfo(message: string, data: Record<string, unknown> = {}) {
  const logger = _getLogger();
  if (logger && logger.info) {
    logger.info(`[${PANEL_NAME}] ${message}`, data);
  }
}

export function logWarn(message: string, data: Record<string, unknown> = {}) {
  const logger = _getLogger();
  if (logger && logger.warn) {
    logger.warn(`[${PANEL_NAME}] ${message}`, data);
  }
}

export function logError(message: string, error: unknown = null) {
  const logger = _getLogger();
  if (logger && logger.error) {
    logger.error(`[${PANEL_NAME}] ${message}`, error);
  }
}

export { VERSION, MODULE_ID };
export default { logDebug, logInfo, logWarn, logError, injectPorts, getPorts, VERSION, MODULE_ID };

// Alias export for consumers expecting Logger
export const Logger = { logDebug, logInfo, logWarn, logError, injectPorts, getPorts, VERSION, MODULE_ID };
