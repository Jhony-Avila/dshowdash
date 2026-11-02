// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-FIX-GLOBALSTATE)
// ═══════════════════════════════════════════════════════════════
// MODULE: app.router.ports
// PURPOSE: Router Global - Ports
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   initPorts() — exported function
//   injectPorts() — exported function
//   getPort() — exported function
//   getPorts() — exported function
//   isInitialized() — exported function
//   isDebug() — exported function
//   log() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.3.0-FIX-GLOBALSTATE';
export const MODULE_ID = 'app.router.ports';

const Ports = createUiPorts({ moduleId: MODULE_ID });

interface RuntimePort {
  location: Location;
  history: History;
  addEventListener: typeof window.addEventListener;
}

let _runtime: RuntimePort | null = null;

export function initPorts() { Ports.init(); if (typeof window !== 'undefined' && !_runtime) { _runtime = { location: window.location, history: window.history, addEventListener: window.addEventListener.bind(window) }; } }
export function injectPorts(p: Record<string, unknown>) { Ports.inject(p); if (p && p.runtime) _runtime = p.runtime as RuntimePort; }
export function getPort(name: string) { if (name === 'runtime') return _runtime; return Ports.get(name); }
export function getPorts() { const snapshot = Ports.snapshot() as Record<string, unknown>; snapshot.runtime = _runtime; return snapshot; }
export function isInitialized() { return Ports.isInitialized(); }

export function isDebug() { const config = getPort('config'); return config && config.app && config.app.debug ? true : false; }


export function log(level: 'error' | 'warn' | 'info' | 'debug', ...args: any[]) { const logger = getPort('logger'); if (!logger) return; const prefix = '[router-global]'; if (level === 'error') { if (logger.error) logger.error(...[prefix].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn(...[prefix].concat(args)); return; } if (level === 'info') { if (logger.info) logger.info(...[prefix].concat(args)); return; } if (isDebug() && logger.debug) logger.debug(...[prefix].concat(args)); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: Ports.isInitialized(), loggerAvailable: !!getPort('logger'), globalStateAvailable: !!getPort('globalState') }; }
export function healthCheck() { return { status: isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { initialized: isInitialized(), loggerAvailable: !!getPort('logger'), globalStateAvailable: !!getPort('globalState'), portsInitialized: Ports.isInitialized() } }; }

export default { initPorts, injectPorts, getPort, getPorts, isInitialized, isDebug, log, healthCheck, info, VERSION, MODULE_ID };
