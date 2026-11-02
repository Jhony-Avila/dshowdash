// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.js.event-bus.constants
// PURPOSE: EventBus Constants & Configuration
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts
// PROVIDES: VERSION, MODULE_ID, PRIORITY, DEFAULT_CONFIG
// @changelog v5.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v5.4.0-PORTSFACTORY - Migração para PortsFactory
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '5.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.js.event-bus';

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

export const PRIORITY = {
  SYSTEM: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3
} as const;

export type PriorityLevel = typeof PRIORITY[keyof typeof PRIORITY];

export const DEFAULT_CONFIG = {
  debug: false,
  maxHistorySize: 100,
  maxListenersPerEvent: 50,
  defaultTimeout: 5000,
  telemetryEnabled: true,
  maxLogSize: 500
} as const;

export type EventBusConfig = typeof DEFAULT_CONFIG;

export const _debug = (): boolean => (_getPort('config') as PortConfig | null)?.app?.debug ?? false;

export const _log = (level: string, ...args: unknown[]): void => {
  const logger = _getPort('logger') as PortLogger | null;
  if (!logger) return;
  if (level === 'error') { logger.error?.(`[${MODULE_ID}]`, ...args); return; }
  if (level === 'warn') { logger.warn?.(`[${MODULE_ID}]`, ...args); return; }
  if (_debug()) logger.debug?.(`[${MODULE_ID}]`, ...args);
};

export default { VERSION, MODULE_ID, PRIORITY, DEFAULT_CONFIG, _debug, _log };
