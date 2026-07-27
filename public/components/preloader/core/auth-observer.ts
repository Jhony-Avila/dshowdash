// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.7.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-auth-observer
// PURPOSE: Auth Observer - Preloader System
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS from /core/runtime/events/index.js
//   PHASES from ./state.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   AuthObserver() — exported function
//   getVersion() — exported function
//   getModuleMetrics() — exported function
//   moduleHealthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   AUTH_EVENTS.LOGIN_SUCCESS
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { PHASES } from './state.js';

export const VERSION = '1.7.0-P18EC';
export const MODULE_ID = 'preloader-auth-observer';

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return hasWindow && cfg && cfg.app && cfg.app.debug === true; };
const _log = function(level?: 'error' | 'warn' | 'info' | 'debug', ...rest: any[]) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort('logger');
  if (!logger) return;
  if (level === 'error') { if (logger.error) logger.error(`[${MODULE_ID}]`, args.join(' ')); return; }
  if (level === 'warn') { if (logger.warn) logger.warn(`[${MODULE_ID}]`, args.join(' ')); return; }
  if (_debugEnabled() && logger.debug) logger.debug(`[${MODULE_ID}]`, args.join(' '));
};

const _moduleMetrics = { instancesCreated: 0, observeCount: 0, loginSuccessCount: 0, timeoutCount: 0, mutationDetections: 0 };

export function AuthObserver(this: any, options: Record<string, unknown>) {
  this.eventBus = options.eventBus;
  this.cleanupManager = options.cleanupManager;
  this.timers = options.timers;
  this.config = options.config;
  this.addTrace = options.addTrace;
  this.transitionPhase = options.transitionPhase;
  this.iniciarDashboard = options.iniciarDashboard;
  this._observing = false;
  this._resolved = false;
  this._startedAt = null;
  this._resolvedAt = null;
  this._resolveMethod = null;
  _moduleMetrics.instancesCreated++;
  _initPorts();
}

AuthObserver.prototype.observe = function() {
  const self = this;
  if (!hasDocument) return;
  _log('info', 'Aguardando autenticacao...');
  _moduleMetrics.observeCount++;
  self._observing = true;
  self._startedAt = Date.now();
  self.transitionPhase(PHASES.WAIT_AUTH, true);
  let loginResolved = false;

  self.timers.login = setTimeout(() => {
    if (!loginResolved) {
      _log('warn', `Login timeout (${self.config.timeoutLogin}ms)`);
      self.addTrace('timeout:login');
      _moduleMetrics.timeoutCount++;
    }
  }, self.config.timeoutLogin);

  const loginPromise = new Promise(resolve => {
    const handleLoginSuccess = (data: Record<string, unknown>) => {
      if (!loginResolved) {
        loginResolved = true;
        if (self.timers.login) { clearTimeout(self.timers.login); delete self.timers.login; }
        _moduleMetrics.loginSuccessCount++;
        resolve({ method: 'event-bus', data });
      }
    };

    self.eventBus.on(AUTH_EVENTS.LOGIN_SUCCESS, handleLoginSuccess);

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-auth-ready') {
          if (document.body.dataset.authReady === 'true' && !loginResolved) {
            loginResolved = true;
            if (self.timers.login) { clearTimeout(self.timers.login); delete self.timers.login; }
            observer.disconnect();
            _moduleMetrics.mutationDetections++;
            _moduleMetrics.loginSuccessCount++;
            resolve({ method: 'mutation-observer', data: {} });
          }
        }
      });
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['data-auth-ready'] });
    self.cleanupManager.addObserver(observer);
  });

  // @ts-expect-error strict migration — TS2345
  loginPromise.then((result: Record<string, any>) => {
    self._resolved = true;
    self._resolvedAt = Date.now();
    self._resolveMethod = result.method;
    self._observing = false;
    _log('info', `LOGIN BEM-SUCEDIDO (via ${result.method})`);
    self.addTrace('login:success', { method: result.method, user: result.data ? result.data.user : null });
    self.timers.loginDelay = setTimeout(() => { self.iniciarDashboard(); }, 500);
  });
};

AuthObserver.prototype.getMetrics = function() { return { observing: this._observing, resolved: this._resolved, startedAt: this._startedAt, resolvedAt: this._resolvedAt, resolveMethod: this._resolveMethod, duration: this._startedAt ? ((this._resolvedAt || Date.now()) - this._startedAt) : null }; };

AuthObserver.prototype.healthCheck = function() {
  const checks = { hasEventBus: !!this.eventBus, hasCleanupManager: !!this.cleanupManager, hasConfig: !!this.config, notStale: !this._observing || (Date.now() - this._startedAt) < 60000, hasLogger: !!_getPort('logger'), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : (passed >= 4 ? 'DEGRADED' : 'UNHEALTHY'), score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, observing: this._observing, resolved: this._resolved, resolveMethod: this._resolveMethod, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};

AuthObserver.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, observing: this._observing, resolved: this._resolved, resolveMethod: this._resolveMethod, portsInitialized: Ports.isInitialized(), metrics: this.getMetrics(), healthCheck: this.healthCheck() }; };
AuthObserver.prototype.getVersion = () => VERSION;

export function getVersion() { return VERSION; }
export function getModuleMetrics() { return Object.assign({}, _moduleMetrics); }

export function moduleHealthCheck() {
  const checks = { hasDocument, instancesCreated: _moduleMetrics.instancesCreated >= 0, lowTimeoutRate: _moduleMetrics.observeCount === 0 || (_moduleMetrics.timeoutCount / _moduleMetrics.observeCount) < 0.5, hasLogger: !!_getPort('logger'), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : (passed >= 3 ? 'DEGRADED' : 'UNHEALTHY'), score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, moduleMetrics: Object.assign({}, _moduleMetrics), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
