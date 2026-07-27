// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.preloader.core.logger
// PURPOSE: Preloader Logger - Centralized logging for preloader
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INJECT_PORTS - injectPorts() for dependency injection
// @contract GET_PORTS - getPorts() returns ports snapshot
// @contract IS_DEBUG - isDebugEnabled() checks debug mode
// @contract LOG - log() logs message at level
// @contract GET_METRICS - getMetrics() returns logging metrics
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   isDebugEnabled() — exported function
//   log() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v6.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v6.4.1-ENTERPRISE: Fixed duplicate MODULE_ID/VERSION export
// @changelog P17WI: Migração para PortsFactory/PortsProfiles
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '6.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'preloader.core.logger';

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _metrics = { logs: 0, debugSkipped: 0 };

export const isDebugEnabled = () => { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug ? true : false; };

export const log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (!logger) return;
  if (!isDebugEnabled() && level === 'debug') { _metrics.debugSkipped++; return; }
  _metrics.logs++;
  const fn = logger[level] || logger.info;
  if (typeof fn === 'function') fn.apply(logger, [`[${MODULE_ID}]`].concat(args as string[]));
};

export const getMetrics = () => ({ debugEnabled: isDebugEnabled(), logs: _metrics.logs, debugSkipped: _metrics.debugSkipped });
export const info = () => ({ moduleId: MODULE_ID, version: VERSION, debugEnabled: isDebugEnabled(), portsInitialized: Ports.isInitialized(), metrics: getMetrics(), timestamp: Date.now() });
export const healthCheck = () => { const loggerAvailable = !!_getPort('logger'); const checks = { loggerAvailable, portsInitialized: Ports.isInitialized() }; const checkKeys = Object.keys(checks); let passed = 0; for (let i = 0; i < checkKeys.length; i++) { if (checks[checkKeys[i] as keyof typeof checks]) passed++; } return { status: passed === checkKeys.length ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${checkKeys.length}`, version: VERSION, moduleId: MODULE_ID, checks, portsInitialized: Ports.isInitialized(), metrics: getMetrics(), timestamp: Date.now() }; };

export default { VERSION, MODULE_ID, log, isDebugEnabled, getMetrics, info, healthCheck, injectPorts, getPorts };
