// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/panel-bling
// PURPOSE: Panel Bling - Enterprise AAA Autocontained
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
//   PanelBlingComponent() — exported function
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
export const id = 'panel-bling';
export const capabilities = { type: 'panel', reorderable: true, hideable: true, critical: false, rendersUI: true };
export const MODULE_ID = 'header/components/panel-bling';
// ROTA (@2026-07-30): aponta para #/panel-bling — o MÓDULO React.
// Antes era #/integrations/bling, que resolve pelo registry BUNDLEADO e cai em
// panel-integration-bling: o widget de status, não o módulo. Não usar #/bling
// tampouco — ITEM_TO_PANEL['bling'] leva a panel-04 (stub 'Produtos/Bling').
const PANEL_CONFIG = { id: 'panel-bling', label: 'Bling', route: '#/panel-bling', icon: '/assets/icons/system/header/bling.svg' };

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

(function loadCSS() { const cssPath = '/components/header/components/panel-bling/component.css'; if (!document.querySelector(`link[href="${cssPath}"]`)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = cssPath; document.head.appendChild(link); } })();

function _emit(event: string, data: Record<string,unknown>) { data = data || {}; const bus = _getPort('eventBus'); if (bus && bus.emit) bus.emit(event, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data)); }

export function PanelBlingComponent(this: any, options: Record<string,unknown>) { options = options || {}; this.container = options.container || null; this.element = null; this._isMounted = false; this._isDestroyed = false; this._clickHandler = null; this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null }; }

PanelBlingComponent.prototype.mount = function(container: HTMLElement|null) {
  if (this._isDestroyed) { this._metrics.errorCount++; return Promise.resolve(this); }
  if (this._isMounted) return Promise.resolve(this);
  try { _initPorts(); this.container = container || this.container; if (!this.container) throw new Error('Container required'); this._render(); this._attachEvents(); this._isMounted = true; this._metrics.mountCount++; this._metrics.lastMountAt = Date.now(); _emit(COMPONENT_EVENTS.MOUNTED, { componentId: PANEL_CONFIG.id, moduleId: MODULE_ID }); return Promise.resolve(this); }
  catch (error: any) { this._metrics.errorCount++; _emit(COMPONENT_EVENTS.ERROR, { componentId: PANEL_CONFIG.id, moduleId: MODULE_ID, error: error.message }); return Promise.reject(error); }
};

PanelBlingComponent.prototype._render = function() { this.element = document.createElement('button'); this.element.type = 'button'; this.element.className = 'header-panel-trigger panel-bling-trigger'; this.element.title = PANEL_CONFIG.label; this.element.setAttribute('aria-label', `Abrir ${PANEL_CONFIG.label}`); this.element.setAttribute('aria-haspopup', 'dialog'); this.element.setAttribute('data-panel-trigger', PANEL_CONFIG.id); this.element.setAttribute('data-uarps-trigger', 'trigger:header:open-panel-bling'); this.element.innerHTML = `<img src="${PANEL_CONFIG.icon}" alt="${PANEL_CONFIG.label}" class="trigger-icon" loading="lazy" />`; this.container.appendChild(this.element); };

// NAVEGAÇÃO (@2026-07-30) — por que existe um fallback aqui.
//
// `navigateToRoute` delega ao navigation-adapter, que emite NAV_INTENTS.NAVIGATE
// no EventBus e retorna `true` assim que o emit acontece — mesmo que ninguém
// esteja escutando. Medição de 2026-07-30 com clique real: os DEZ botões de
// painel do header (pipedrive, bling, mercado-livre, loja-integrada,
// google-drive, calendar, adwords, asaas, chatgpt, maps) NÃO navegam. O hash
// não muda em nenhum deles. É um problema pré-existente do header, anterior a
// este módulo — o do Pipedrive está assim com o painel em produção.
//
// A correção da causa (ligar o ouvinte de NAV_INTENTS.NAVIGATE) afeta os 10
// botões de uma vez e precisa de decisão do dono; está reportada em
// docs/BLING/README.md. Aqui aplicamos só o fallback local: emite a intenção
// como sempre e, se o hash não mudar, navega direto. É o mesmo último recurso
// que o próprio navigation-adapter tem (window.location) e que nunca é
// alcançado porque o emit "dá certo" antes.
PanelBlingComponent.prototype._attachEvents = function() { const self = this; if (!this.element) return; this._clickHandler = (e: Event) => { e.preventDefault(); self._metrics.clickCount++; self._metrics.lastClickAt = Date.now(); const antes = window.location.hash; navigateToRoute(PANEL_CONFIG.route, MODULE_ID); window.setTimeout(() => { if (window.location.hash === antes) { window.location.hash = PANEL_CONFIG.route; } }, 140); }; this.element.addEventListener('click', this._clickHandler); };
PanelBlingComponent.prototype._detachEvents = function() { if (this.element && this._clickHandler) { this.element.removeEventListener('click', this._clickHandler); this._clickHandler = null; } };

PanelBlingComponent.prototype.unmount = function() { if (!this._isMounted || this._isDestroyed) return Promise.resolve(this); this._detachEvents(); if (this.element) { this.element.remove(); this.element = null; } this._isMounted = false; this._metrics.unmountCount++; _emit(COMPONENT_EVENTS.UNMOUNTED, { componentId: PANEL_CONFIG.id, moduleId: MODULE_ID }); return Promise.resolve(this); };
PanelBlingComponent.prototype.destroy = function() { if (this._isDestroyed) return; this.unmount(); this._isDestroyed = true; this.container = null; };

PanelBlingComponent.prototype.healthCheck = function() { const checks = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : passed >= 4 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; };
PanelBlingComponent.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, id, capabilities, config: Object.assign({}, PANEL_CONFIG), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() }; };
PanelBlingComponent.prototype.getMetrics = function() { return Object.assign({}, this._metrics); };
PanelBlingComponent.prototype.isMounted = function() { return this._isMounted; };
PanelBlingComponent.prototype.isDestroyed = function() { return this._isDestroyed; };
PanelBlingComponent.prototype.getElement = function() { return this.element; };

export function createComponent(options: Record<string,unknown>) { return (new (PanelBlingComponent as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(options)); }
export default PanelBlingComponent;
