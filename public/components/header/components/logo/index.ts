// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/logo
// PURPOSE: Logo Component - Enterprise Premium
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   COMPONENT_EVENTS from /core/runtime/events/catalog/component.events.js
//   LifecycleManager from ./core/lifecycle.js
//   StateStore from ./state/store.js
//   Logger from ./telemetry/logger.js
//   TelemetryTracker from ./telemetry/tracker.js
//
// PROVIDES:
//   VERSION — module constant
//   id — exported value
//   capabilities — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   LogoComponent() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   'logo:click'
//   COMPONENT_EVENTS.MOUNTED
//   COMPONENT_EVENTS.UNMOUNTED
// LISTENS (eventos):
//   'click'
//   'theme:changed'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { COMPONENT_EVENTS } from '/core/runtime/events/catalog/component.events.js';
import { LifecycleManager } from './core/lifecycle.js';
import { StateStore } from './state/store.js';
import { Logger } from './telemetry/logger.js';
import { TelemetryTracker } from './telemetry/tracker.js';

export const VERSION = '1.1.0-ES6';
export const id = 'logo';
export const capabilities = { type: 'brand', reorderable: false, hideable: false, critical: true, rendersUI: true };

export const MODULE_ID = 'header/components/logo';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

(function loadCSS() {
  const cssPath = '/components/header/components/logo/component.css';
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    document.head.appendChild(link);
  }
})();

export function LogoComponent(this: any, options: Record<string,unknown>) {
  options = options || {};
  this.container = options.container;
  this.config = options.config || {};
  this.store = new StateStore({ theme: 'light', visible: true });
  this.eventBus = _getPort('eventBus');
  this.lifecycle = new LifecycleManager(this);
  const cfg = _getPort('config');
  this.logger = (new (Logger as unknown as { new(..._args: unknown[]): {[k:string]:Function} })({ prefix: '[Logo]', debug: cfg && cfg.app && cfg.app.debug }));
  this.telemetry = new TelemetryTracker();
  this.element = null;
  this.isDestroyed = false;
  this.unsubscribe = null;
  this._metrics = { mountCount: 0, clickCount: 0, lastMountAt: null };
}

LogoComponent.prototype.mount = function() {
  const self = this;
  if (this.isDestroyed) return Promise.resolve();
  _initPorts();
  return this.lifecycle.mount().then(() => {
    self.render();
    self.bindEvents();
    self._metrics.mountCount++;
    self._metrics.lastMountAt = Date.now();
    const eb = _getPort('eventBus');
    if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.MOUNTED, { componentId: id, moduleId: MODULE_ID, timestamp: Date.now() });
  });
};

LogoComponent.prototype.render = function() {
  const self = this;
  this.element = document.createElement('a');
  this.element.className = 'logo-component';
  this.element.href = '/';
  this.element.title = 'DShow Dashboard - Ir para início';
  this.element.dataset.status = 'ok';
  this.element.setAttribute('aria-label', 'Logo DShow Dashboard - Ir para página inicial');
  this.element.innerHTML = '<img src="/assets/images/logo.png" alt="DShow Dashboard" class="logo-image" />';
  if (this.container) this.container.appendChild(this.element);
  this.unsubscribe = this.store.subscribe((state: Record<string,unknown>) => {
    if (!self.element || self.isDestroyed) return;
    self.updateUI(state);
  });
};

LogoComponent.prototype.updateUI = function(state: Record<string,unknown>) {
  if (!this.element) return;
  this.element.dataset.theme = state.theme;
  this.element.style.display = state.visible ? 'flex' : 'none';
};

LogoComponent.prototype.bindEvents = function() {
  const self = this;
  if (!this.element) return;
  this.element.addEventListener('click', (e: Event) => {
    self._metrics.clickCount++;
    self.telemetry.track('logo:click', { timestamp: Date.now() });
    const eb = _getPort('eventBus');
    if (eb && eb.emit) eb.emit('logo:click', { timestamp: Date.now() });
  });
  const eb = _getPort('eventBus');
  if (eb && eb.on) {
    eb.on('theme:changed', (data: Record<string,unknown>) => {
      self.store.setState({ theme: data.theme || 'light' });
    });
  }
};

LogoComponent.prototype.unmount = function() {
  const self = this;
  this.isDestroyed = true;
  return this.lifecycle.unmount().then(() => {
    if (self.unsubscribe) { self.unsubscribe(); self.unsubscribe = null; }
    if (self.store) self.store.reset();
    if (self.element) { self.element.remove(); self.element = null; }
    const eb = _getPort('eventBus');
    if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.UNMOUNTED, { componentId: id, moduleId: MODULE_ID, timestamp: Date.now() });
  });
};

LogoComponent.prototype.healthCheck = function() {
  const eb = _getPort('eventBus');
  const checks = {
    isMounted: !!this.element,
    hasStore: !!this.store,
    hasGlobalEventBus: !!eb,
    imageLoaded: this.element ? !!this.element.querySelector('img') : false,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 5 ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: 5,
    checks,
    portsInitialized: Ports.isInitialized(),
    version: VERSION,
    moduleId: MODULE_ID
  };
};

LogoComponent.prototype.info = function() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    id,
    capabilities,
    portsInitialized: Ports.isInitialized(),
    mounted: !!this.element,
    theme: this.store.getState().theme,
    metrics: this._metrics
  };
};

export default LogoComponent;
