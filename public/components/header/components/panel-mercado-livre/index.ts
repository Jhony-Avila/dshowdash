// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/panel-mercado-livre
// PURPOSE: Panel Mercado Livre - Enterprise AAA Autocontained
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   COMPONENT_EVENTS from /core/runtime/events/catalog/component.events.js
//   navigateToRoute from ../_base/navigation-helper.js
//
// PROVIDES:
//   VERSION — module constant
//   id — exported value
//   capabilities — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   PanelMercadoLivreComponent() — exported function
//   createComponent() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { COMPONENT_EVENTS } from '/core/runtime/events/catalog/component.events.js';
import { navigateToRoute } from '../_base/navigation-helper.js';

export const VERSION = '8.8.0-ES6';
export const id = 'panel-mercado-livre';
export const capabilities = { type: 'panel', reorderable: true, hideable: true, critical: false, rendersUI: true };
export const MODULE_ID = 'header/components/panel-mercado-livre';
const PANEL_CONFIG = { id: 'panel-mercado-livre', label: 'Mercado Livre', route: '#/panel-mercadolivre', icon: '/assets/icons/system/header/mercado-livre.svg' };

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

(function loadCSS() { const cssPath = '/components/header/components/panel-mercado-livre/component.css'; if (!document.querySelector(`link[href="${cssPath}"]`)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = cssPath; document.head.appendChild(link); } })();

function _emit(event: string, data: Record<string,unknown>) { data = data || {}; const bus = _getPort('eventBus'); if (bus && bus.emit) bus.emit(event, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data)); }

export function PanelMercadoLivreComponent(this: any, options: Record<string,unknown>) { options = options || {}; this.container = options.container || null; this.element = null; this._isMounted = false; this._isDestroyed = false; this._clickHandler = null; this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null }; }

PanelMercadoLivreComponent.prototype.mount = function(container: HTMLElement|null) {
  if (this._isDestroyed) { this._metrics.errorCount++; return Promise.resolve(this); }
  if (this._isMounted) return Promise.resolve(this);
  try { _initPorts(); this.container = container || this.container; if (!this.container) throw new Error('Container required'); this._render(); this._attachEvents(); this._isMounted = true; this._metrics.mountCount++; this._metrics.lastMountAt = Date.now(); _emit(COMPONENT_EVENTS.MOUNTED, { componentId: PANEL_CONFIG.id, moduleId: MODULE_ID }); return Promise.resolve(this); }
  catch (error: any) { this._metrics.errorCount++; _emit(COMPONENT_EVENTS.ERROR, { componentId: PANEL_CONFIG.id, moduleId: MODULE_ID, error: error.message }); return Promise.reject(error); }
};

PanelMercadoLivreComponent.prototype._render = function() { this.element = document.createElement('button'); this.element.type = 'button'; this.element.className = 'header-panel-trigger panel-mercado-livre-trigger'; this.element.title = PANEL_CONFIG.label; this.element.setAttribute('aria-label', `Abrir ${PANEL_CONFIG.label}`); this.element.setAttribute('aria-haspopup', 'dialog'); this.element.setAttribute('data-panel-trigger', PANEL_CONFIG.id); this.element.setAttribute('data-uarps-trigger', 'trigger:header:open-panel-mercado-livre'); this.element.innerHTML = `<img src="${PANEL_CONFIG.icon}" alt="${PANEL_CONFIG.label}" class="trigger-icon" loading="lazy" />`; this.container.appendChild(this.element); };

PanelMercadoLivreComponent.prototype._attachEvents = function() { const self = this; if (!this.element) return; this._clickHandler = (e: Event) => { e.preventDefault(); self._metrics.clickCount++; self._metrics.lastClickAt = Date.now(); navigateToRoute(PANEL_CONFIG.route, MODULE_ID); }; this.element.addEventListener('click', this._clickHandler); };
PanelMercadoLivreComponent.prototype._detachEvents = function() { if (this.element && this._clickHandler) { this.element.removeEventListener('click', this._clickHandler); this._clickHandler = null; } };

PanelMercadoLivreComponent.prototype.unmount = function() { if (!this._isMounted || this._isDestroyed) return Promise.resolve(this); this._detachEvents(); if (this.element) { this.element.remove(); this.element = null; } this._isMounted = false; this._metrics.unmountCount++; _emit(COMPONENT_EVENTS.UNMOUNTED, { componentId: PANEL_CONFIG.id, moduleId: MODULE_ID }); return Promise.resolve(this); };
PanelMercadoLivreComponent.prototype.destroy = function() { if (this._isDestroyed) return; this.unmount(); this._isDestroyed = true; this.container = null; };

PanelMercadoLivreComponent.prototype.healthCheck = function() { const checks = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : passed >= 4 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; };
PanelMercadoLivreComponent.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, id, capabilities, config: Object.assign({}, PANEL_CONFIG), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() }; };
PanelMercadoLivreComponent.prototype.getMetrics = function() { return Object.assign({}, this._metrics); };
PanelMercadoLivreComponent.prototype.isMounted = function() { return this._isMounted; };
PanelMercadoLivreComponent.prototype.isDestroyed = function() { return this._isDestroyed; };
PanelMercadoLivreComponent.prototype.getElement = function() { return this.element; };

export function createComponent(options: Record<string,unknown>) { return (new (PanelMercadoLivreComponent as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(options)); }
export default PanelMercadoLivreComponent;
