import { createLogger } from "../../core/logger.js";
const VERSION = "1.3.0-ENTERPRISE";
const MODULE_ID = "footer-buttons-registry";
const _log = createLogger(MODULE_ID);
const COMPONENT_MAP = {
  "dashboard": () => import("./dashboard/index.js"),
  "analytics": () => import("./analytics/index.js"),
  "pie-chart": () => import("./pie-chart/index.js"),
  "trending-up": () => import("./trending-up/index.js"),
  "users": () => import("./users/index.js"),
  "settings": () => import("./settings/index.js"),
  "database": () => import("./database/index.js"),
  "server": () => import("./server/index.js"),
  "cloud": () => import("./cloud/index.js"),
  "zap": () => import("./zap/index.js"),
  "calendar": () => import("./calendar/index.js"),
  "mail": () => import("./mail/index.js"),
  "bell": () => import("./bell/index.js"),
  "folder": () => import("./folder/index.js"),
  "credit-card": () => import("./credit-card/index.js"),
  "security": () => import("./security/index.js"),
  "search": () => import("./search/index.js"),
  "activity": () => import("./activity/index.js"),
  "globe": () => import("./globe/index.js"),
  "lock": () => import("./lock/index.js"),
  "link": () => import("./link/index.js"),
  "cpu": () => import("./cpu/index.js"),
  "hard-drive": () => import("./hard-drive/index.js"),
  "monitor": () => import("./monitor/index.js"),
  "clipboard": () => import("./clipboard/index.js"),
  "target": () => import("./target/index.js"),
  "bookmark": () => import("./bookmark/index.js"),
  "language": () => import("./language/index.js"),
  "logout": () => import("./logout/index.js"),
  "termos": () => import("./termos/index.js"),
  "privacidade": () => import("./privacidade/index.js"),
  "lgpd": () => import("./lgpd/index.js")
};
const _loadedComponents = /* @__PURE__ */ new Map();
let _metrics = { loads: 0, mounts: 0, unmounts: 0, errors: 0 };
async function loadComponent(id) {
  if (_loadedComponents.has(id)) return _loadedComponents.get(id);
  const loader = COMPONENT_MAP[id];
  if (!loader) {
    _log.warn(`Component not found: ${id}`);
    return null;
  }
  try {
    _metrics.loads++;
    const module = await loader();
    _loadedComponents.set(id, module);
    return module;
  } catch (err) {
    _metrics.errors++;
    _log.error(`Failed to load: ${id}`, err);
    return null;
  }
}
async function mountComponent(id, hostEl, props = {}) {
  const module = await loadComponent(id);
  if (!module) return null;
  _metrics.mounts++;
  if (typeof module.mount === "function") return module.mount(hostEl, props);
  if (typeof module.getInstance === "function") {
    const instance = module.getInstance();
    if (typeof instance.mount === "function") return instance.mount(hostEl, props);
  }
  return null;
}
async function unmountComponent(id) {
  const module = _loadedComponents.get(id);
  if (!module) return false;
  _metrics.unmounts++;
  if (typeof module.unmount === "function") {
    module.unmount();
    return true;
  }
  if (typeof module.getInstance === "function") {
    const instance = module.getInstance();
    if (typeof instance.unmount === "function") {
      instance.unmount();
      return true;
    }
  }
  return false;
}
function getAvailableIds() {
  return Object.keys(COMPONENT_MAP);
}
function getDecorativeIds() {
  return ["dashboard", "analytics", "pie-chart", "trending-up", "users", "settings", "database", "server", "cloud", "zap", "calendar", "mail", "bell", "folder", "credit-card", "security", "search", "activity", "globe", "lock", "link", "cpu", "hard-drive", "monitor", "clipboard", "target", "bookmark"];
}
function getControlIds() {
  return ["language", "logout"];
}
function getLinkIds() {
  return ["termos", "privacidade", "lgpd"];
}
function hasComponent(id) {
  return COMPONENT_MAP.hasOwnProperty(id);
}
function getMetrics() {
  return { ..._metrics, loaded: _loadedComponents.size };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, availableComponents: getAvailableIds(), decorativeCount: getDecorativeIds().length, controlCount: getControlIds().length, linkCount: getLinkIds().length, totalCount: Object.keys(COMPONENT_MAP).length, loadedComponents: Array.from(_loadedComponents.keys()), metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { registryLoaded: Object.keys(COMPONENT_MAP).length > 0 }, metrics: getMetrics() };
}
var registry_default = { loadComponent, mountComponent, unmountComponent, getAvailableIds, getDecorativeIds, getControlIds, getLinkIds, hasComponent, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  registry_default as default,
  getAvailableIds,
  getControlIds,
  getDecorativeIds,
  getLinkIds,
  getMetrics,
  hasComponent,
  healthCheck,
  info,
  loadComponent,
  mountComponent,
  unmountComponent
};
