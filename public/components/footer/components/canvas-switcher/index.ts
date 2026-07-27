// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.footer.canvas-switcher
// PURPOSE: Footer - Canvas Switcher
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   CANVAS_EVENTS — exported value
//   init() — exported function
//   mount() — exported function
//   unmount() — exported function
//   destroy() — exported function
//   registerCanvas() — exported function
//   unregisterCanvas() — exported function
//   switchCanvas() — exported function
//   getActiveCanvas() — exported function
//   getCanvases() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.footer.canvas-switcher';
const VERSION = '2.3.0-P18EC';

const CANVAS_EVENTS = { SWITCHED: 'footer:canvas:switched' };

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state = { initialized: false, activeCanvas: 'main', canvases: ['main'], mounted: false, container: (null as HTMLElement|null|null), element: (null as HTMLElement|null|null), abortController: (null as unknown|null) };
const _metrics = { switches: 0 };

function _emit(eventName: string, data: Record<string,unknown>) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {})); }
function _track(eventName: string, payload: Record<string,unknown>) { try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventName, Object.assign({ moduleId: MODULE_ID }, payload || {})); } catch (e) { } }

function registerCanvas(id: string) { if (_state.canvases.indexOf(id) < 0) _state.canvases.push(id); return { ok: true }; }
// @ts-expect-error strict migration — TS2322
function unregisterCanvas(id: string) { const idx = _state.canvases.indexOf(id); if (idx >= 0) { _state.canvases.splice(idx, 1); if (_state.activeCanvas === id) _state.activeCanvas = _state.canvases[0] || null; return { ok: true }; } return { ok: false }; }

function switchCanvas(id: string) { if (_state.canvases.indexOf(id) < 0) return { ok: false, reason: 'Canvas not registered' }; const prev = _state.activeCanvas; _state.activeCanvas = id; _metrics.switches++; _emit(CANVAS_EVENTS.SWITCHED, { from: prev, to: id }); _track('footer:canvas:switch', { from: prev, to: id }); return { ok: true, canvas: id }; }

function getActiveCanvas() { return _state.activeCanvas; }
function getCanvases() { return _state.canvases.slice(); }

// @ts-expect-error TS migration - TS2345, TS2740
function init(ctx: Record<string,unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); if (ctx && ctx.canvases) _state.canvases = ctx.canvases; _state.initialized = true; return { ok: true, version: VERSION }; }

// Mount function for registry compatibility
function mount(container: HTMLElement|null, options: Record<string,unknown>) {
  if (_state.mounted) return { ok: true, alreadyMounted: true };
  if (!container) return { ok: false, reason: 'No container provided' };
  
  init(options);
  
  _state.container = container;
  _state.element = document.createElement('div');
  _state.element.className = 'dsd-footer__canvas-switcher-inner';
  _state.element.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg><span class="dsd-footer__canvas-label">${_state.activeCanvas}</span>`;
  
  _state.abortController = new AbortController();
  _state.element.addEventListener('click', () => {
    const canvases = getCanvases();
    if (canvases.length < 2) return;
    const currentIdx = canvases.indexOf(_state.activeCanvas);
    const nextIdx = (currentIdx + 1) % canvases.length;
    switchCanvas(canvases[nextIdx]);
    // @ts-expect-error strict migration — TS18047
    const labelEl = _state.element.querySelector('.dsd-footer__canvas-label');
    if (labelEl) labelEl.textContent = _state.activeCanvas;
  // @ts-expect-error TS migration - TS2339
  }, { signal: _state.abortController.signal });
  
  container.appendChild(_state.element);
  _state.mounted = true;
  return { ok: true, version: VERSION };
}

// Unmount function for registry compatibility
function unmount() {
  if (!_state.mounted) return { ok: true };
  // @ts-expect-error TS migration - TS2339
  if (_state.abortController) { _state.abortController.abort(); _state.abortController = null; }
  if (_state.element && _state.element.parentNode) {
    _state.element.parentNode.removeChild(_state.element);
  }
  _state.element = null;
  _state.container = null;
  _state.mounted = false;
  return { ok: true };
}

function destroy() {
  unmount();
  _state.canvases = ['main'];
  _state.activeCanvas = 'main';
  _state.initialized = false;
  _metrics.switches = 0;
  return { ok: true };
}

function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, mounted: { ok: _state.mounted, severity: 'info' }, hasActiveCanvas: { ok: !!_state.activeCanvas, severity: 'warn' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, mounted: _state.mounted, activeCanvas: _state.activeCanvas, canvasesCount: _state.canvases.length, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, CANVAS_EVENTS, init, mount, unmount, destroy, registerCanvas, unregisterCanvas, switchCanvas, getActiveCanvas, getCanvases, healthCheck, info };
export default { MODULE_ID, VERSION, CANVAS_EVENTS, init, mount, unmount, destroy, registerCanvas, unregisterCanvas, switchCanvas, getActiveCanvas, getCanvases, healthCheck, info, injectPorts, getPorts };
