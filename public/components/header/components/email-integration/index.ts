// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v10.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/email-integration
// PURPOSE: Main email integration component with unread count
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//   COMPONENT_EVENTS from /core/runtime/events/catalog/component.events.js
//   navigateToRoute from ../_base/navigation-helper.js
//   IntegrationAPI from ./api/fetch.js
//   LifecycleManager from ./core/lifecycle.js
//   StateStore from ./state/store.js
//   Logger from ./telemetry/logger.js
//   TelemetryTracker from ./telemetry/tracker.js
//   PollingCoordinator from ./core/polling.js
// PROVIDES:
//   VERSION, id, capabilities — component metadata
//   injectPorts(p) — inject external ports
//   getPorts() — get ports snapshot
//   EmailIntegrationComponent(options) — main component constructor
//   EmailIntegrationComponent (default) — default export
// ═══════════════════════════════════════════════════════════════
// Email Integration - Enterprise Premium
// @version 10.1.0-ES6
// @changelog v10.1.0-ES6 - Task 10.1 B05: var → const/let
// @changelog v10.0.0-NAV-ADAPTER - Refatorado para usar NavigationAdapter via navigation-helper
// P18EC: Events Contracts Migration
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { COMPONENT_EVENTS } from '/core/runtime/events/catalog/component.events.js';
import { navigateToRoute } from '../_base/navigation-helper.js';
import IntegrationAPI from './api/fetch.js';
import { LifecycleManager } from './core/lifecycle.js';
import { StateStore } from './state/store.js';
import { Logger } from './telemetry/logger.js';
import { TelemetryTracker } from './telemetry/tracker.js';
import { PollingCoordinator } from './core/polling.js';

export const VERSION = '10.1.0-ES6';
export const id = 'email-integration';
export const capabilities = { type: 'integration', reorderable: true, hideable: true, critical: false, rendersUI: true };
export const MODULE_ID = 'header/components/email-integration';
const ROUTE = '#/panel-outlook';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function emitUIAction(data: Record<string,unknown>) { data = data || {}; const eventBus = _getPort('eventBus'); if (!eventBus || !eventBus.emit) return; eventBus.emit(UI_EVENTS.ACTION, { actionId: 'header:email-integration', source: MODULE_ID, timestamp: Date.now(), meta: Object.assign({ kind: 'ui' }, data) }); }

(function loadCSS() { const cssPath = '/components/header/components/email-integration/component.css'; if (!document.querySelector(`link[href="${cssPath}"]`)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = cssPath; document.head.appendChild(link); } })();

const ICON_EMAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>';

export function EmailIntegrationComponent(this: any, options: Record<string,unknown>) {
  options = options || {};
  this.container = options.container;
  this.store = new StateStore({ received_today: 0, unread: 0, status: 'loading' });
  this.eventBus = _getPort('eventBus');
  this.lifecycle = new LifecycleManager(this);
  const cfg = _getPort('config');
  this.logger = new Logger({ prefix: '[Email]', debug: cfg && cfg.app && cfg.app.debug });
  this.telemetry = new TelemetryTracker();
  this.api = (new (IntegrationAPI as unknown as { new(..._args: unknown[]): {[k:string]:Function} })());
  this.element = null;
  this.isDestroyed = false;
  this.polling = null;
  this.unsubscribe = null;
  this._metrics = { mountCount: 0, fetchCount: 0, clickCount: 0, lastMountAt: null, lastFetchAt: null, lastClickAt: null };
}

EmailIntegrationComponent.prototype.mount = function() {
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

EmailIntegrationComponent.prototype.render = function() {
  const self = this;
  this.element = document.createElement('div');
  this.element.className = 'email-integration-component';
  this.element.title = 'E-mail';
  this.element.dataset.status = 'loading';
  this.element.dataset.count = '0';
  this.element.setAttribute('data-uarps-trigger', 'trigger:header:open-email-integration');
  this.element.innerHTML = `<div class="integration-icon">${ICON_EMAIL}</div><span class="integration-badge">0</span>`;
  if (this.container) this.container.appendChild(this.element);
  this.element.style.cursor = 'pointer';
  this.element.addEventListener('click', () => {
    self._metrics.clickCount++;
    self._metrics.lastClickAt = Date.now();
    emitUIAction({ clicked: true, value: self.store && self.store.getState ? self.store.getState().received_today : 0 });
    navigateToRoute(ROUTE, MODULE_ID);
  });
  this.unsubscribe = this.store.subscribe((state: Record<string,unknown>) => { if (!self.element || self.isDestroyed) return; self.updateUI(state); });
};

EmailIntegrationComponent.prototype.updateUI = function(state: Record<string,unknown>) {
  const badgeEl = this.element.querySelector('.integration-badge');
  // @ts-expect-error TS migration - TS2365
  const rec = state.received_today;
  if (state.status !== 'offline' && rec !== null && rec !== undefined) {
    this.element.dataset.count = String(rec); this.element.dataset.status = rec > 0 ? 'has-unread' : 'ok'; badgeEl.textContent = rec > 99 ? '99+' : String(rec);
    let hora = '--:--'; if (state.lastUpdate) { try { hora = new Date(state.lastUpdate as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch (e) {} }
    this.element.title = `E-mails recebidos hoje: ${rec}\n${state.unread || 0} mensagens não lidas\nÚltima atualização: ${hora}`;
  }
  else { this.element.dataset.count = '0'; this.element.dataset.status = 'offline'; }
};

EmailIntegrationComponent.prototype.fetchStatus = function() {
  const self = this;
  if (this.isDestroyed) return Promise.resolve();
  this._metrics.fetchCount++;
  this._metrics.lastFetchAt = Date.now();
  return this.api.fetchStatus().then((data: Record<string,unknown>) => {
    if (self.isDestroyed) return;
    if (data && data._fallback) { self.store.setState({ status: 'offline' }); return; }
    self.store.setState({ received_today: data.received_today || 0, unread: data.unread || 0, status: 'ok', lastUpdate: new Date().toISOString() });
    const eb = _getPort('eventBus');
    if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.DATA_UPDATED, { componentId: id, moduleId: MODULE_ID, data: { received_today: data.received_today, unread: data.unread }, timestamp: Date.now() });
  }).catch((error: unknown) => { if (self.isDestroyed) return; self.store.setState({ status: 'offline' }); });
};

EmailIntegrationComponent.prototype.startPolling = function() {
  const self = this;
  if (this.isDestroyed) return;
  this.polling = new PollingCoordinator({ interval: 60000 });
  this.polling.onPoll(() => self.fetchStatus());
  this.polling.start();
};

EmailIntegrationComponent.prototype.unmount = function() {
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

EmailIntegrationComponent.prototype.healthCheck = function() {
  const eb = _getPort('eventBus');
  const checks = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!eb, pollingActive: !!this.polling, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 5 ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: 5, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID };
};

EmailIntegrationComponent.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, id, capabilities, portsInitialized: Ports.isInitialized(), mounted: !!this.element, received_today: this.store.getState().received_today, metrics: this._metrics }; };

export default EmailIntegrationComponent;
