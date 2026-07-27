// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer-renderer
// PURPOSE: Overlay Layer - Renderer v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   * as Container from ./container.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   render() — exported function
//   remove() — exported function
//   clear() — exported function
//   getMetrics() — exported function
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

import * as Container from './container.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '2.0.0-ENTERPRISE-AAA';
export const MODULE_ID = 'overlay-layer-renderer';

let _metrics = { renderCount: 0, clearCount: 0 };

export function render(overlay: DynObj) {
  if (!overlay?.id) return null;
  const container = Container.get() || Container.create();
  const el = document.createElement('div');
  el.id = `overlay-${overlay.id}`;
  el.className = `overlay-item overlay-type-${overlay.type || 'modal'}`;
  el.dataset.overlayId = overlay.id;
  if (overlay.content) { if (typeof overlay.content === 'string') el.innerHTML = overlay.content; else if (overlay.content instanceof HTMLElement) el.appendChild(overlay.content); }
  container.appendChild(el);
  _metrics.renderCount++;
  return el;
}

export function remove(id: DynObj) { const el = document.getElementById(`overlay-${id}`); if (el?.parentNode) el.parentNode.removeChild(el); }
export function clear() { const container = Container.get(); if (container) container.innerHTML = ''; _metrics.clearCount++; }
export function getMetrics() { return { ..._metrics }; }

export function healthCheck() {
  const checks = { containerAvailable: Container.exists() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), containerExists: Container.exists(), timestamp: Date.now() }; }

export default { render, remove, clear, getMetrics, healthCheck, info, VERSION, MODULE_ID };
