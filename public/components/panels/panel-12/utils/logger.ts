// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.1-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-12.utils.logger
// PURPOSE: Logger Utility - Sistema de logs centralizado
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   setLogLevel() — exported function
//   debug() — exported function
//   logInfo() — exported function
//   warn() — exported function
//   error() — exported function
//   logAction() — exported function
//   measurePerformance() — exported function
//   startTimer() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const MODULE_ID = 'panel-12.utils.logger';
export const VERSION = '9.3.0-P2-ENTERPRISE';
const COMPONENT_ID = 'painel-12';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

_initPorts();

const log = {
  info: (action: string, details: Record<string, unknown>) => { const logger = _getPort('logger'); if (logger?.info) logger.info(action, { component: COMPONENT_ID, ...details }); },
  warn: (action: string, details: Record<string, unknown>) => { const logger = _getPort('logger'); if (logger?.warn) logger.warn(action, { component: COMPONENT_ID, ...details }); },
  error: (action: string, details: Record<string, unknown>) => { const logger = _getPort('logger'); if (logger?.error) logger.error(action, { component: COMPONENT_ID, ...details }); },
  debug: (action: string, details: Record<string, unknown>) => { const logger = _getPort('logger'); if (logger?.debug) logger.debug(action, { component: COMPONENT_ID, ...details }); }
};

export const setLogLevel = (level: string) => { const logger = _getPort('logger'); if (logger?.setLevel) logger.setLevel(level); };
export const debug = (action: string, details: Record<string, unknown> = {}) => { log.debug(action, details); };
export const logInfo = (action: string, details: Record<string, unknown> = {}) => { log.info(action, details); };
export const warn = (action: string, details: Record<string, unknown> = {}) => { log.warn(action, details); };
export const error = (action: string, details: Record<string, unknown> = {}) => { log.error(action, details); };
export const logAction = (action: string, details: Record<string, unknown> = {}) => { log.info(action, details); };

export const measurePerformance = (action: string, startTime: number) => { const duration = performance.now() - startTime; log.info(action, { duration: `${duration.toFixed(2)}ms` }); return duration; };
export const startTimer = (action: string) => { const startTime = performance.now(); return { end: (details: Record<string, unknown> = {}) => { const duration = performance.now() - startTime; log.info(action, { ...details, duration: `${duration.toFixed(2)}ms` }); return duration; } }; };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { loggerReady: true } });

export default { MODULE_ID, VERSION, log, setLogLevel, debug, logInfo, warn, error, logAction, measurePerformance, startTimer, info, healthCheck, injectPorts, getPorts };
