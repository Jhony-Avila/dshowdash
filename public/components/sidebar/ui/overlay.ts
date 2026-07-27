// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-BULLETPROOF-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-overlay
// PURPOSE: Sidebar UI - Overlay Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setDOMAdapter() — exported function
//   ensureOverlayRoot() — exported function
//   showOverlay() — exported function
//   hideOverlay() — exported function
//   removeOverlay() — exported function
//   isOverlayVisible() — exported function
//   getMetrics() — exported function
//   reset() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
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


export const VERSION = '5.5.0-ENTERPRISE-FULL';
export const MODULE_ID = 'sidebar-overlay';

let _overlayRoot: HTMLElement | null = null;
let _overlay: HTMLElement | null = null;
let _domAdapter: DynObj | null = null;
let _metrics = { shows: 0, hides: 0, errors: 0 };

export function setDOMAdapter(adapter: DynObj) { _domAdapter = adapter; }

function _createElement(tag: string, options: { id?: string; className?: string; attributes?: Record<string, string>; style?: string } = {}) {
  if (_domAdapter?.createElement) return _domAdapter.createElement(tag, options);
  const el = document.createElement(tag);
  if (options.id) el.id = options.id;
  if (options.className) el.className = options.className;
  if (options.attributes) Object.entries(options.attributes).forEach(([k, v]) => el.setAttribute(k, v));
  if (options.style) el.style.cssText = options.style;
  return el;
}

function _querySelector(selector: string) { if (_domAdapter?.querySelector) return _domAdapter.querySelector(selector); return document.querySelector(selector); }
function _getElementById(id: string) { if (_domAdapter?.getElementById) return _domAdapter.getElementById(id); return document.getElementById(id); }

export function ensureOverlayRoot() {
  try {
    if (_overlayRoot && document.contains(_overlayRoot)) return _overlayRoot;
    _overlayRoot = _getElementById('app-overlay-root');
    if (!_overlayRoot) { _overlayRoot = _createElement('div', { id: 'app-overlay-root', attributes: { 'data-overlay-root': 'true' }, style: 'position:fixed;top:0;left:0;width:0;height:0;z-index:9000;pointer-events:none;' }); const parent = _getElementById('app-shell') || document.documentElement; parent.appendChild(_overlayRoot); }
    return _overlayRoot;
  } catch (error: any) { _metrics.errors++; return null; }
}

export function showOverlay() {
  try {
    if (!_overlay || !document.contains(_overlay)) _overlay = _querySelector('.dsd-sidebar-overlay');
    // @ts-expect-error strict migration — TS2345
    if (!_overlay) { _overlay = _createElement('div', { className: 'dsd-sidebar-overlay', attributes: { 'aria-hidden': 'true' }, style: 'pointer-events:auto;' }); const root = ensureOverlayRoot(); if (root) root.appendChild(_overlay); }
    _overlay!.classList.add('dsd-sidebar-overlay--visible');
    _metrics.shows++;
    return { success: true };
  } catch (error: any) { _metrics.errors++; return { success: false, error: error.message }; }
}

export function hideOverlay() { try { if (!_overlay) _overlay = _querySelector('.dsd-sidebar-overlay'); _overlay?.classList.remove('dsd-sidebar-overlay--visible'); _metrics.hides++; return { success: true }; } catch (error: any) { _metrics.errors++; return { success: false, error: error.message }; } }
export function removeOverlay() { try { if (!_overlay) _overlay = _querySelector('.dsd-sidebar-overlay'); _overlay?.remove(); _overlay = null; return { success: true }; } catch (error: any) { _metrics.errors++; return { success: false, error: error.message }; } }
export function isOverlayVisible() { if (!_overlay) _overlay = _querySelector('.dsd-sidebar-overlay'); return _overlay?.classList.contains('dsd-sidebar-overlay--visible') ?? false; }
export function getMetrics() { return { ..._metrics }; }
export function reset() { _overlay = null; _overlayRoot = null; _metrics = { shows: 0, hides: 0, errors: 0 }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, hasAdapter: !!_domAdapter, overlayVisible: isOverlayVisible(), metrics: getMetrics() }; }

export function healthCheck() {
  const hasAdapter = !!_domAdapter;
  const overlayExists = !!_overlay && document.contains(_overlay);
  const rootExists = !!_overlayRoot && document.contains(_overlayRoot);
  let status = 'HEALTHY';
  if (_metrics.errors > 5) status = 'DEGRADED';
  return { status, version: VERSION, moduleId: MODULE_ID, checks: { hasAdapter, overlayExists, rootExists, isVisible: isOverlayVisible() }, metrics: getMetrics() };
}

export default { setDOMAdapter, ensureOverlayRoot, showOverlay, hideOverlay, removeOverlay, isOverlayVisible, getMetrics, reset, info, healthCheck, VERSION, MODULE_ID };
