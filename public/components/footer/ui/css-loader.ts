// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.5.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-css-loader
// PURPOSE: Footer CSS Loader - Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   createLogger from ../core/logger.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   ensureCssLoaded() — exported function
//   isLoaded() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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
import { createLogger } from '../core/logger.js';

const VERSION = '9.5.0-P17WI';
const MODULE_ID = 'footer-css-loader';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _log = createLogger(MODULE_ID);
let _loaded = false;
const _metrics = { loadAttempts: 0 };
export function ensureCssLoaded() { if (_loaded) return; if (typeof window === 'undefined' || typeof document === 'undefined') return; _metrics.loadAttempts++; const cfg = _getPort('config'); const basePath = (cfg && cfg.paths && cfg.paths.cssBase) ? cfg.paths.cssBase : '/components'; const cssPath = `${basePath}/footer/styles/index.css`; if (!document.querySelector(`link[href="${cssPath}"]`)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = cssPath; link.onerror = () => { _log.error(`Failed to load CSS: ${cssPath}`); }; document.head.appendChild(link); _log.info(`CSS loaded: ${cssPath}`); } _loaded = true; }
export function isLoaded() { return _loaded; }
export function getMetrics() { return Object.assign({}, _metrics, { loaded: _loaded }); }
export function info() { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, loaded: _loaded, metrics: getMetrics(), portsInitialized: ps._initialized }; }
export function healthCheck() { const ps = Ports.snapshot(); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { cssLoaderReady: true, portsInitialized: ps._initialized }, metrics: getMetrics() }; }
export { MODULE_ID, VERSION };
export default { ensureCssLoaded, isLoaded, getMetrics, info, healthCheck, VERSION, MODULE_ID };
