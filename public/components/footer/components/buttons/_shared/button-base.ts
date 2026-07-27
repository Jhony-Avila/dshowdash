// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-button-base
// PURPOSE: Footer Shared - Button Base P18EC
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   emitUIAction, BUTTON_EVENTS from ./event-helpers.js
//   addListener, addKeyboardListener, runCleanups from ./listener-helpers.js
//   getIcon from ./icons.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   FooterButtonBase() — exported function
//   createFooterButton() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { emitUIAction, BUTTON_EVENTS } from './event-helpers.js';
import { addListener, addKeyboardListener, runCleanups } from './listener-helpers.js';
import { getIcon } from './icons.js';
export const VERSION = '1.3.0-P18EC';
export const MODULE_ID = 'footer-button-base';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export function FooterButtonBase(this: any, config: Record<string,unknown>) { config = config || {}; this._id = config.id || 'unknown'; this._label = config.label || ''; this._icon = config.icon || ''; this._area = 'footer'; this._kind = config.kind || 'decorative'; this._meta = config.meta || {}; this._element = null; this._mounted = false; this._cleanups = []; this._metrics = { mountCount: 0, clickCount: 0, lastClickAt: null }; this._initialized = false; this._ctx = null; }
FooterButtonBase.prototype.init = function(ctx: Record<string,unknown>) { if (this._initialized) return this; this._ctx = ctx || {}; this._initialized = true; return this; };
FooterButtonBase.prototype.mount = function(hostEl: HTMLElement, props: Record<string,unknown>) { props = props || {}; if (this._mounted && this._element && this._element.parentNode === hostEl) return this; if (this._mounted) this.unmount(); this._element = this._createButton(props); this._attachEvents(); if (hostEl) hostEl.appendChild(this._element); this._mounted = true; this._metrics.mountCount++; this._emitTelemetry(BUTTON_EVENTS.MOUNTED); return this; };
// @ts-expect-error TS migration - TS2322
FooterButtonBase.prototype._createButton = function(props: Record<string,unknown>) { props = props || {}; const btn = document.createElement('button'); btn.type = 'button'; btn.className = this._kind === 'control' ? `dsd-footer__control-btn footer-btn footer-btn--${this._id}` : `dsd-footer__icon-btn footer-btn footer-btn--${this._id}`; btn.setAttribute('aria-label', props.label || this._label); btn.setAttribute('data-button-id', this._id); btn.setAttribute('data-icon', this._icon); btn.setAttribute('tabindex', '0'); btn.setAttribute('title', props.label || this._label); const iconSvg = getIcon(props.icon || this._icon); if (this._kind === 'control') { btn.innerHTML = `${iconSvg}<span>${props.label || this._label}</span>`; } else { btn.innerHTML = iconSvg; } return btn; };
FooterButtonBase.prototype._attachEvents = function() { const self = this; if (!this._element) return; addListener(this._element, 'click', (e: Event) => { self._handleClick(e); }, this._cleanups); addKeyboardListener(this._element, (e: Event) => { self._handleClick(e); }, this._cleanups); };
FooterButtonBase.prototype._handleClick = function(e: Event) { if (e && e.preventDefault) e.preventDefault(); this._metrics.clickCount++; this._metrics.lastClickAt = Date.now(); const actionId = `${this._area}:${this._id}`; emitUIAction(actionId, this.getModuleId(), Object.assign({ label: this._label, icon: this._icon, kind: this._kind }, this._meta)); this._emitTelemetry(BUTTON_EVENTS.CLICKED); };
FooterButtonBase.prototype._emitTelemetry = function(eventName: string) { const eventBus = _getPort('eventBus'); if (eventBus && eventBus.emit) { eventBus.emit(eventName, { buttonId: this._id, source: this.getModuleId(), timestamp: Date.now() }); } };
FooterButtonBase.prototype.unmount = function() { if (!this._mounted) return this; runCleanups(this._cleanups); if (this._element && this._element.parentNode) { this._element.parentNode.removeChild(this._element); } this._element = null; this._mounted = false; this._emitTelemetry(BUTTON_EVENTS.UNMOUNTED); return this; };
FooterButtonBase.prototype.healthCheck = function() { const ps = Ports.snapshot(); const checks = { initialized: !!this._initialized, mounted: this._mounted, hasElement: !!this._element, hasId: !!this._id, portsInitialized: ps._initialized }; const score = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: score === total ? 'HEALTHY' : score >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: `${score}/${total}`, checks, version: VERSION, moduleId: this.getModuleId() }; };
FooterButtonBase.prototype.info = function() { return { id: this._id, area: this._area, label: this._label, icon: this._icon, kind: this._kind, mounted: this._mounted, metrics: Object.assign({}, this._metrics), version: VERSION, moduleId: this.getModuleId() }; };
FooterButtonBase.prototype.getModuleId = function() { return `footer/components/${this._id}`; };
FooterButtonBase.prototype.getId = function() { return this._id; };
FooterButtonBase.prototype.getElement = function() { return this._element; };
FooterButtonBase.prototype.isMounted = function() { return this._mounted; };
export function createFooterButton(config: Record<string,unknown>) { return (new (FooterButtonBase as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(config)); }
export default { FooterButtonBase, createFooterButton, VERSION, MODULE_ID };
