// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-dom-manager
// PURPOSE: Preloader DOM Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   SELECTORS — exported value
//   PreloaderDOMManager — exported class
//   createDOMManager() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

export const VERSION = '1.2.0-P17WI';
export const MODULE_ID = 'preloader-dom-manager';

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _log(level: 'error' | 'warn' | 'info' | 'debug', msg: string, ctx?: Record<string, unknown>) {
  const logger = _getPort('logger');
  if (!logger) return;
  ctx = ctx || {};
  ctx.component = MODULE_ID;
  if (level === 'error') { if (logger.error) logger.error(msg, ctx); return; }
  if (level === 'warn') { if (logger.warn) logger.warn(msg, ctx); return; }
  if (level === 'info') { if (logger.info) logger.info(msg, ctx); return; }
  if (logger.debug) logger.debug(msg, ctx);
}

export const SELECTORS = { ROOT: '[data-preloader-root]', VIDEO: '[data-preloader-video]', LOGO_CONTAINER: '[data-preloader-logo]', LOGO_IMAGE: '[data-preloader-logo] img', TEXT: '[data-preloader-text]', PROGRESS_WRAPPER: '[data-preloader-progress-wrapper]', PROGRESS_BAR: '[data-preloader-progress-bar]', PERCENTAGE: '[data-preloader-percentage]', DEGRADED_MESSAGE: '[data-preloader-degraded]' };

export function PreloaderDOMManager(this: any, options: Record<string, any> = {}) {
  this.instanceId = `preloader_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  this.root = null;
  this.mounted = false;
  this.container = options.container || null;
  this.useShadowDOM = options.useShadowDOM || false;
  this.shadowRoot = null;
  this._elements = {};
  this._listeners = [];
  this._metrics = { mounts: 0, unmounts: 0, updates: 0, queries: 0 };
  _initPorts();
  _log('debug', 'DOM Manager created', { instanceId: this.instanceId });
}

PreloaderDOMManager.prototype.mount = function(html: string) {
  const self = this;
  if (self.mounted) { _log('warn', 'Already mounted, unmounting first'); self.unmount(); }
  const container = self.container || (hasDocument ? document.body : null);
  if (!container) { _log('error', 'No container available for mount'); return false; }

  self.root = document.createElement('div');
  self.root.setAttribute('data-preloader-root', '');
  self.root.setAttribute('data-instance-id', self.instanceId);
  self.root.setAttribute('data-module-id', MODULE_ID);
  self.root.setAttribute('role', 'status');
  self.root.setAttribute('aria-live', 'polite');
  self.root.setAttribute('aria-label', 'Carregando aplicação');
  self.root.setAttribute('aria-busy', 'true');
  self.root.className = 'preloader-root';

  if (self.useShadowDOM) { self.shadowRoot = self.root.attachShadow({ mode: 'open' }); self.shadowRoot.innerHTML = html; _log('debug', 'Mounted with Shadow DOM'); }
  else { self.root.innerHTML = html; }

  container.insertBefore(self.root, container.firstChild);
  self._elements = {};
  self.mounted = true;
  self._metrics.mounts++;
  _log('info', 'Preloader DOM mounted', { instanceId: self.instanceId, useShadowDOM: self.useShadowDOM });
  return true;
};

PreloaderDOMManager.prototype.unmount = function() {
  const self = this;
  if (!self.mounted || !self.root) { return false; }
  self._removeAllListeners();
  if (self.root.parentNode) { self.root.parentNode.removeChild(self.root); }
  self.root = null;
  self.shadowRoot = null;
  self._elements = {};
  self.mounted = false;
  self._metrics.unmounts++;
  _log('info', 'Preloader DOM unmounted', { instanceId: self.instanceId });
  return true;
};

PreloaderDOMManager.prototype.query = function(selector: string, useCache?: boolean) {
  const self = this;
  self._metrics.queries++;
  if (!self.mounted) return null;
  useCache = useCache !== false;
  if (useCache && self._elements[selector]) { return self._elements[selector]; }
  const context = self.shadowRoot || self.root;
  const element = context ? context.querySelector(selector) : null;
  if (element && useCache) { self._elements[selector] = element; }
  return element;
};

PreloaderDOMManager.prototype.queryAll = function(selector: string) { if (!this.mounted) return []; const context = this.shadowRoot || this.root; return Array.from(context ? context.querySelectorAll(selector) : []); };
PreloaderDOMManager.prototype.getVideo = function() { return this.query(SELECTORS.VIDEO); };
PreloaderDOMManager.prototype.getLogoContainer = function() { return this.query(SELECTORS.LOGO_CONTAINER); };
PreloaderDOMManager.prototype.getLogoImage = function() { return this.query(SELECTORS.LOGO_IMAGE); };
PreloaderDOMManager.prototype.getText = function() { return this.query(SELECTORS.TEXT); };
PreloaderDOMManager.prototype.getProgressWrapper = function() { return this.query(SELECTORS.PROGRESS_WRAPPER); };
PreloaderDOMManager.prototype.getProgressBar = function() { return this.query(SELECTORS.PROGRESS_BAR); };
PreloaderDOMManager.prototype.getPercentage = function() { return this.query(SELECTORS.PERCENTAGE); };
PreloaderDOMManager.prototype.getDegradedMessage = function() { return this.query(SELECTORS.DEGRADED_MESSAGE); };
PreloaderDOMManager.prototype.getRoot = function() { return this.root; };

PreloaderDOMManager.prototype.setProgress = function(percent: number) {
  const bar = this.getProgressBar();
  const text = this.getPercentage();
  if (bar) { bar.style.width = `${Math.min(100, Math.max(0, percent))}%`; }
  if (text) { text.textContent = `${Math.round(percent)}%`; }
  this._metrics.updates++;
};

PreloaderDOMManager.prototype.setText = function(message: string) { const text = this.getText(); if (text) { text.textContent = message; this._metrics.updates++; } };

PreloaderDOMManager.prototype.setVisible = function(visible: boolean) {
  if (!this.root) return;
  if (visible) { this.root.classList.add('visible'); this.root.classList.remove('hidden'); this.root.setAttribute('aria-hidden', 'false'); }
  else { this.root.classList.remove('visible'); this.root.classList.add('hidden'); this.root.setAttribute('aria-hidden', 'true'); }
  this._metrics.updates++;
};

PreloaderDOMManager.prototype.addClass = function(className: string) { if (this.root) { this.root.classList.add(className); } };
PreloaderDOMManager.prototype.removeClass = function(className: string) { if (this.root) { this.root.classList.remove(className); } };

PreloaderDOMManager.prototype.setDegradedMessage = function(message: string) {
  const self = this;
  let degraded = self.getDegradedMessage();
  if (!degraded && self.root) {
    degraded = document.createElement('div');
    degraded.setAttribute('data-preloader-degraded', '');
    degraded.className = 'preloader-degraded-message';
    degraded.setAttribute('role', 'alert');
    self.root.appendChild(degraded);
    self._elements[SELECTORS.DEGRADED_MESSAGE] = degraded;
  }
  if (degraded) { degraded.textContent = message; degraded.style.display = message ? 'block' : 'none'; }
  self._metrics.updates++;
};

PreloaderDOMManager.prototype.clearDegradedMessage = function() { const degraded = this.getDegradedMessage(); if (degraded) { degraded.remove(); delete this._elements[SELECTORS.DEGRADED_MESSAGE]; } };

PreloaderDOMManager.prototype.playVideo = function() {
  const video = this.getVideo();
  if (!video) return Promise.resolve(false);
  return video.play().then(() => true).catch((e: Error) => { _log('debug', 'Video autoplay blocked', { error: e.message }); return false; });
};

PreloaderDOMManager.prototype.pauseVideo = function() { const video = this.getVideo(); if (video) { video.pause(); } };
PreloaderDOMManager.prototype.setVideoSource = function(src: string) { const video = this.getVideo(); if (video) { const source = video.querySelector('source'); if (source) { source.src = src; video.load(); } } };

PreloaderDOMManager.prototype.on = function(selector: string | EventTarget, event: string, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
  const self = this;
  const element = typeof selector === 'string' ? self.query(selector) : selector;
  if (!element) return null;
  options = options || {};
  element.addEventListener(event, handler, options);
  const listener = { element, event, handler, options };
  self._listeners.push(listener);
  return () => { self._removeListener(listener); };
};

PreloaderDOMManager.prototype._removeListener = function(listener: Record<string, any>) {
  listener.element.removeEventListener(listener.event, listener.handler, listener.options);
  const idx = this._listeners.indexOf(listener);
  if (idx > -1) this._listeners.splice(idx, 1);
};

PreloaderDOMManager.prototype._removeAllListeners = function() {
  const self = this;
  self._listeners.forEach((listener: Record<string, any>) => { try { listener.element.removeEventListener(listener.event, listener.handler, listener.options); } catch (e) {} });
  self._listeners = [];
};

PreloaderDOMManager.prototype.fadeOut = function(duration?: number) {
  const self = this;
  duration = duration || 300;
  if (!self.root) return Promise.resolve();
  return new Promise<void>(resolve => {
    self.root.style.transition = `opacity ${duration}ms ease-out`;
    self.root.style.opacity = '0';
    setTimeout(() => { self.setVisible(false); resolve(); }, duration);
  });
};

PreloaderDOMManager.prototype.fadeIn = function(duration?: number) {
  const self = this;
  duration = duration || 300;
  if (!self.root) return Promise.resolve();
  self.root.style.opacity = '0';
  self.setVisible(true);
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      self.root.style.transition = `opacity ${duration}ms ease-in`;
      self.root.style.opacity = '1';
      setTimeout(resolve, duration);
    });
  });
};

PreloaderDOMManager.prototype.setAriaLabel = function(label: string) { if (this.root) { this.root.setAttribute('aria-label', label); } };
PreloaderDOMManager.prototype.setAriaBusy = function(busy: boolean) { if (this.root) { this.root.setAttribute('aria-busy', String(busy)); } };

PreloaderDOMManager.prototype.announce = function(message: string) {
  const self = this;
  if (!self.root) return;
  let announcer = self.query('[data-preloader-announcer]');
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.setAttribute('data-preloader-announcer', '');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);';
    self.root.appendChild(announcer);
  }
  announcer.textContent = '';
  setTimeout(() => { announcer.textContent = message; }, 100);
};

PreloaderDOMManager.prototype.isMounted = function() { return this.mounted && this.root && this.root.parentNode; };
PreloaderDOMManager.prototype.clearCache = function() { this._elements = {}; };
PreloaderDOMManager.prototype.getMetrics = function() { return Object.assign({}, this._metrics); };
PreloaderDOMManager.prototype.getStatus = function() { return { version: VERSION, moduleId: MODULE_ID, instanceId: this.instanceId, mounted: this.mounted, useShadowDOM: this.useShadowDOM, hasShadowRoot: !!this.shadowRoot, cachedElements: Object.keys(this._elements).length, activeListeners: this._listeners.length, portsInitialized: Ports.isInitialized(), metrics: this.getMetrics() }; };
PreloaderDOMManager.prototype.healthCheck = function() { const isMounted = this.isMounted(); const hasRoot = !!this.root; const noLeakedListeners = this._listeners.length < 50; return { status: isMounted && hasRoot && noLeakedListeners ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, instanceId: this.instanceId, checks: { isMounted, hasRoot, noLeakedListeners, hasLogger: !!_getPort('logger'), portsInitialized: Ports.isInitialized() }, portsInitialized: Ports.isInitialized(), metrics: this.getMetrics(), timestamp: Date.now() }; };
PreloaderDOMManager.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, instanceId: this.instanceId, selectors: SELECTORS, portsInitialized: Ports.isInitialized(), status: this.getStatus(), healthCheck: this.healthCheck() }; };

export function createDOMManager(options?: Record<string, any>) { return new (PreloaderDOMManager as unknown as { new(opts?: Record<string, any>): Record<string, any> })(options); }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { moduleReady: true, hasLogger: !!_getPort('logger'), portsInitialized: Ports.isInitialized() }, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, selectors: SELECTORS, portsInitialized: Ports.isInitialized(), features: ['shadow-dom-support', 'relative-selectors', 'listener-management', 'accessibility'] }; }

export default PreloaderDOMManager;
