// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-dynamic-badges
// PURPOSE: Sidebar Features - Dynamic Badges
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//   CSS_CLASSES as C from ../ui/constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   setBadge() — exported function
//   getBadge() — exported function
//   removeBadge() — exported function
//   incrementBadge() — exported function
//   decrementBadge() — exported function
//   setLiveBadge() — exported function
//   setCountdownBadge() — exported function
//   getAllBadges() — exported function
//   clearAllBadges() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.BADGES_INITIALIZED
//   SIDEBAR_EVENTS.BADGE_INCREMENTED
//   SIDEBAR_EVENTS.BADGE_REMOVED
//   SIDEBAR_EVENTS.BADGE_UPDATED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { CSS_CLASSES as C } from '../ui/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '6.1.0-ES6';
export const MODULE_ID = 'sidebar-dynamic-badges';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _badges = new Map();
let _intervals = new Map();
let _container: HTMLElement | null = null;
let _metrics = { sets: 0, removes: 0, increments: 0, decrements: 0 };

const BADGE_TYPES = {
  count: { class: 'dsd-badge--count', format: (v: DynObj ) => v > 99 ? '99+' : String(v) },
  dot: { class: 'dsd-badge--dot', format: () => '' },
  new: { class: 'dsd-badge--new', format: () => 'NEW' },
  hot: { class: 'dsd-badge--hot', format: () => 'HOT' },
  live: { class: 'dsd-badge--live', format: () => '●' },
  status: { class: 'dsd-badge--status', format: (v: DynObj ) => v },
  percent: { class: 'dsd-badge--percent', format: (v: DynObj ) => `${v}%` },
  time: { class: 'dsd-badge--time', format: (v: DynObj ) => v }
};

export function init(eventBus: DynObj, container: HTMLElement) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  _container = container;
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.BADGES_INITIALIZED);
}

export function setBadge(itemId: string, options: { value?: number | string; type?: string; variant?: string; pulse?: boolean; animate?: boolean; tooltip?: string | null; onClick?: ((itemId: string, value: number | string) => void) | null } = {}) {
  const { value = 0, type = 'count', variant = 'default', pulse = false, animate = true, tooltip = null, onClick = null } = options;
  _badges.set(itemId, { value, type, variant, pulse, animate, tooltip, onClick, updatedAt: Date.now() });
  _metrics.sets++;
  renderBadge(itemId);
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.BADGE_UPDATED, { itemId, value, type });
  return true;
}

export function getBadge(itemId: string) { return _badges.get(itemId) || null; }

export function removeBadge(itemId: string) {
  _badges.delete(itemId);
  clearInterval(_intervals.get(itemId));
  _intervals.delete(itemId);
  _metrics.removes++;
  const item = findItem(itemId);
  if (item) { const badge = item.querySelector('.dsd-badge'); if (badge) badge.remove(); }
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.BADGE_REMOVED, { itemId });
  return true;
}

export function incrementBadge(itemId: string, amount = 1) {
  _metrics.increments++;
  const badge = _badges.get(itemId);
  if (!badge) return setBadge(itemId, { value: amount });
  badge.value = (badge.value || 0) + amount;
  badge.updatedAt = Date.now();
  renderBadge(itemId);
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.BADGE_INCREMENTED, { itemId, value: badge.value, amount });
  return badge.value;
}

export function decrementBadge(itemId: string, amount = 1) {
  _metrics.decrements++;
  const badge = _badges.get(itemId);
  if (!badge) return 0;
  badge.value = Math.max(0, (badge.value || 0) - amount);
  badge.updatedAt = Date.now();
  if (badge.value === 0 && badge.type === 'count') { removeBadge(itemId); return 0; }
  renderBadge(itemId);
  return badge.value;
}

export function setLiveBadge(itemId: string, fetchFn: DynObj, intervalMs = 30000) {
  clearInterval(_intervals.get(itemId));
  const update = async () => { try { const value = await fetchFn(); setBadge(itemId, { value, type: 'count', pulse: true }); } catch { } };
  update();
  const intervalId = setInterval(update, intervalMs);
  _intervals.set(itemId, intervalId);
  return () => { clearInterval(intervalId); _intervals.delete(itemId); };
}

// @ts-expect-error strict migration — TS2322
export function setCountdownBadge(itemId: string, seconds: DynObj, onComplete : () => void = null) {
  let remaining = seconds;
  const formatTime = (s: string) => { if ((s as DynObj) >= 3600) { const h = Math.floor((s as DynObj) / 3600), m = Math.floor(((s as DynObj) % 3600) / 60); return `${h}h${m}m`; } else if ((s as DynObj) >= 60) { const m = Math.floor((s as DynObj) / 60), sec = (s as DynObj) % 60; return `${m}:${String(sec).padStart(2, '0')}`; } return `${s}s`; };
  setBadge(itemId, { value: formatTime(remaining), type: 'time', pulse: true });
  const intervalId = setInterval(() => { remaining--; if (remaining <= 0) { clearInterval(intervalId); _intervals.delete(itemId); removeBadge(itemId); if (onComplete) onComplete(); return; } setBadge(itemId, { value: formatTime(remaining), type: 'time', pulse: remaining <= 10 }); }, 1000);
  _intervals.set(itemId, intervalId);
  return () => { clearInterval(intervalId); _intervals.delete(itemId); };
}

function renderBadge(itemId: string) {
  const item = findItem(itemId);
  if (!item) return;
  const badgeData = _badges.get(itemId);
  if (!badgeData) return;
  const { value, type, variant, pulse, animate, tooltip, onClick } = badgeData;
  const typeConfig = (BADGE_TYPES as DynObj)[type] || BADGE_TYPES.count;
  let badge = item.querySelector('.dsd-badge');
  if (!badge) { badge = document.createElement('span'); badge.className = 'dsd-badge'; const label = item.querySelector(`.${C.ITEM_LABEL}`); if (label) label.after(badge); else item.appendChild(badge); }
  badge.className = `dsd-badge ${typeConfig.class}`;
  if (variant && variant !== 'default') badge.classList.add(`dsd-badge--${variant}`);
  if (pulse) badge.classList.add('dsd-badge--pulse');
  if (animate) badge.classList.add('dsd-badge--animate');
  badge.textContent = typeConfig.format(value);
  if (tooltip) (badge as DynObj).title = tooltip;
  if (onClick) { (badge as DynObj).style.cursor = 'pointer'; (badge as DynObj).onclick = (e: DynObj) => { e.stopPropagation(); onClick(itemId, value); }; }
}

function findItem(itemId: string) { if (!_container) _container = document.querySelector(`.${C.ROOT}`); return _container ? _container.querySelector(`[data-item-id="${itemId}"], [data-panel-id="${itemId}"]`) : null; }

export function getAllBadges() { const result = {}; _badges.forEach((badge, itemId) => { (result as DynObj)[itemId] = { ...badge }; }); return result; }
export function clearAllBadges() { _intervals.forEach(id => clearInterval(id)); _intervals.clear(); _badges.forEach((_, itemId) => { const item = findItem(itemId); if (item) { const badge = item.querySelector('.dsd-badge'); if (badge) badge.remove(); } }); _badges.clear(); }
export function destroy() { clearAllBadges(); _container = null; }
export function getMetrics() { return { ..._metrics, badgeCount: _badges.size, liveUpdates: _intervals.size }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), badgeCount: _badges.size, liveUpdates: _intervals.size, metrics: getMetrics() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { badgeCount: _badges.size, liveUpdates: _intervals.size }, metrics: getMetrics() }; }

export default { init, setBadge, getBadge, removeBadge, incrementBadge, decrementBadge, setLiveBadge, setCountdownBadge, getAllBadges, clearAllBadges, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
