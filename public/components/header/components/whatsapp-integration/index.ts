// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.7.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/whatsapp-integration
// PURPOSE: WhatsApp Integration - Enterprise Premium
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
//   IntegrationAPI from ./api/fetch.js
//
// PROVIDES:
//   VERSION — module constant
//   id — exported value
//   capabilities — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   WhatsAppIntegrationComponent() — exported function
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
import IntegrationAPI from './api/fetch.js';
import { LifecycleManager } from './core/lifecycle.js';
import { StateStore } from './state/store.js';
import { Logger } from './telemetry/logger.js';
import { TelemetryTracker } from './telemetry/tracker.js';
import { PollingCoordinator } from './core/polling.js';

export const VERSION = '9.7.0-P1-UARPS';
export const id = 'whatsapp-integration';
export const capabilities = { type: 'integration', reorderable: true, hideable: true, critical: false, rendersUI: true };
export const MODULE_ID = 'header/components/whatsapp-integration';

const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string,unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const emitUIAction = (data = {}) => { const eventBus = _getPort('eventBus'); if (!eventBus || !eventBus.emit) return; eventBus.emit(UI_EVENTS.ACTION, { actionId: 'header:whatsapp-integration', source: MODULE_ID, timestamp: Date.now(), meta: Object.assign({ kind: 'ui' }, data) }); };

(function loadCSS() { const cssPath = '/components/header/components/whatsapp-integration/component.css'; if (!document.querySelector(`link[href="${cssPath}"]`)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = cssPath; document.head.appendChild(link); } })();

const ICON_WHATSAPP = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 176 176"><rect fill="#29a71a" height="176" rx="24" width="176"/><g fill="#fff"><path d="m126.8 49.2a54.57 54.57 0 0 0 -87.42 63.13l-5.79 28.11a2.08 2.08 0 0 0 .33 1.63 2.11 2.11 0 0 0 2.24.87l27.55-6.53a54.56 54.56 0 0 0 63.09-87.21zm-8.59 68.56a42.74 42.74 0 0 1 -49.22 8l-3.84-1.9-16.89 4 .05-.21 3.5-17-1.88-3.71a42.72 42.72 0 0 1 7.86-49.59 42.73 42.73 0 0 1 60.42 0 2.28 2.28 0 0 0 .22.22 42.72 42.72 0 0 1 -.22 60.19z"/><path d="m116.71 105.29c-2.07 3.26-5.34 7.25-9.45 8.24-7.2 1.74-18.25.06-32-12.76l-.17-.15c-12.09-11.21-15.23-20.54-14.47-27.94.42-4.2 3.92-8 6.87-10.48a3.93 3.93 0 0 1 6.15 1.41l4.45 10a3.91 3.91 0 0 1 -.49 4l-2.25 2.92a3.87 3.87 0 0 0 -.35 4.32c1.26 2.21 4.28 5.46 7.63 8.47 3.76 3.4 7.93 6.51 10.57 7.57a3.82 3.82 0 0 0 4.19-.88l2.61-2.63a4 4 0 0 1 3.9-1l10.57 3a4 4 0 0 1 2.24 5.91z"/></g></svg>';

export function WhatsAppIntegrationComponent(this: any, options: Record<string,unknown>) {
  options = options || {};
  this.container = options.container;
  this.store = new StateStore({ unreadCount: 0, status: 'loading' });
  this.lifecycle = new LifecycleManager(this);
  this.logger = (new (Logger as unknown as { new(..._args: unknown[]): {[k:string]:Function} })({ prefix: '[WhatsApp]', debug: false }));
  this.telemetry = new TelemetryTracker();
  this.api = (new (IntegrationAPI as unknown as { new(..._args: unknown[]): {[k:string]:Function} })());
  this.element = null;
  this.isDestroyed = false;
  this.polling = null;
  this.unsubscribe = null;
  this._metrics = { mountCount: 0, fetchCount: 0, lastMountAt: null, lastFetchAt: null };
}

WhatsAppIntegrationComponent.prototype.mount = function() {
  const self = this;
  if (this.isDestroyed) return Promise.resolve();
  _initPorts();
  return this.lifecycle.mount().then(() => {
    self.render();
    return self.fetchStatus();
  }).then(() => {
    self.startPolling();
    self._metrics.mountCount++;
    self._metrics.lastMountAt = Date.now();
    const eb = _getPort('eventBus');
    if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.MOUNTED, { componentId: id, moduleId: MODULE_ID, timestamp: Date.now() });
  });
};

WhatsAppIntegrationComponent.prototype.render = function() {
  const self = this;
  this.element = document.createElement('div');
  this.element.className = 'whatsapp-integration-component';
  this.element.title = 'WhatsApp';
  this.element.dataset.status = 'loading';
  this.element.dataset.count = '0';
  this.element.setAttribute('data-uarps-trigger', 'trigger:header:open-whatsapp-integration');
  this.element.innerHTML = `<div class="integration-icon">${ICON_WHATSAPP}</div><span class="integration-badge">0</span>`;
  if (this.container) this.container.appendChild(this.element);
  this.element.style.cursor = 'pointer';
  this.element.addEventListener('click', () => { emitUIAction({ clicked: true, value: self.store && self.store.getState ? self.store.getState().unreadCount : 0 }); });
  this.unsubscribe = this.store.subscribe((state: Record<string,unknown>) => { if (!self.element || self.isDestroyed) return; self.updateUI(state); });
};

WhatsAppIntegrationComponent.prototype.updateUI = function(state: Record<string,unknown>) {
  const badgeEl = this.element.querySelector('.integration-badge');
  // @ts-expect-error TS migration - TS2365
  if (state.unreadCount !== null) { this.element.dataset.count = String(state.unreadCount); this.element.dataset.status = state.unreadCount > 0 ? 'has-unread' : 'ok'; badgeEl.textContent = state.unreadCount > 99 ? '99+' : state.unreadCount; }
  else { this.element.dataset.count = '0'; this.element.dataset.status = 'offline'; }
};

WhatsAppIntegrationComponent.prototype.fetchStatus = function() {
  const self = this;
  if (this.isDestroyed) return Promise.resolve();
  this._metrics.fetchCount++;
  this._metrics.lastFetchAt = Date.now();
  return this.api.fetchStatus().then((data: Record<string,unknown>) => {
    if (self.isDestroyed) return;
    self.store.setState({ unreadCount: data.unread_count || 0, status: 'ok', lastUpdate: new Date().toISOString() });
    const eb = _getPort('eventBus');
    if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.DATA_UPDATED, { componentId: id, moduleId: MODULE_ID, data: { unreadCount: data.unread_count }, timestamp: Date.now() });
  }).catch(() => { if (!self.isDestroyed) self.store.setState({ status: 'offline' }); });
};

WhatsAppIntegrationComponent.prototype.startPolling = function() {
  const self = this;
  if (this.isDestroyed) return;
  this.polling = new PollingCoordinator({ interval: 60000 });
  this.polling.onPoll(() => self.fetchStatus());
  this.polling.start();
};

WhatsAppIntegrationComponent.prototype.unmount = function() {
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

WhatsAppIntegrationComponent.prototype.healthCheck = function() {
  const eb = _getPort('eventBus');
  const checks = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!eb, pollingActive: !!this.polling, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 5 ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: 5, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID };
};

WhatsAppIntegrationComponent.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, id, capabilities, mounted: !!this.element, unreadCount: this.store.getState().unreadCount, portsInitialized: Ports.isInitialized(), metrics: this._metrics }; };

export default WhatsAppIntegrationComponent;
