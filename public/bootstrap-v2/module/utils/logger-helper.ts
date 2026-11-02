// Logger Helper
// @version 2.7.1-CONTRACTS
// @changelog v2.7.1-CONTRACTS: Dependency Contract formalizado
// @changelog v2.7.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.7.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   MODULE_ID from ../constants.js
// PROVIDES: log(), logInfo(), logWarn(), logError(), injectPorts()
// WINDOW ACCESS: None (uses PortsFactory)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { MODULE_ID } from '../constants.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';

const _Ports = createCorePorts({ moduleId: MODULE_ID + ':logger-helper' });

export function log(level: string) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _Ports.get('logger');
  if (logger && typeof logger[level] === 'function') {
    logger[level].apply(logger, ['[' + MODULE_ID + ']'].concat(args));
  }
}

export function logInfo() {
  const args = Array.prototype.slice.call(arguments);
  // @ts-expect-error strict migration — TS2345
  log.apply(null, ['info'].concat(args));
}

export function logWarn() {
  const args = Array.prototype.slice.call(arguments);
  // @ts-expect-error strict migration — TS2345
  log.apply(null, ['warn'].concat(args));
}

export function logError() {
  const args = Array.prototype.slice.call(arguments);
  // @ts-expect-error strict migration — TS2345
  log.apply(null, ['error'].concat(args));
}

export function injectPorts(p: Record<string, unknown>) { return _Ports.inject(p); }
export function getPorts() { return _Ports.snapshot(); }

export default { log, logInfo, logWarn, logError, injectPorts, getPorts };
