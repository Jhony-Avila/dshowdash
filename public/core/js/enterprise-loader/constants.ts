// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.js.enterprise-loader.constants
// PURPOSE: EnterpriseLoader Constants & Configuration
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts
// PROVIDES: VERSION, MODULE_ID, _log, _debug
// @changelog v5.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v5.3.0-PORTSFACTORY - Migração para PortsFactory
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '5.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.js.enterprise-loader.constants';

interface PortLogger {
  error?: (prefix: string, ...args: unknown[]) => void;
  warn?: (prefix: string, ...args: unknown[]) => void;
  debug?: (prefix: string, ...args: unknown[]) => void;
}

interface PortConfig {
  app?: { debug?: boolean };
}

const _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string): unknown { return _Ports.get(name); }
export function injectPorts(p: unknown): unknown { return _Ports.inject(p); }
export function getPorts(): unknown { return _Ports.snapshot(); }

export const _debug = (): boolean => (_getPort('config') as PortConfig | null)?.app?.debug ?? false;

export const _log = (level: string, ...args: unknown[]): void => {
  const logger = _getPort('logger') as PortLogger | null;
  if (!logger) return;
  if (level === 'error') { logger.error?.(`[${MODULE_ID}]`, ...args); return; }
  if (level === 'warn') { logger.warn?.(`[${MODULE_ID}]`, ...args); return; }
  if (_debug()) logger.debug?.(`[${MODULE_ID}]`, ...args);
};

export default { VERSION, MODULE_ID, _debug, _log };
