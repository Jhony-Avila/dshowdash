// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.12.0-P22)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-handler
// PURPOSE: Login Handler - Login Modal
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   LoginHandler() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   AUTH_EVENTS.LOGIN_ATTEMPT
//   AUTH_EVENTS.LOGIN_SUCCESS
//   AUTH_EVENTS.SESSION_VALIDATED
//   AUTH_EVENTS.LOGIN_FAILURE
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   localStorage
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';

const MODULE_ID = 'login-handler';
const VERSION = '5.12.0-P22';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };

const _log = function(level?: any, ...rest: any[]) {
  const logger = _getPort('logger');
  if (!logger) return;
  const args = rest;
  if (level === 'error') { if (logger.error) logger.error(...['[login-handler]'].concat(args)); return; }
  if (level === 'warn') { if (logger.warn) logger.warn(...['[login-handler]'].concat(args)); return; }
  if (_debugEnabled() && logger.debug) logger.debug(...['[login-handler]'].concat(args));
};

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
const SESSION_STORAGE_KEY = 'dshowdash_session';
const REMEMBER_ME_KEY = 'dshowdash_remember_me';
const SESSION_DURATION_DEFAULT = 30 * 60 * 1000;
const SESSION_DURATION_REMEMBER = 30 * 24 * 60 * 60 * 1000;

function _shakeForm(form: HTMLElement | null) { if (!form) return; form.classList.add('lm-shake'); setTimeout(() => { form.classList.remove('lm-shake'); }, 500); }
function _successPulse(form: HTMLElement | null) { if (!form) return; const inputs = form.querySelectorAll('.lm-input'); inputs.forEach(input => { input.classList.add('lm-success'); setTimeout(() => { input.classList.remove('lm-success'); }, 400); }); }
function _saveRememberMePreference(rememberMe: boolean) { if (!isBrowser) return; try { if (rememberMe) localStorage.setItem(REMEMBER_ME_KEY, 'true'); else localStorage.removeItem(REMEMBER_ME_KEY); } catch (e: any) { _log('warn', 'Erro ao salvar preferência remember-me:', e.message); } }
function _loadRememberMePreference() { if (!isBrowser) return false; try { return localStorage.getItem(REMEMBER_ME_KEY) === 'true'; } catch (e: any) { return false; } }

function _persistSession(user: Record<string, any> | null, ports: Record<string, any> | null, rememberMe: boolean) {
  if (!rememberMe) rememberMe = false;
  if (!isBrowser || !user) return;
  try {
    const duration = rememberMe ? SESSION_DURATION_REMEMBER : SESSION_DURATION_DEFAULT;
    const sessionData = { isAuthenticated: true, userId: user.id || user.user_id, username: user.username || user.login || user.name, email: user.email || null, roles: user.roles || ['user'], level: user.level || user.nivel || 2, expiresAt: Date.now() + duration, createdAt: Date.now(), rememberMe };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    _saveRememberMePreference(rememberMe);
    _log('info', 'Sessão persistida', { rememberMe, expiresIn: rememberMe ? '30 dias' : '30 min' });
    const sessionManager = ports ? ports.sessionManager : null;
    if (sessionManager && sessionManager._injectSession) sessionManager._injectSession(sessionData);
  } catch (e: any) { _log('warn', 'Erro ao persistir sessão:', e.message); }
}

function _setAuthState(isAuthenticated: boolean, ports: Record<string, any> | null) {
  if (!isBrowser) return;
  const state = isAuthenticated ? 'authenticated' : 'unauthenticated';
  const globalState = ports ? ports.globalState : null;
  if (globalState && globalState.dispatch) { try { globalState.dispatch({ type: 'SET_AUTH_STATE', payload: { isAuthenticated, state } }); } catch (e: any) {} }
  if (document.body) { document.body.dataset.authReady = isAuthenticated ? 'true' : 'false'; document.body.dataset.state = state; }
}

export function LoginHandler(this: any, modal: any) { this.modal = modal; this._metrics = { attempts: 0, successes: 0, failures: 0, errors: 0, rememberMeUsed: 0 }; }

LoginHandler.prototype._getPorts = function() { return this.modal ? this.modal._ports : {}; };
LoginHandler.prototype.loadRememberMePreference = () => _loadRememberMePreference();

// P22: EventBus.emit is the official trail - telemetry.track removed (was dual-emit)
LoginHandler.prototype.handle = function(username: string, password: string, rememberMe: boolean) {
  const self = this; if (!rememberMe) rememberMe = false;
  const modal = self.modal;
  const rateLimiter = modal.rateLimiter; const errorHandler = modal.errorHandler; const errorDisplay = modal.errorDisplay; const validator = modal.validator; const eventBus = modal.eventBus; const telemetry = modal.telemetry; const store = modal.store; const formComponent = modal.formComponent; const authAPI = modal.authAPI; const config = modal.config; const form = modal.form;
  self._metrics.attempts++; if (rememberMe) self._metrics.rememberMeUsed++;
  if (!rateLimiter || !errorHandler || !errorDisplay || !validator || !eventBus || !store || !formComponent || !authAPI) { _log('error', 'Dependências críticas não inicializadas'); self._metrics.errors++; return Promise.resolve(); }
  if (rateLimiter.isLocked()) { const lockResult = errorHandler.handleLoginError({ status: null }, rateLimiter, telemetry); errorDisplay.show({ message: lockResult.errorMessage }); _shakeForm(form); return Promise.resolve(); }
  const validation = validator.validateCredentials(username, password);
  if (!validation.valid) { const firstError = validation.errors[0]; errorDisplay.show({ message: (firstError ? firstError.message : 'Erro de validação'), code: (firstError ? firstError.code : 'VALIDATION_ERROR') }); _shakeForm(form); return Promise.resolve(); }
  // P22: EventBus.emit is the official trail - telemetry.track removed
  eventBus.emit(AUTH_EVENTS.LOGIN_ATTEMPT, { username: validation.username, rememberMe, timestamp: Date.now(), source: MODULE_ID });
  store.setBusy(true); formComponent.setBusy(true); errorDisplay.clear();
  modal.loginAbortController = new AbortController();
  const timeout = (config && config.api && config.api.timeout) ? config.api.timeout : 10000;
  const timeoutId = setTimeout(() => { if (modal.loginAbortController) modal.loginAbortController.abort(); }, timeout);
  return authAPI.login(validation.username, validation.password, { signal: modal.loginAbortController.signal, rememberMe }).then((result: any) => { clearTimeout(timeoutId); if (result.success) return self._handleSuccess(result, validation, rememberMe); else return self._handleFailure(result, validation); }).catch((error: any) => { clearTimeout(timeoutId); return self._handleError(error, validation); }).finally(() => { clearTimeout(timeoutId); modal.loginAbortController = null; store.setBusy(false); formComponent.setBusy(false); });
};

LoginHandler.prototype._handleSuccess = function(result: Record<string, any>, validation: Record<string, any>, rememberMe: boolean) {
  const self = this; if (!rememberMe) rememberMe = false;
  const modal = self.modal; const eventBus = modal.eventBus; const telemetry = modal.telemetry; const modalController = modal.modalController; const form = modal.form; const ports = self._getPorts();
  const user = (result.data && result.data.user) ? result.data.user : null; const csrf = (result.data && result.data.csrf) ? result.data.csrf : null;
  self._metrics.successes++; _successPulse(form); _persistSession(user, ports, rememberMe);
  const successPayload = { user, username: validation.username, rememberMe, timestamp: Date.now(), latency: result.latency, csrf, source: 'login-modal-interactive', interactive: true };
  eventBus.emit(AUTH_EVENTS.LOGIN_SUCCESS, successPayload);
  if (telemetry && telemetry.trackSuccess) telemetry.trackSuccess(user, result.latency);
  _setAuthState(true, ports);
  eventBus.emit(AUTH_EVENTS.SESSION_VALIDATED, { authenticated: true, user, username: validation.username, rememberMe, timestamp: Date.now(), source: 'login-modal-interactive' });
  const globalEventBus = ports ? ports.eventBus : null;
  if (isBrowser && globalEventBus && globalEventBus.emit) { globalEventBus.emit(AUTH_EVENTS.SESSION_STARTED, { authenticated: true, user, rememberMe, source: 'login-modal-interactive', interactive: true }); }
  if (modal.onAuthSuccess && typeof modal.onAuthSuccess === 'function') { try { modal.onAuthSuccess(successPayload); } catch (e: any) {} }
  return new Promise(r => { setTimeout(r, 400); }).then(() => { modalController.close('success'); });
};

LoginHandler.prototype._handleFailure = function(result: Record<string, any>, validation: Record<string, any>) {
  const self = this; const modal = self.modal;
  const rateLimiter = modal.rateLimiter; const eventBus = modal.eventBus; const errorHandler = modal.errorHandler; const telemetry = modal.telemetry; const errorDisplay = modal.errorDisplay; const formComponent = modal.formComponent; const store = modal.store; const form = modal.form;
  self._metrics.failures++; _shakeForm(form); rateLimiter.recordAttempt();
  if (result.status === 429 && result.data && result.data.retryAfter) { rateLimiter.syncBackendRetryAfter(result.data.retryAfter, 'auth_api'); }
  eventBus.emit(AUTH_EVENTS.LOGIN_FAILURE, { status: result.status, message: result.message, timestamp: Date.now(), latency: result.latency, source: MODULE_ID });
  if (modal.onAuthFailure && typeof modal.onAuthFailure === 'function') { try { modal.onAuthFailure({ status: result.status }); } catch (e: any) {} }
  const handleResult = errorHandler.handleLoginError(result, rateLimiter, telemetry, result.latency);
  errorDisplay.show({ message: handleResult.errorMessage, code: handleResult.errorCode }); formComponent.clear(); formComponent.focus();
  if (result.status === 429 && result.data && result.data.retryAfter) { errorDisplay.show({ message: 'Muitas tentativas. Aguarde', code: 'RATE_LIMITED', countdownMs: result.data.retryAfter, focusTarget() { formComponent.setBusy(false); store.setBusy(false); formComponent.focus(); } }); formComponent.setBusy(true); }
};

LoginHandler.prototype._handleError = function(error: any, validation: Record<string, any>) {
  const self = this; const modal = self.modal;
  const errorDisplay = modal.errorDisplay; const telemetry = modal.telemetry; const rateLimiter = modal.rateLimiter; const errorHandler = modal.errorHandler; const formComponent = modal.formComponent; const config = modal.config; const form = modal.form;
  self._metrics.errors++; _shakeForm(form);
  if (error.name === 'AbortError') { errorDisplay.show({ message: 'Tempo esgotado. Tente novamente.', code: 'REQUEST_TIMEOUT' }); if (telemetry && telemetry.track) { telemetry.track('login:timeout', { username: validation.username, timeout: (config && config.api && config.api.timeout) ? config.api.timeout : 10000 }); } }
  else { rateLimiter.recordAttempt(); const handleResult = errorHandler.handleLoginError(error, rateLimiter, telemetry); errorDisplay.show({ message: handleResult.errorMessage, code: handleResult.errorCode }); }
  formComponent.clear(); formComponent.focus();
};

LoginHandler.prototype.info = function() { return { moduleId: MODULE_ID, version: VERSION, hasModal: !!this.modal, hasPorts: !!(this.modal && this.modal._ports), portsInitialized: Ports.isInitialized(), savedRememberMe: _loadRememberMePreference(), metrics: Object.assign({}, this._metrics), p22Compliant: true, timestamp: Date.now() }; };

LoginHandler.prototype.healthCheck = function() {
  const modal = this.modal; const logger = _getPort('logger');
  const checks = { hasModal: !!modal, hasAuthAPI: !!(modal && modal.authAPI), hasValidator: !!(modal && modal.validator), hasRateLimiter: !!(modal && modal.rateLimiter), hasPorts: !!(modal && modal._ports), loggerAvailable: !!logger };
  let passed = 0; if (checks.hasModal) passed++; if (checks.hasAuthAPI) passed++; if (checks.hasValidator) passed++; if (checks.hasRateLimiter) passed++; if (checks.hasPorts) passed++; if (checks.loggerAvailable) passed++;
  const status = passed === 6 ? 'HEALTHY' : (passed >= 4 ? 'DEGRADED' : 'UNHEALTHY');
  return { status, score: `${passed}/6`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), p22Compliant: true, timestamp: Date.now() };
};

export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), p22Compliant: true, timestamp: Date.now() }; }
export function healthCheck() { const logger = _getPort('logger'); const checks = { moduleLoaded: true, classAvailable: typeof LoginHandler === 'function', loggerAvailable: !!logger }; const passed = checks.moduleLoaded && checks.classAvailable && checks.loggerAvailable ? 3 : (checks.moduleLoaded && checks.classAvailable ? 2 : 1); return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), p22Compliant: true, timestamp: Date.now() }; }

export { VERSION, MODULE_ID };
export default LoginHandler;
