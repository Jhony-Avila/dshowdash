import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { CSS_CLASSES as C } from "../ui/constants.js";
const VERSION = "6.1.0-ES6";
const MODULE_ID = "sidebar-dynamic-badges";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
let _badges = /* @__PURE__ */ new Map();
let _intervals = /* @__PURE__ */ new Map();
let _container = null;
let _metrics = { sets: 0, removes: 0, increments: 0, decrements: 0 };
const BADGE_TYPES = {
  count: { class: "dsd-badge--count", format: (v) => v > 99 ? "99+" : String(v) },
  dot: { class: "dsd-badge--dot", format: () => "" },
  new: { class: "dsd-badge--new", format: () => "NEW" },
  hot: { class: "dsd-badge--hot", format: () => "HOT" },
  live: { class: "dsd-badge--live", format: () => "\u25CF" },
  status: { class: "dsd-badge--status", format: (v) => v },
  percent: { class: "dsd-badge--percent", format: (v) => `${v}%` },
  time: { class: "dsd-badge--time", format: (v) => v }
};
function init(eventBus, container) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  _container = container;
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.BADGES_INITIALIZED);
}
function setBadge(itemId, options = {}) {
  const { value = 0, type = "count", variant = "default", pulse = false, animate = true, tooltip = null, onClick = null } = options;
  _badges.set(itemId, { value, type, variant, pulse, animate, tooltip, onClick, updatedAt: Date.now() });
  _metrics.sets++;
  renderBadge(itemId);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.BADGE_UPDATED, { itemId, value, type });
  return true;
}
function getBadge(itemId) {
  return _badges.get(itemId) || null;
}
function removeBadge(itemId) {
  _badges.delete(itemId);
  clearInterval(_intervals.get(itemId));
  _intervals.delete(itemId);
  _metrics.removes++;
  const item = findItem(itemId);
  if (item) {
    const badge = item.querySelector(".dsd-badge");
    if (badge) badge.remove();
  }
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.BADGE_REMOVED, { itemId });
  return true;
}
function incrementBadge(itemId, amount = 1) {
  _metrics.increments++;
  const badge = _badges.get(itemId);
  if (!badge) return setBadge(itemId, { value: amount });
  badge.value = (badge.value || 0) + amount;
  badge.updatedAt = Date.now();
  renderBadge(itemId);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.BADGE_INCREMENTED, { itemId, value: badge.value, amount });
  return badge.value;
}
function decrementBadge(itemId, amount = 1) {
  _metrics.decrements++;
  const badge = _badges.get(itemId);
  if (!badge) return 0;
  badge.value = Math.max(0, (badge.value || 0) - amount);
  badge.updatedAt = Date.now();
  if (badge.value === 0 && badge.type === "count") {
    removeBadge(itemId);
    return 0;
  }
  renderBadge(itemId);
  return badge.value;
}
function setLiveBadge(itemId, fetchFn, intervalMs = 3e4) {
  clearInterval(_intervals.get(itemId));
  const update = async () => {
    try {
      const value = await fetchFn();
      setBadge(itemId, { value, type: "count", pulse: true });
    } catch {
    }
  };
  update();
  const intervalId = setInterval(update, intervalMs);
  _intervals.set(itemId, intervalId);
  return () => {
    clearInterval(intervalId);
    _intervals.delete(itemId);
  };
}
function setCountdownBadge(itemId, seconds, onComplete = null) {
  let remaining = seconds;
  const formatTime = (s) => {
    if (s >= 3600) {
      const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
      return `${h}h${m}m`;
    } else if (s >= 60) {
      const m = Math.floor(s / 60), sec = s % 60;
      return `${m}:${String(sec).padStart(2, "0")}`;
    }
    return `${s}s`;
  };
  setBadge(itemId, { value: formatTime(remaining), type: "time", pulse: true });
  const intervalId = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(intervalId);
      _intervals.delete(itemId);
      removeBadge(itemId);
      if (onComplete) onComplete();
      return;
    }
    setBadge(itemId, { value: formatTime(remaining), type: "time", pulse: remaining <= 10 });
  }, 1e3);
  _intervals.set(itemId, intervalId);
  return () => {
    clearInterval(intervalId);
    _intervals.delete(itemId);
  };
}
function renderBadge(itemId) {
  const item = findItem(itemId);
  if (!item) return;
  const badgeData = _badges.get(itemId);
  if (!badgeData) return;
  const { value, type, variant, pulse, animate, tooltip, onClick } = badgeData;
  const typeConfig = BADGE_TYPES[type] || BADGE_TYPES.count;
  let badge = item.querySelector(".dsd-badge");
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "dsd-badge";
    const label = item.querySelector(`.${C.ITEM_LABEL}`);
    if (label) label.after(badge);
    else item.appendChild(badge);
  }
  badge.className = `dsd-badge ${typeConfig.class}`;
  if (variant && variant !== "default") badge.classList.add(`dsd-badge--${variant}`);
  if (pulse) badge.classList.add("dsd-badge--pulse");
  if (animate) badge.classList.add("dsd-badge--animate");
  badge.textContent = typeConfig.format(value);
  if (tooltip) badge.title = tooltip;
  if (onClick) {
    badge.style.cursor = "pointer";
    badge.onclick = (e) => {
      e.stopPropagation();
      onClick(itemId, value);
    };
  }
}
function findItem(itemId) {
  if (!_container) _container = document.querySelector(`.${C.ROOT}`);
  return _container ? _container.querySelector(`[data-item-id="${itemId}"], [data-panel-id="${itemId}"]`) : null;
}
function getAllBadges() {
  const result = {};
  _badges.forEach((badge, itemId) => {
    result[itemId] = { ...badge };
  });
  return result;
}
function clearAllBadges() {
  _intervals.forEach((id) => clearInterval(id));
  _intervals.clear();
  _badges.forEach((_, itemId) => {
    const item = findItem(itemId);
    if (item) {
      const badge = item.querySelector(".dsd-badge");
      if (badge) badge.remove();
    }
  });
  _badges.clear();
}
function destroy() {
  clearAllBadges();
  _container = null;
}
function getMetrics() {
  return { ..._metrics, badgeCount: _badges.size, liveUpdates: _intervals.size };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), badgeCount: _badges.size, liveUpdates: _intervals.size, metrics: getMetrics() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { badgeCount: _badges.size, liveUpdates: _intervals.size }, metrics: getMetrics() };
}
var dynamic_badges_default = { init, setBadge, getBadge, removeBadge, incrementBadge, decrementBadge, setLiveBadge, setCountdownBadge, getAllBadges, clearAllBadges, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clearAllBadges,
  decrementBadge,
  dynamic_badges_default as default,
  destroy,
  getAllBadges,
  getBadge,
  getMetrics,
  getPorts,
  healthCheck,
  incrementBadge,
  info,
  init,
  injectPorts,
  removeBadge,
  setBadge,
  setCountdownBadge,
  setLiveBadge
};
