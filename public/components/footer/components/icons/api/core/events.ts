// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-icon-api-events
// PURPOSE: Api Icon - Events Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//   COMPONENT_EVENTS from /core/runtime/events/catalog/component.events.js
//
// PROVIDES:
//   EventsHandler — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   UI_EVENTS.ACTION
//   COMPONENT_EVENTS.MOUNTED
//   COMPONENT_EVENTS.UNMOUNTED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { COMPONENT_EVENTS } from '/core/runtime/events/catalog/component.events.js';
const MODULE_ID = 'footer-icon-api-events';
const VERSION = '1.5.0-P18EC';
const COMPONENT_ID = 'footer:api';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _metrics = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function emitUIAction(data: Record<string,unknown>) { if (data === undefined) data = {}; _metrics.uiActions++; const eventBus = _getPort('eventBus'); if (!eventBus || !eventBus.emit) return; eventBus.emit(UI_EVENTS.ACTION, { actionId: COMPONENT_ID, source: MODULE_ID, timestamp: Date.now(), kind: 'navigation', meta: Object.assign({ label: 'Api' }, data) }); }
// @ts-expect-error strict migration — TS2769, TS2339
export const EventsHandler = { _clickHandler: (null as Function|null), _element: (null as unknown|null), init() { _initPorts(); }, bindClick(element: HTMLElement|null, callback: Function) { this._element = element; this._clickHandler = () => { _metrics.clicks++; if (callback) callback(); emitUIAction({ clicked: true }); }; if (element) element.addEventListener('click', this._clickHandler); }, emitClicked(props: Record<string,unknown>) { _metrics.clicks++; emitUIAction({ clicked: true, props }); }, emitMounted(props: Record<string,unknown>) { _metrics.mounts++; const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.MOUNTED, { componentId: COMPONENT_ID, moduleId: MODULE_ID, props, timestamp: Date.now() }); }, emitUnmounted() { _metrics.unmounts++; const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.UNMOUNTED, { componentId: COMPONENT_ID, moduleId: MODULE_ID, timestamp: Date.now() }); }, cleanup() { if (this._element && this._clickHandler) { this._element.removeEventListener('click', this._clickHandler); } this._element = null; this._clickHandler = null; }, destroy() { this.cleanup(); } };
export function getMetrics() { return Object.assign({}, _metrics); }
export function info() { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), portsInitialized: ps._initialized }; }
export function healthCheck() { const ps = Ports.snapshot(); const eb = _getPort('eventBus'); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { eventBusAvailable: !!eb, portsInitialized: ps._initialized }, metrics: getMetrics() }; }
export { MODULE_ID, VERSION };
export default Object.assign({}, EventsHandler, { getMetrics, info, healthCheck, MODULE_ID, VERSION });
