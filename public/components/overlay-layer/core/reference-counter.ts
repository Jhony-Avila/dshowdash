// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.overlay-layer.core.reference-counter
// PURPOSE: Overlay Layer Reference Counter - Backdrop and scroll lock tracking
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INJECT_PORTS - injectPorts() for dependency injection
// @contract GET_PORTS - getPorts() returns ports snapshot
// @contract ACQUIRE - acquire() registers overlay reference
// @contract RELEASE - release() removes overlay reference
// @contract RELEASE_ALL - releaseAll() clears all references
// @contract GET_COUNTS - getCounts() returns current counts
// @contract GET_ACTIVE - getActiveOverlays() returns active overlays
// @contract IS_ACTIVE - isActive() checks if overlay is active
// @contract GET_TOP - getTopOverlay() returns highest priority overlay
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   UI_INTENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   acquire() — exported function
//   release() — exported function
//   releaseAll() — exported function
//   getCounts() — exported function
//   getActiveOverlays() — exported function
//   isActive() — exported function
//   getTopOverlay() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): ui:request-layout
// LISTENS (eventos): (none)
// WINDOW ACCESS: window.LayoutManager
// ───────────────────────────────────────────────────────────────
// @changelog v1.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.3.1-ENTERPRISE: ES5 conversion (Map to object)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.reference-counter';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const hasWindow = typeof window !== 'undefined';
let _backdropCount = 0;
let _scrollLockCount = 0;
let _activeOverlays = {};


// @ts-expect-error TS migration - TS2339
function _setScrollLock(locked) { const lm = hasWindow ? window.LayoutManager : null; if (lm && lm.setScrollLocked) { lm.setScrollLocked(locked); return true; } const eb = _getPort('eventBus'); if (eb && eb.emit) { eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode: locked ? 'scroll-lock' : 'scroll-unlock', source: MODULE_ID, timestamp: Date.now() }); return true; } return false; }

export function acquire(id: DynObj, options: DynObj) { if (!options) options = {}; if ((_activeOverlays as DynObj)[id]) return { ok: true, action: 'already-acquired', counts: getCounts() }; (_activeOverlays as DynObj)[id] = { type: options.type || 'modal', priority: options.priority || 7500, blocking: options.blocking !== false, timestamp: Date.now() }; const wasBackdropActive = _backdropCount > 0; _backdropCount++; if (options.blocking !== false) { const wasScrollLocked = _scrollLockCount > 0; _scrollLockCount++; if (!wasScrollLocked) _setScrollLock(true); } return { ok: true, action: 'acquired', backdropCreated: !wasBackdropActive, counts: getCounts() }; }

export function release(id: DynObj) { const overlay = (_activeOverlays as DynObj)[id]; if (!overlay) return { ok: false, reason: 'not-found', counts: getCounts() }; delete (_activeOverlays as DynObj)[id]; _backdropCount = Math.max(0, _backdropCount - 1); const backdropRemoved = _backdropCount === 0; if (overlay.blocking) { _scrollLockCount = Math.max(0, _scrollLockCount - 1); if (_scrollLockCount === 0) _setScrollLock(false); } return { ok: true, action: 'released', backdropRemoved, scrollUnlocked: _scrollLockCount === 0, counts: getCounts() }; }

export function releaseAll(reason: DynObj) { if (!reason) reason = 'force-cleanup'; const released = Object.keys(_activeOverlays).length; _activeOverlays = {}; _backdropCount = 0; _scrollLockCount = 0; _setScrollLock(false); return { ok: true, released, reason, counts: getCounts() }; }

export function getCounts() { const size = Object.keys(_activeOverlays).length; return { activeOverlays: size, backdropCount: _backdropCount, scrollLockCount: _scrollLockCount, hasBackdrop: _backdropCount > 0, isScrollLocked: _scrollLockCount > 0 }; }

export function getActiveOverlays() { const list = []; const keys = Object.keys(_activeOverlays); for (let i = 0; i < keys.length; i++) { const id = keys[i]; list.push(Object.assign({ id }, (_activeOverlays as DynObj)[id])); } return list.sort((a, b) => b.priority - a.priority); }

export function isActive(id: DynObj) { return !!(_activeOverlays as DynObj)[id]; }

export function getTopOverlay() { let top = null; let maxPriority = -1; const keys = Object.keys(_activeOverlays); for (let i = 0; i < keys.length; i++) { const id = keys[i]; const data = (_activeOverlays as DynObj)[id]; if (data.priority > maxPriority) { maxPriority = data.priority; top = Object.assign({ id }, data); } } return top; }

export function healthCheck() { const eb = _getPort('eventBus'); const counts = getCounts(); const checks = { countsConsistent: counts.activeOverlays === Object.keys(_activeOverlays).length, backdropValid: counts.backdropCount >= 0 && counts.backdropCount <= counts.activeOverlays, scrollLockValid: counts.scrollLockCount >= 0, noOrphans: counts.backdropCount === 0 || counts.activeOverlays > 0, eventBusAvailable: !!eb, portsInitialized: Ports.isInitialized() }; let passed = 0; const checkKeys = Object.keys(checks); for (let i = 0; i < checkKeys.length; i++) { if ((checks as DynObj)[checkKeys[i]]) passed++; } return { status: passed === checkKeys.length ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${checkKeys.length}`, checks, counts, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), counts: getCounts(), activeOverlays: getActiveOverlays(), topOverlay: getTopOverlay(), timestamp: Date.now() }; }

export default { acquire, release, releaseAll, getCounts, getActiveOverlays, isActive, getTopOverlay, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
