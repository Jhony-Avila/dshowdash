// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-feature-flags-admin:logger-helper
// PURPOSE: Panel Feature Flags Admin - Logger Helper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   isDebug from ./ports.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   log() — exported function
//   createLogger() — exported function
//   info() — exported function
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
import { isDebug } from './ports.js';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-feature-flags-admin:logger-helper';
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();
export const log = (level: string, ...args: unknown[]) => { if (!isDebug() && level === 'debug') return; const logger = _getPort('logger'); if (!logger) return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn.apply(logger, ['[Panel-Feature-Flags-Admin]', ...args]); };
export const createLogger = () => ({ debug: (...args: unknown[]) => { log('debug', ...args); }, info: (...args: unknown[]) => { log('info', ...args); }, warn: (...args: unknown[]) => { log('warn', ...args); }, error: (...args: unknown[]) => { log('error', ...args); } });
export const info = () => { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized }; };
export default { log, createLogger };
