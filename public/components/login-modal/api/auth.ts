// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.7.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-auth-api
// PURPOSE: Login Modal - Auth API Client
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   AUTH_ERROR_CODES, createResponse from ./constants.js
//   buildHeaders, parseResponse, mapStatusToErrorCode, shouldRetry, shouldRetryNetworkError, calculateBackoff, sleep, combineSignals, generateTraceId, getDefaultMessage, emitTelemetry from ./helpers.js
//   mockLogin, mockCheckSession, mockLogout from ./mocks.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   AuthAPI() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   AUTH_ERROR_CODES — exported value
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
import { AUTH_ERROR_CODES, createResponse } from './constants.js';
import { buildHeaders, parseResponse, mapStatusToErrorCode, shouldRetry, shouldRetryNetworkError, calculateBackoff, sleep, combineSignals, generateTraceId, getDefaultMessage, emitTelemetry } from './helpers.js';
import { mockLogin, mockCheckSession, mockLogout } from './mocks.js';

const MODULE_ID = 'login-modal-auth-api';
const VERSION = '5.7.0-P17WI';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _getDebugFlag(config: Record<string, any>) { if (config && config.debug !== undefined) return config.debug; const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; }

export { AUTH_ERROR_CODES };

export function AuthAPI(this: any, config: Record<string, any>, deps: Record<string, any>) { if (!config) config = {}; if (!deps) deps = {}; this.config = config; this.debug = _getDebugFlag(config); this.csrfManager = deps.csrfManager || null; this.deviceIDManager = deps.deviceIDManager || null; this.telemetry = deps.telemetry || null; this.timeout = (config.api && config.api.timeout) ? config.api.timeout : 10000; this.maxRetries = (config.api && config.api.maxRetries) ? config.api.maxRetries : 1; this.endpoints = (config.api && config.api.endpoints) ? config.api.endpoints : {}; this.mockMode = (config.api && config.api.mockMode) ? config.api.mockMode : false; this.activeControllers = new Map(); this._metrics = { logins: 0, checks: 0, logouts: 0, errors: 0 }; this._applyDefaultEndpoints(); _initPorts(); }

AuthAPI.prototype._applyDefaultEndpoints = function() { if (!this.endpoints.login) this.endpoints.login = '/api/auth/login.php'; if (!this.endpoints.check) this.endpoints.check = '/api/auth/check.php'; if (!this.endpoints.logout) this.endpoints.logout = '/api/auth/logout.php'; };

AuthAPI.prototype.login = function(username: string, password: string, opts: Record<string, any>) { const self = this; if (!opts) opts = {}; self._metrics.logins++; const traceId = generateTraceId(); const signal = opts.signal; if (!self.endpoints.login) { return Promise.resolve(createResponse(false, { code: AUTH_ERROR_CODES.INVALID_CONFIG, message: 'Endpoint de login não configurado', traceId, error: AUTH_ERROR_CODES.INVALID_CONFIG })); } if (self.mockMode) return Promise.resolve(mockLogin(username, password, { traceId })); let attempt = 0; const maxAttempts = self.maxRetries + 1; function tryLogin(): Promise<any> { attempt++; const startTime = Date.now(); let timeoutFired = false; const controller = new AbortController(); const controllerId = `${traceId}-attempt-${attempt}`; self.activeControllers.set(controllerId, controller); const timeoutId = setTimeout(() => { timeoutFired = true; controller.abort(); }, self.timeout); const combinedSignal = combineSignals(signal, controller.signal); return fetch(self.endpoints.login, { method: 'POST', credentials: 'include', cache: 'no-store', signal: combinedSignal, headers: buildHeaders(traceId, self.csrfManager, self.deviceIDManager), body: JSON.stringify({ username, password }) }).then(response => { clearTimeout(timeoutId); self.activeControllers.delete(controllerId); const latency = Date.now() - startTime; return parseResponse(response).then(data => { if (response.ok && data && data.ok === true) { if (data.csrf && self.csrfManager) self.csrfManager.set(data.csrf); emitTelemetry(self.telemetry, 'login', 'success', { latency, attempt }); return createResponse(true, { code: 'LOGIN_SUCCESS', message: 'Login realizado com sucesso', data: { user: data.user, csrf: data.csrf, expiresIn: data.expires_in }, latency, traceId }); } const errorCode = mapStatusToErrorCode(response.status); if (shouldRetry(response.status, attempt, maxAttempts)) { return sleep(calculateBackoff(attempt)).then(tryLogin); } self._metrics.errors++; emitTelemetry(self.telemetry, 'login', 'error', { errorCode, status: response.status, latency, attempt }); const retryAfter = (data && data.retry_after) ? data.retry_after : (response.headers.get ? response.headers.get('Retry-After') : null); return createResponse(false, { status: response.status, code: errorCode, message: (data && (data.error || data.message)) || getDefaultMessage(errorCode), data: { retryAfter }, retryAfter, latency, traceId, error: errorCode }); }); }).catch(error => { clearTimeout(timeoutId); self.activeControllers.delete(controllerId); const latency = Date.now() - startTime; if (error.name === 'AbortError') { const errorCode = timeoutFired ? AUTH_ERROR_CODES.REQUEST_TIMEOUT : AUTH_ERROR_CODES.REQUEST_ABORTED; emitTelemetry(self.telemetry, 'login', 'aborted', { errorCode, latency, attempt, timeoutFired }); return createResponse(false, { code: errorCode, message: getDefaultMessage(errorCode), latency, traceId, error: errorCode }); } if (shouldRetryNetworkError(error, attempt, maxAttempts)) { return sleep(calculateBackoff(attempt)).then(tryLogin); } self._metrics.errors++; emitTelemetry(self.telemetry, 'login', 'network_error', { error: error.message, latency, attempt }); return createResponse(false, { code: AUTH_ERROR_CODES.NETWORK_ERROR, message: error.message || getDefaultMessage(AUTH_ERROR_CODES.NETWORK_ERROR), latency, traceId, error: AUTH_ERROR_CODES.NETWORK_ERROR }); }); } return tryLogin(); };

AuthAPI.prototype.checkSession = function(opts: Record<string, any>) { const self = this; if (!opts) opts = {}; self._metrics.checks++; const traceId = generateTraceId(); const timeout = opts.timeout || 5000; if (!self.endpoints.check) { return Promise.resolve(createResponse(false, { code: AUTH_ERROR_CODES.INVALID_CONFIG, message: 'Endpoint de check não configurado', data: { authenticated: false }, traceId, error: AUTH_ERROR_CODES.INVALID_CONFIG })); } if (self.mockMode) return Promise.resolve(mockCheckSession({ traceId })); const controller = new AbortController(); const controllerId = `${traceId}-check`; self.activeControllers.set(controllerId, controller); const timeoutId = setTimeout(() => { controller.abort(); }, timeout); const signal = combineSignals(opts.signal, controller.signal); const startTime = Date.now(); return fetch(self.endpoints.check, { method: 'GET', credentials: 'include', cache: 'no-store', signal, headers: buildHeaders(traceId, self.csrfManager, self.deviceIDManager) }).then(response => { clearTimeout(timeoutId); self.activeControllers.delete(controllerId); const latency = Date.now() - startTime; if (!response.ok) { const errorCode = mapStatusToErrorCode(response.status); return createResponse(false, { status: response.status, code: errorCode, message: errorCode === AUTH_ERROR_CODES.INVALID_CREDENTIALS ? 'Sessão inválida' : getDefaultMessage(errorCode), data: { authenticated: false }, latency, traceId, error: errorCode }); } return parseResponse(response).then(data => createResponse(true, { code: 'SESSION_VALID', message: 'Sessão válida', data: { authenticated: data.authenticated === true, user: data.user || null }, latency, traceId })); }).catch(error => { clearTimeout(timeoutId); self.activeControllers.delete(controllerId); self._metrics.errors++; const errorCode = error.name === 'AbortError' ? AUTH_ERROR_CODES.REQUEST_TIMEOUT : AUTH_ERROR_CODES.NETWORK_ERROR; return createResponse(false, { code: errorCode, message: getDefaultMessage(errorCode), data: { authenticated: false }, latency: timeout, traceId, error: errorCode }); }); };

AuthAPI.prototype.logout = function(opts: Record<string, any>) { const self = this; if (!opts) opts = {}; self._metrics.logouts++; const traceId = generateTraceId(); const timeout = opts.timeout || 5000; if (!self.endpoints.logout) { return Promise.resolve(createResponse(false, { code: AUTH_ERROR_CODES.INVALID_CONFIG, message: 'Endpoint de logout não configurado', traceId, error: AUTH_ERROR_CODES.INVALID_CONFIG })); } if (self.mockMode) return Promise.resolve(mockLogout({ traceId })); const controller = new AbortController(); const controllerId = `${traceId}-logout`; self.activeControllers.set(controllerId, controller); const timeoutId = setTimeout(() => { controller.abort(); }, timeout); const signal = combineSignals(opts.signal, controller.signal); const startTime = Date.now(); return fetch(self.endpoints.logout, { method: 'POST', credentials: 'include', cache: 'no-store', signal, headers: buildHeaders(traceId, self.csrfManager, self.deviceIDManager) }).then(response => { clearTimeout(timeoutId); self.activeControllers.delete(controllerId); const latency = Date.now() - startTime; if (self.csrfManager) self.csrfManager.clear(); return createResponse(response.ok, { status: response.status, code: response.ok ? 'LOGOUT_SUCCESS' : 'LOGOUT_FAILED', message: response.ok ? 'Logout realizado' : 'Falha no logout', latency, traceId }); }).catch(error => { clearTimeout(timeoutId); self.activeControllers.delete(controllerId); self._metrics.errors++; const errorCode = error.name === 'AbortError' ? AUTH_ERROR_CODES.REQUEST_TIMEOUT : AUTH_ERROR_CODES.NETWORK_ERROR; return createResponse(false, { code: errorCode, message: getDefaultMessage(errorCode), latency: timeout, traceId, error: errorCode }); }); };

AuthAPI.prototype.cancel = function() { this.activeControllers.forEach((ctrl: AbortController) => { ctrl.abort(); }); this.activeControllers.clear(); };

AuthAPI.prototype.info = function() { return { moduleId: MODULE_ID, version: VERSION, endpoints: Object.assign({}, this.endpoints), mockMode: this.mockMode, timeout: this.timeout, maxRetries: this.maxRetries, activeRequests: this.activeControllers.size, portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, this._metrics), timestamp: Date.now() }; };

AuthAPI.prototype.healthCheck = function() { const checks = { hasLoginEndpoint: !!this.endpoints.login, hasCheckEndpoint: !!this.endpoints.check, hasLogoutEndpoint: !!this.endpoints.logout, noActiveRequests: this.activeControllers.size === 0, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; const status = passed === 5 ? 'HEALTHY' : (passed >= 3 ? 'DEGRADED' : 'UNHEALTHY'); return { status, score: `${passed}/5`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; };

export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }
export function healthCheck() { const checks = { moduleLoaded: true, classAvailable: typeof AuthAPI === 'function', portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }

export { VERSION, MODULE_ID };
export default AuthAPI;
