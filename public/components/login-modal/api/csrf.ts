// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.8.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-csrf-wrapper
// PURPOSE: Login Modal - CSRF Token Manager (Wrapper para SecurityCSRF)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   SecurityCSRF from /components/security/csrf-token-manager/index.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   CSRFManager() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
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
import { SecurityCSRF } from '/components/security/csrf-token-manager/index.js';

const MODULE_ID = 'login-csrf-wrapper';
const VERSION = '5.8.0-P17WI';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string) { const logger = _getPort('logger'); if (!logger) return; const args = Array.prototype.slice.call(arguments, 1); if (level === 'error') { if (logger.error) logger.error(...['[login-csrf]'].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn(...['[login-csrf]'].concat(args)); return; } if (_debugEnabled() && logger.debug) logger.debug(...['[login-csrf]'].concat(args)); };

export function CSRFManager(this: any, config: Record<string, any>) { if (!config) config = {}; this.config = config; this._initialized = false; this._initSecurityCSRF(config); }


// @ts-expect-error TS migration - TS2554
CSRFManager.prototype._initSecurityCSRF = function(config: Record<string, any>) { try { if (SecurityCSRF && SecurityCSRF.init) SecurityCSRF.init(config, {}); this._initialized = true; _log('info', 'CSRFManager delegando para SecurityCSRF', { version: SecurityCSRF.version }); } catch (err) { _log('error', 'Erro ao inicializar SecurityCSRF', err); } };

CSRFManager.prototype.get = () => SecurityCSRF && SecurityCSRF.getToken ? SecurityCSRF.getToken() : null;
CSRFManager.prototype.set = (token: string) => SecurityCSRF && SecurityCSRF.setToken ? SecurityCSRF.setToken(token) : null;
// @ts-expect-error strict migration — TS2345
CSRFManager.prototype.renew = (newToken: string) => SecurityCSRF && SecurityCSRF.renewToken ? SecurityCSRF.renewToken(newToken) : null;
CSRFManager.prototype.clear = () => { if (SecurityCSRF && SecurityCSRF.clearToken) SecurityCSRF.clearToken(); };
CSRFManager.prototype.getHeaders = () => SecurityCSRF && SecurityCSRF.getHeaders ? SecurityCSRF.getHeaders() : {};
CSRFManager.prototype.getStatus = () => SecurityCSRF && SecurityCSRF.getStatus ? SecurityCSRF.getStatus() : null;

CSRFManager.prototype.info = function() { const base = { moduleId: MODULE_ID, version: VERSION, delegateTo: 'SecurityCSRF', delegateVersion: (SecurityCSRF && SecurityCSRF.version) || 'unknown', initialized: this._initialized, hasToken: !!this.get(), portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; const secInfo = SecurityCSRF && SecurityCSRF.info ? SecurityCSRF.info() : {}; return Object.assign(base, secInfo); };

CSRFManager.prototype.healthCheck = function() { const logger = _getPort('logger'); const checks = { initialized: this._initialized, securityCSRFAvailable: typeof SecurityCSRF !== 'undefined', hasGetToken: typeof SecurityCSRF.getToken === 'function', hasSetToken: typeof SecurityCSRF.setToken === 'function', loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; const status = passed === 6 ? 'HEALTHY' : (passed >= 4 ? 'DEGRADED' : 'UNHEALTHY'); return { status, score: `${passed}/6`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; };

export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }

export function healthCheck() { const logger = _getPort('logger'); const checks = { moduleLoaded: true, classAvailable: typeof CSRFManager === 'function', securityCSRFAvailable: typeof SecurityCSRF !== 'undefined', loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 5 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/5`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }

export { VERSION, MODULE_ID };
export default CSRFManager;
