// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/errors-status
// PURPOSE: Errors Status - Enterprise Premium
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//   COMPONENT_EVENTS from /core/runtime/events/catalog/component.events.js
//   LifecycleManager from ./core/lifecycle.js
//   StateStore from ./state/store.js
//   Logger from ./telemetry/logger.js
//   TelemetryTracker from ./telemetry/tracker.js
//   PollingCoordinator from ./core/polling.js
//   ErrorsAPI from ./api/fetch.js
//
// PROVIDES:
//   VERSION — module constant
//   id — exported value
//   capabilities — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   ErrorsStatusComponent() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   COMPONENT_EVENTS.DATA_UPDATED
//   COMPONENT_EVENTS.MOUNTED
//   COMPONENT_EVENTS.UNMOUNTED
//   UI_EVENTS.ACTION
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { COMPONENT_EVENTS } from '/core/runtime/events/catalog/component.events.js';

export const VERSION = '8.8.0-P1-UARPS';
export const id = 'errors-status';
export const capabilities = { type: 'indicator', reorderable: false, hideable: false, critical: true, rendersUI: true };

export const MODULE_ID = 'header/components/errors-status';

import ErrorsAPI from './api/fetch.js';
import { LifecycleManager } from './core/lifecycle.js';
import { StateStore } from './state/store.js';
import { Logger } from './telemetry/logger.js';
import { TelemetryTracker } from './telemetry/tracker.js';
import { PollingCoordinator } from './core/polling.js';

const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string,unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

(function loadCSS() { const cssPath = '/components/header/components/errors-status/component.css'; if (!document.querySelector(`link[href="${cssPath}"]`)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = cssPath; document.head.appendChild(link); } })();

const emitUIAction = (data = {}) => { const eventBus = _getPort('eventBus'); if (!eventBus || !eventBus.emit) return; eventBus.emit(UI_EVENTS.ACTION, { actionId: 'header:errors-status', source: MODULE_ID, timestamp: Date.now(), kind: 'ui', meta: Object.assign({ label: 'Erros do Sistema' }, data) }); };

const ICON_WARNING = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="m208.587 54.407-201.17 348.437c-21.073 36.499 5.268 82.122 47.413 82.122h402.34c42.145 0 68.486-45.624 47.413-82.122l-201.17-348.437c-21.072-36.498-73.754-36.498-94.826 0z" fill="#da4a54"/><path d="m54.83 443.76c-6.802 0-10.267-4.242-11.727-6.771s-3.401-7.65 0-13.542l201.17-348.436c3.401-5.891 8.807-6.771 11.727-6.771s8.326.88 11.727 6.771l201.17 348.436c3.401 5.891 1.46 11.013 0 13.541-1.46 2.529-4.925 6.771-11.727 6.771h-402.34z" fill="#f6e266"/><g fill="#544f57"><path d="m256 327.138c-14.379 0-26.036-11.657-26.036-26.036v-119.216c0-14.379 11.657-26.036 26.036-26.036 14.379 0 26.036 11.657 26.036 26.036v119.217c0 14.379-11.657 26.035-26.036 26.035z"/><circle cx="256" cy="381.152" r="26.036"/></g></svg>';

export function ErrorsStatusComponent(this: any, options: Record<string,unknown>) {
  options = options || {};
  this.container = options.container;
  this.store = new StateStore({ errorCount: 0, status: 'loading' });
  this.eventBus = _getPort('eventBus');
  this.lifecycle = new LifecycleManager(this);
  const cfg = _getPort('config');
  this.logger = (new (Logger as unknown as { new(..._args: unknown[]): {[k:string]:Function} })({ prefix: '[Errors]', debug: cfg && cfg.app && cfg.app.debug }));
  this.telemetry = new TelemetryTracker();

  // @ts-expect-error TS migration - TS2554
  this.api = new ErrorsAPI();
  this.element = null;
  this.isDestroyed = false;
  this.polling = null;
  this.unsubscribe = null;
  this._metrics = { mountCount: 0, fetchCount: 0, clickCount: 0, lastMountAt: null, lastFetchAt: null, lastClickAt: null };
}

ErrorsStatusComponent.prototype.mount = function() {
  const self = this;
  if (this.isDestroyed) return Promise.resolve();
  _initPorts();
  return this.lifecycle.mount().then(() => {
    self.render();
    return self.fetchErrors();
  }).then(() => {
    self.startPolling();
    self._metrics.mountCount++;
    self._metrics.lastMountAt = Date.now();
    const eb = _getPort('eventBus');
    if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.MOUNTED, { componentId: id, moduleId: MODULE_ID, timestamp: Date.now() });
  });
};

ErrorsStatusComponent.prototype.render = function() {
  const self = this;
  this.element = document.createElement('div');
  this.element.className = 'errors-status-component';
  this.element.title = 'Erros do Sistema';
  this.element.dataset.status = 'loading';
  this.element.dataset.count = '0';
  this.element.setAttribute('data-uarps-trigger', 'trigger:header:open-errors-status');
  this.element.innerHTML = `<div class="errors-icon">${ICON_WARNING}</div><span class="errors-badge">0</span>`;
  this.element.addEventListener('click', () => { self._metrics.clickCount++; self._metrics.lastClickAt = Date.now(); emitUIAction({ clicked: true, value: self.store && self.store.getState ? self.store.getState().errorCount : 0 }); });
  if (this.container) this.container.appendChild(this.element);
  this.unsubscribe = this.store.subscribe((state: Record<string,unknown>) => { if (!self.element || self.isDestroyed) return; self.updateUI(state); });
};

ErrorsStatusComponent.prototype.updateUI = function(state: Record<string,unknown>) {
  const badgeEl = this.element.querySelector('.errors-badge');
  // @ts-expect-error TS migration - TS2365
  if (state.errorCount !== null) { this.element.dataset.count = String(state.errorCount); this.element.dataset.status = state.errorCount > 0 ? 'has-errors' : 'ok'; badgeEl.textContent = state.errorCount > 99 ? '99+' : state.errorCount; }
  else { this.element.dataset.count = '0'; this.element.dataset.status = 'offline'; }
};

ErrorsStatusComponent.prototype.fetchErrors = function() {
  const self = this;
  if (this.isDestroyed) return Promise.resolve();
  this._metrics.fetchCount++;
  this._metrics.lastFetchAt = Date.now();
  return this.api.fetchErrors().then((data: Record<string,unknown>) => {
    if (self.isDestroyed) return;
    self.store.setState({ errorCount: data.error_count || 0, status: 'ok', lastUpdate: new Date().toISOString() });
    const eb = _getPort('eventBus');
    if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.DATA_UPDATED, { componentId: id, moduleId: MODULE_ID, data: { errorCount: data.error_count }, timestamp: Date.now() });
  }).catch(() => { if (!self.isDestroyed) self.store.setState({ status: 'offline' }); });
};

ErrorsStatusComponent.prototype.startPolling = function() { const self = this; if (this.isDestroyed) return; this.polling = new PollingCoordinator({ interval: 30000 }); this.polling.onPoll(() => self.fetchErrors()); this.polling.start(); };

ErrorsStatusComponent.prototype.unmount = function() {
  const self = this;
  this.isDestroyed = true;
  return this.lifecycle.unmount().then(() => {
    if (self.polling) { self.polling.stop(); self.polling = null; }
    if (self.unsubscribe) { self.unsubscribe(); self.unsubscribe = null; }
    if (self.store) self.store.reset();
    if (self.element) { self.element.remove(); self.element = null; }
    const eb = _getPort('eventBus');
    if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.UNMOUNTED, { componentId: id, moduleId: MODULE_ID, timestamp: Date.now() });
  });
};

ErrorsStatusComponent.prototype.healthCheck = function() {
  const eb = _getPort('eventBus');
  const checks = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!eb, pollingActive: !!this.polling, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 5 ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: 5, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID };
};

ErrorsStatusComponent.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, id, capabilities, portsInitialized: Ports.isInitialized(), mounted: !!this.element, errorCount: this.store.getState().errorCount, metrics: this._metrics }; };

export default ErrorsStatusComponent;
