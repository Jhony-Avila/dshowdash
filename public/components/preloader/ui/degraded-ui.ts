// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-degraded-ui
// PURPOSE: Degraded UI Manager - Preloader System
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   DegradedUIManager() — exported function
//   injectFallbackScreen() — exported function
//   getVersion() — exported function
//   getModuleMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.__dev
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.5.0-P17WI';
export const MODULE_ID = 'preloader-degraded-ui';

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return hasWindow && cfg && cfg.app && cfg.app.debug === true; };

const _log = function(level?: any, ...rest: any[]) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort('logger');
  if (!logger) return;
  if (level === 'error') { if (logger.error) logger.error(`[${MODULE_ID}]`, args.join(' ')); return; }
  if (level === 'warn') { if (logger.warn) logger.warn(`[${MODULE_ID}]`, args.join(' ')); return; }
  if (_debugEnabled() && logger.debug) logger.debug(`[${MODULE_ID}]`, args.join(' '));
};

const _moduleMetrics = { instancesCreated: 0, fallbacksInjected: 0, lastFallbackAt: null as number | null };

export function DegradedUIManager(this: any) {
  this.$degradedMessage = null;
  this.currentReason = null;
  this._metrics = { showCount: 0, cleanupCount: 0, lastShowAt: null };
  _moduleMetrics.instancesCreated++;
  _initPorts();
}

DegradedUIManager.prototype.showMessage = function(reason: string, $screen: Element, addTrace?: (action: string, data?: Record<string, unknown>) => void) {
  if (!hasDocument || !$screen) return;
  if (this.currentReason === reason && this.$degradedMessage) return;
  this.currentReason = reason;
  this._metrics.showCount++;
  this._metrics.lastShowAt = Date.now();
  if (this.$degradedMessage) { this.$degradedMessage.remove(); }
  const messages: Record<string, string> = { 'waiting-auth': 'Aguardando autenticação...', 'waiting-monitor': 'Carregando módulos do sistema...', 'waiting-components': 'Preparando dashboard...', 'degraded': 'Sistema em modo degradado. Tentando reconectar...' };
  const message = messages[reason] || messages.degraded;
  this.$degradedMessage = document.createElement('div');
  this.$degradedMessage.className = 'preloader-degraded-message';
  this.$degradedMessage.setAttribute('role', 'status');
  this.$degradedMessage.setAttribute('aria-live', 'polite');
  this.$degradedMessage.setAttribute('data-module-id', MODULE_ID);
  this.$degradedMessage.textContent = message;
  $screen.appendChild(this.$degradedMessage);
  if (typeof addTrace === 'function') { addTrace('degraded-message:shown', { reason, message }); }
};

DegradedUIManager.prototype.cleanup = function() { this._metrics.cleanupCount++; if (this.$degradedMessage) { this.$degradedMessage.remove(); this.$degradedMessage = null; } this.currentReason = null; };
DegradedUIManager.prototype.getMetrics = function() { return Object.assign({}, this._metrics); };

DegradedUIManager.prototype.healthCheck = function() {
  const checks = { initialized: true, hasDocument, messageElementValid: this.$degradedMessage === null || this.$degradedMessage instanceof Element, hasLogger: !!_getPort('logger'), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, currentReason: this.currentReason, hasActiveMessage: !!this.$degradedMessage, metrics: this._metrics, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};

DegradedUIManager.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, currentReason: this.currentReason, hasActiveMessage: !!this.$degradedMessage, portsInitialized: Ports.isInitialized(), metrics: this.getMetrics(), healthCheck: this.healthCheck() }; };
DegradedUIManager.prototype.getVersion = () => VERSION;

export function injectFallbackScreen(addTrace?: (action: string) => void) {
  if (!hasDocument) return null;
  _moduleMetrics.fallbacksInjected++;
  _moduleMetrics.lastFallbackAt = Date.now();
  const fallback = document.createElement('div');
  fallback.id = 'loading-screen';
  fallback.setAttribute('role', 'status');
  fallback.setAttribute('aria-live', 'polite');
  fallback.setAttribute('aria-label', 'Carregando');
  fallback.setAttribute('aria-busy', 'true');
  fallback.setAttribute('data-injected-by', 'preloader');
  fallback.setAttribute('data-module-id', MODULE_ID);
  fallback.className = 'visible';
  fallback.innerHTML = '<div class="loading-logo-container"><img src="/assets/icons/logo-square.png" alt="DshowDash Logo" class="loading-logo" width="180" height="168"></div><div class="loading-text">Carregando</div><div class="loading-progress-wrapper"><div class="loading-progress"><div class="loading-progress-bar" id="loading-progress-bar"></div></div><div class="loading-percentage">0%</div></div>';
  document.body.insertBefore(fallback, document.body.firstChild);
  if (typeof addTrace === 'function') { addTrace('fallback-screen:injected'); }
  _log('info', 'Fallback screen injetado');
  return fallback;
}

export function getVersion() { return VERSION; }
export function getModuleMetrics() { return Object.assign({}, _moduleMetrics); }

export function healthCheck() {
  const checks = { hasDocument, hasWindow, bodyAccessible: hasDocument && !!document.body, hasLogger: !!_getPort('logger'), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, moduleMetrics: Object.assign({}, _moduleMetrics), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}

export function info() { return { version: VERSION, moduleId: MODULE_ID, moduleMetrics: getModuleMetrics(), portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() }; }

if (hasWindow) { window.__dev = window.__dev || {}; window.__dev.preloaderDegradedUI = { getVersion, getModuleMetrics, healthCheck, info }; }
