// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.overlay-layer.core.auto-recovery
// PURPOSE: Overlay Layer Auto Recovery - Automatic orphan cleanup
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INJECT_PORTS - injectPorts() for dependency injection
// @contract GET_PORTS - getPorts() returns ports snapshot
// @contract START - start() starts monitoring
// @contract STOP - stop() stops monitoring
// @contract PERFORM_CHECK - performHealthCheck() runs health check
// @contract FORCE_RECOVERY - forceRecovery() forces full recovery
// @contract GET_LOG - getRecoveryLog() returns recovery log
// @contract CLEAR_LOG - clearRecoveryLog() clears recovery log
// @contract GET_CONFIG - getConfig() returns recovery config
// @contract SET_CONFIG - setConfig() updates recovery config
// @contract GET_METRICS - getMetrics() returns recovery metrics
// @contract RESET_METRICS - resetMetrics() resets metrics
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   OVERLAY_EVENTS from /core/runtime/events/index.js
//   ReferenceCounter from ./reference-counter.js
//   FocusGovernance from ./focus-governance.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   start() — exported function
//   stop() — exported function
//   performHealthCheck() — exported function
//   forceRecovery() — exported function
//   getRecoveryLog() — exported function
//   clearRecoveryLog() — exported function
//   getConfig() — exported function
//   setConfig() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): config object
// EMITS (eventos): overlay:recovery
// LISTENS (eventos): (none)
// WINDOW ACCESS: window.LayoutManager, document.querySelectorAll
// ───────────────────────────────────────────────────────────────
// @changelog v1.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.3.1-ENTERPRISE: ES5 conversion (forEach to for loops)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { OVERLAY_EVENTS } from '/core/runtime/events/catalog/overlay.events.js';
import * as ReferenceCounter from './reference-counter.js';
import * as FocusGovernance from './focus-governance.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


declare const UI_INTENTS: Record<string, string>;
export const VERSION = '1.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.auto-recovery';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const hasWindow = typeof window !== 'undefined';
const _config = { enabled: true, maxOverlayAge: 300000, checkInterval: 30000, maxStackSize: 5, autoCleanupOrphans: true };
let _checkTimer: DynObj = null;
let _recoveryLog: DynObj[] = [];
let _metrics = { checksPerformed: 0, recoveries: 0, orphansCleared: 0, scrollLockRestores: 0, focusRestores: 0 };


// @ts-expect-error TS migration - TS2339
function _setScrollLock(locked) { const lm = hasWindow ? window.LayoutManager : null; if (lm && lm.setScrollLocked) { lm.setScrollLocked(locked); return true; } const eb = _getPort('eventBus'); if (eb && eb.emit) { eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode: locked ? 'scroll-lock' : 'scroll-unlock', source: MODULE_ID, timestamp: Date.now() }); return true; } return false; }

export function start(config: DynObj) { if (!config) config = {}; if (config.maxOverlayAge) _config.maxOverlayAge = config.maxOverlayAge; if (config.checkInterval) _config.checkInterval = config.checkInterval; if (config.maxStackSize) _config.maxStackSize = config.maxStackSize; if (config.autoCleanupOrphans !== undefined) _config.autoCleanupOrphans = config.autoCleanupOrphans; if (_checkTimer) clearInterval(_checkTimer); _config.enabled = true; _checkTimer = setInterval(performHealthCheck, _config.checkInterval); setTimeout(performHealthCheck, 5000); return { ok: true, config: Object.assign({}, _config) }; }
export function stop() { if (_checkTimer) { clearInterval(_checkTimer); _checkTimer = null; } _config.enabled = false; return { ok: true }; }


// @ts-expect-error TS migration - TS2554
export function performHealthCheck() { if (!_config.enabled) return { ok: false, reason: 'disabled' }; _metrics.checksPerformed++; const issues = []; const actions = []; const activeOverlays = ReferenceCounter.getActiveOverlays(); const now = Date.now(); for (let i = 0; i < activeOverlays.length; i++) { const overlay = activeOverlays[i]; const age = now - overlay.timestamp; if (age > _config.maxOverlayAge) { issues.push({ type: 'stale-overlay', id: overlay.id, age }); if (_config.autoCleanupOrphans) { ReferenceCounter.release(overlay.id); FocusGovernance.disengageFocusGovernance(overlay.id); actions.push({ action: 'released-stale', id: overlay.id }); _metrics.recoveries++; _logRecovery('stale-overlay', overlay.id, age); } } } if (activeOverlays.length > _config.maxStackSize) { issues.push({ type: 'stack-overflow', count: activeOverlays.length }); const sorted = activeOverlays.slice().sort((a, b) => a.timestamp - b.timestamp); const toRemove = sorted.slice(0, activeOverlays.length - _config.maxStackSize); for (let j = 0; j < toRemove.length; j++) { const ov = toRemove[j]; ReferenceCounter.release(ov.id); FocusGovernance.disengageFocusGovernance(ov.id); actions.push({ action: 'released-overflow', id: ov.id }); _metrics.recoveries++; _logRecovery('stack-overflow', ov.id); } } const counts = ReferenceCounter.getCounts(); if (counts.isScrollLocked && counts.activeOverlays === 0) { issues.push({ type: 'orphan-scroll-lock' }); _setScrollLock(false); actions.push({ action: 'restored-scroll' }); _metrics.scrollLockRestores++; _logRecovery('orphan-scroll-lock'); } const orphanBackdrops = document.querySelectorAll('.overlay-backdrop:not([data-overlay-id])'); if (orphanBackdrops.length > 0 && _config.autoCleanupOrphans) { for (let k = 0; k < orphanBackdrops.length; k++) { orphanBackdrops[k].remove(); _metrics.orphansCleared++; } issues.push({ type: 'orphan-backdrops', count: orphanBackdrops.length }); actions.push({ action: 'removed-orphan-backdrops', count: orphanBackdrops.length }); _logRecovery('orphan-backdrops', null, orphanBackdrops.length); } const focusHealth = FocusGovernance.healthCheck(); if (focusHealth.status !== 'HEALTHY' && counts.activeOverlays === 0) { FocusGovernance.forceCleanup(); actions.push({ action: 'focus-cleanup' }); _metrics.focusRestores++; issues.push({ type: 'orphan-focus-state' }); _logRecovery('orphan-focus-state'); } return { ok: issues.length === 0, issues, actions, timestamp: Date.now() }; }

// @ts-expect-error strict migration — TS2345
export function forceRecovery(reason: DynObj) { if (!reason) reason = 'manual'; const results = { referenceCounter: ReferenceCounter.releaseAll(reason), focusGovernance: FocusGovernance.forceCleanup(), scrollLock: _setScrollLock(false) }; _metrics.recoveries++; _logRecovery('force-recovery', null, reason); const els = document.querySelectorAll('.overlay-backdrop, [data-overlay-backdrop]'); for (let i = 0; i < els.length; i++) { els[i].remove(); _metrics.orphansCleared++; } return { ok: true, results }; }

function _logRecovery(type: DynObj, overlayId: string, extra: DynObj) { _recoveryLog.push({ type, overlayId: overlayId || null, extra: extra || null, timestamp: Date.now() }); if (_recoveryLog.length > 50) _recoveryLog = _recoveryLog.slice(-50); const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(OVERLAY_EVENTS.RECOVERY, { type, overlayId, extra }); }

export function getRecoveryLog() { return _recoveryLog.slice(); }
export function clearRecoveryLog() { const count = _recoveryLog.length; _recoveryLog = []; return { ok: true, cleared: count }; }
export function getConfig() { return Object.assign({}, _config); }
export function setConfig(newConfig: DynObj) { if (newConfig.maxOverlayAge) _config.maxOverlayAge = newConfig.maxOverlayAge; if (newConfig.checkInterval) _config.checkInterval = newConfig.checkInterval; if (newConfig.maxStackSize) _config.maxStackSize = newConfig.maxStackSize; if (newConfig.autoCleanupOrphans !== undefined) _config.autoCleanupOrphans = newConfig.autoCleanupOrphans; if (newConfig.checkInterval && _checkTimer) { clearInterval(_checkTimer); _checkTimer = setInterval(performHealthCheck, _config.checkInterval); } return { ok: true, config: Object.assign({}, _config) }; }
export function getMetrics() { return Object.assign({}, _metrics); }
export function resetMetrics() { _metrics = { checksPerformed: 0, recoveries: 0, orphansCleared: 0, scrollLockRestores: 0, focusRestores: 0 }; return { ok: true }; }
export function healthCheck() { const eb = _getPort('eventBus'); const checks = { monitoringActive: _config.enabled && _checkTimer !== null, lowRecoveryRate: _metrics.checksPerformed === 0 || (_metrics.recoveries / _metrics.checksPerformed) < 0.1, logNotOverflowing: _recoveryLog.length < 40, eventBusAvailable: !!eb, portsInitialized: Ports.isInitialized() }; let passed = 0; const checkKeys = Object.keys(checks); for (let i = 0; i < checkKeys.length; i++) { if ((checks as DynObj)[checkKeys[i]]) passed++; } return { status: passed === checkKeys.length ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${checkKeys.length}`, checks, metrics: getMetrics(), config: getConfig(), recentRecoveries: _recoveryLog.slice(-5), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), enabled: _config.enabled, monitoring: _checkTimer !== null, config: getConfig(), metrics: getMetrics(), recoveryLogSize: _recoveryLog.length, timestamp: Date.now() }; }

export default { start, stop, performHealthCheck, forceRecovery, getRecoveryLog, clearRecoveryLog, getConfig, setConfig, getMetrics, resetMetrics, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
