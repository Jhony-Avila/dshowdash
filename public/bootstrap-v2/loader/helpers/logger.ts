// Bootstrap-V2 Loader - Logger
// @version 6.3.0-PORTSFACTORY
// @changelog v6.3.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.3.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js, MODULE_ID from ../constants.js
// PROVIDES: log(level, msg, data), injectPorts(p), getPorts()
// BROWSER-APIS: console.error (fallback)
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { MODULE_ID } from '../constants.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';

const _Ports = createCorePorts({ moduleId: MODULE_ID + ':loader-logger' });

export function log(level: string, msg: string, data?: Record<string, unknown>) {
  const logger = _Ports.get('logger');
  if (logger && logger[level]) {
    logger[level]('[' + MODULE_ID + '] ' + msg, data || '');
    return;
  }
  if (level === 'error') {
    console.error('[' + MODULE_ID + ']', msg, data || '');
  }
}

export function injectPorts(p: Record<string, unknown>) { return _Ports.inject(p); }
export function getPorts() { return _Ports.snapshot(); }
