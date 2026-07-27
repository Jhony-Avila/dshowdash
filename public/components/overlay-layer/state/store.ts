// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer-store
// PURPOSE: Overlay Layer - Store v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getState() — exported function
//   getStack() — exported function
//   getOverlay() — exported function
//   getOverlays() — exported function
//   getConfig() — exported function
//   addOverlay() — exported function
//   removeOverlay() — exported function
//   updateOverlayRuntime() — exported function
//   clear() — exported function
//   subscribe() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '2.0.0-ENTERPRISE-AAA';
export const MODULE_ID = 'overlay-layer-store';

let _state = { stack: [] as DynObj, overlays: {}, config: { maxStack: 10 } };
let _subscribers: DynObj[] = [];

export function getState() { return { ..._state }; }
export function getStack() { return [..._state.stack]; }
export function getOverlay(id: DynObj) { return (_state.overlays as DynObj)[id] || null; }
export function getOverlays() { return { ..._state.overlays }; }
export function getConfig() { return { ..._state.config }; }

export function addOverlay(overlay: DynObj) {
  if (!overlay?.id) return false;
  (_state.overlays as DynObj)[overlay.id] = overlay;
  if (!_state.stack.includes(overlay.id)) _state.stack.push(overlay.id);
  _notify();
  return true;
}

export function removeOverlay(id: DynObj) {
  if (!(_state.overlays as DynObj)[id]) return false;
  delete (_state.overlays as DynObj)[id];
  _state.stack = _state.stack.filter((i: number) => i !== id);
  _notify();
  return true;
}

export function updateOverlayRuntime(id: DynObj, runtime: DynObj) {
  if (!(_state.overlays as DynObj)[id]) return false;
  (_state.overlays as DynObj)[id] = { ...(_state.overlays as DynObj)[id], runtime: { ...(_state.overlays as DynObj)[id].runtime, ...runtime } };
  _notify();
  return true;
}

export function clear() { _state = { stack: [], overlays: {}, config: _state.config }; _notify(); }
export function subscribe(fn: DynObj) { if (typeof fn === 'function') _subscribers.push(fn); return () => { _subscribers = _subscribers.filter(s => s !== fn); }; }
function _notify() { _subscribers.forEach(fn => { try { fn(_state); } catch (e) {} }); }

export function healthCheck() {
  const checks = { hasState: !!_state, stackHealthy: _state.stack.length < _state.config.maxStack, noOrphans: _state.stack.every((id: string) => !!(_state.overlays as DynObj)[id]) };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/${total}`, checks, stackSize: _state.stack.length, overlayCount: Object.keys(_state.overlays).length, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, stackSize: _state.stack.length, overlayCount: Object.keys(_state.overlays).length, subscriberCount: _subscribers.length, config: getConfig(), timestamp: Date.now() }; }

export default { getState, getStack, getOverlay, getOverlays, getConfig, addOverlay, removeOverlay, updateOverlayRuntime, clear, subscribe, healthCheck, info, VERSION, MODULE_ID };
