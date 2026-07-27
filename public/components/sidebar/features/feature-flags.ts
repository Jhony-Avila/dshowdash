// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-feature-flags
// PURPOSE: Sidebar Features - Feature Flags
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   isEnabled() — exported function
//   enable() — exported function
//   disable() — exported function
//   toggle() — exported function
//   getAll() — exported function
//   getByCategory() — exported function
//   getCategories() — exported function
//   reset() — exported function
//   bulkUpdate() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.FEATURES_BULK_UPDATED
//   SIDEBAR_EVENTS.FEATURES_RESET
//   SIDEBAR_EVENTS.FEATURE_DISABLED
//   SIDEBAR_EVENTS.FEATURE_ENABLED
//   SIDEBAR_EVENTS.FEATURE_TOGGLED
//   SIDEBAR_EVENTS.FLAGS_INITIALIZED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '6.0.0-ES6';
export const MODULE_ID = 'sidebar-feature-flags';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const STORAGE_KEY = 'dsd-sidebar-feature-flags';
let _metrics = { enables: 0, disables: 0, toggles: 0, resets: 0 };

const DEFAULT_FLAGS = {
  parallax: { enabled: true, label: 'Parallax Scroll', category: 'visual' },
  customCursors: { enabled: false, label: 'Custom Cursors', category: 'visual' },
  compactMode: { enabled: true, label: 'Compact Mode', category: 'layout' },
  miniMode: { enabled: true, label: 'Mini Mode', category: 'layout' },
  dragDrop: { enabled: false, label: 'Drag & Drop Reorder', category: 'interaction' },
  fuzzySearch: { enabled: true, label: 'Fuzzy Search', category: 'search' },
  commandPalette: { enabled: true, label: 'Command Palette (Ctrl+K)', category: 'productivity' },
  favorites: { enabled: true, label: 'Favorites', category: 'organization' },
  timeTracking: { enabled: false, label: 'Time Tracking', category: 'analytics' },
  autoTheme: { enabled: true, label: 'Auto Theme Detection', category: 'theme' },
  debugPanel: { enabled: true, label: 'Debug Panel', category: 'debug' }
};

let _flags: Record<string, { enabled: boolean; label: string; category: string }> = {};

function loadFlags() { try { const saved = localStorage.getItem(STORAGE_KEY); const savedFlags = saved ? JSON.parse(saved) : {}; _flags = {}; Object.entries(DEFAULT_FLAGS).forEach(([key, config]) => { _flags[key] = { ...config, enabled: savedFlags[key]?.enabled ?? config.enabled }; }); } catch { _flags = { ...DEFAULT_FLAGS }; } }
function saveFlags() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_flags)); } catch { } }

export function init(eventBus: DynObj) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  loadFlags();
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.FLAGS_INITIALIZED);
}

export function isEnabled(featureKey: string) { return _flags[featureKey]?.enabled ?? false; }

export function enable(featureKey: string) {
  if (!_flags[featureKey]) return false;
  _flags[featureKey].enabled = true;
  _metrics.enables++;
  saveFlags();
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.FEATURE_ENABLED, { feature: featureKey });
  return true;
}

export function disable(featureKey: string) {
  if (!_flags[featureKey]) return false;
  _flags[featureKey].enabled = false;
  _metrics.disables++;
  saveFlags();
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.FEATURE_DISABLED, { feature: featureKey });
  return true;
}

export function toggle(featureKey: string) {
  if (!_flags[featureKey]) return null;
  _metrics.toggles++;
  const newState = !_flags[featureKey].enabled;
  _flags[featureKey].enabled = newState;
  saveFlags();
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.FEATURE_TOGGLED, { feature: featureKey, enabled: newState });
  return newState;
}

export function getAll() { return { ..._flags }; }
export function getByCategory(category: string) { return (Object.entries(_flags) as [string, any][]).filter(([_, config]) => config.category === category).map(([key, config]) => ({ key, ...config })); }
export function getCategories() { const categories = new Set((Object.values(_flags) as any[]).map(f => f.category)); return [...categories]; }

export function reset() { _flags = { ...DEFAULT_FLAGS }; _metrics.resets++; saveFlags(); const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.FEATURES_RESET); }

export function bulkUpdate(updates: DynObj) { Object.entries(updates).forEach(([key, enabled]) => { if (_flags[key]) _flags[key].enabled = enabled as boolean; }); saveFlags(); const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.FEATURES_BULK_UPDATED, { updates }); }

export function destroy() { _flags = {}; }
export function getMetrics() { const enabled = (Object.values(_flags) as any[]).filter(f => f.enabled).length; return { ..._metrics, totalFeatures: Object.keys(_flags).length, enabledFeatures: enabled }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), totalFeatures: Object.keys(_flags).length, enabledFeatures: (Object.values(_flags) as any[]).filter(f => f.enabled).length, categories: getCategories(), metrics: getMetrics() }; }
export function healthCheck() { const enabled = (Object.values(_flags) as any[]).filter(f => f.enabled).length; return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { totalFeatures: Object.keys(_flags).length, enabledFeatures: enabled }, metrics: getMetrics() }; }

export default { init, isEnabled, enable, disable, toggle, getAll, getByCategory, getCategories, reset, bulkUpdate, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID, DEFAULT_FLAGS };
