import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
const VERSION = "5.10.0-UARPS-ONLY";
const MODULE_ID = "sidebar-registry";
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
const CONFIG = {
  source: "api",
  apiEndpoint: "/api/ui/navigation.php?action=manifest",
  fallbackToManifest: true,
  cacheEnabled: true,
  cacheTTL: 5 * 60 * 1e3
};
const DEFAULT_SECTION_ICONS = {
  main: "dashboard",
  principal: "dashboard",
  operacional: "settings",
  admin: "shield",
  administracao: "shield",
  config: "cog",
  default: "grid"
};
const _sections = /* @__PURE__ */ new Map();
const _items = /* @__PURE__ */ new Map();
const _itemsByKey = /* @__PURE__ */ new Map();
const _badges = /* @__PURE__ */ new Map();
const _subscribers = /* @__PURE__ */ new Set();
let _cache = { data: null, timestamp: 0 };
let _userLevel = 0;
const _metrics = {
  source: null,
  sectionsLoaded: 0,
  itemsLoaded: 0,
  badgesSet: 0,
  filtersApplied: 0,
  apiCalls: 0,
  apiFails: 0,
  cacheHits: 0,
  keyLookups: 0,
  lastLoad: null,
  lastUpdate: null,
  errors: 0
};
function _notify(event, data) {
  const state = {
    sections: getSections(),
    items: getItems(),
    badges: getBadges(),
    event,
    data,
    timestamp: Date.now()
  };
  _subscribers.forEach((fn) => {
    try {
      fn(state);
    } catch (e) {
      _metrics.errors++;
    }
  });
  const eb = _getPort("eventBus");
  if (eb?.emit) {
    eb.emit(event, { source: MODULE_ID, ...state });
  }
}
function _normalizeItem(raw) {
  return {
    ...raw,
    key: raw.item_key || null,
    route: raw.route_path || null,
    panelId: raw.panel_id || null,
    order: raw.order_index ?? 100,
    permissions: raw.required_permissions ? raw.required_permissions.split(",").map((p) => p.trim()) : [],
    sectionId: raw.parent_key || null,
    visible: raw.is_visible !== 0 && raw.is_active !== 0,
    disabled: raw.is_disabled === 1
  };
}
async function loadFromAPI(endpoint = CONFIG.apiEndpoint) {
  if (CONFIG.cacheEnabled && _cache.data && Date.now() - _cache.timestamp < CONFIG.cacheTTL) {
    _metrics.cacheHits++;
    _processManifestData(_cache.data);
    return { success: true, source: "cache", sectionsCount: _sections.size, itemsCount: _items.size };
  }
  _metrics.apiCalls++;
  try {
    const response = await fetch(endpoint, {
      headers: { "Accept": "application/json" },
      credentials: "include"
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const json = await response.json();
    if (!json.ok && !json.success) throw new Error(json.error || "API returned error");
    const manifest = json.data;
    _userLevel = manifest.userLevel ?? 0;
    if (CONFIG.cacheEnabled) {
      _cache = { data: manifest, timestamp: Date.now() };
    }
    _processManifestData(manifest);
    _metrics.source = "api";
    _notify(SIDEBAR_EVENTS.REGISTRY_LOADED, {
      source: "api",
      sectionsCount: _sections.size,
      itemsCount: _items.size
    });
    return { success: true, source: "api", sectionsCount: _sections.size, itemsCount: _items.size };
  } catch (error) {
    _metrics.apiFails++;
    _metrics.errors++;
    if (CONFIG.fallbackToManifest) {
      return loadFromManifest();
    }
    _notify(SIDEBAR_EVENTS.REGISTRY_ERROR, { error: error.message });
    return { success: false, error: error.message };
  }
}
function _processManifestData(manifest) {
  _sections.clear();
  _items.clear();
  _itemsByKey.clear();
  let rawItems = manifest.items || [];
  if (!Array.isArray(rawItems)) {
    rawItems = Object.values(rawItems);
  }
  if (manifest.sections && Array.isArray(manifest.sections) && manifest.sections.length > 0) {
    manifest.sections.forEach((section) => {
      const icon = section.icon || DEFAULT_SECTION_ICONS[section.id] || DEFAULT_SECTION_ICONS[section.key] || DEFAULT_SECTION_ICONS.default;
      _sections.set(section.id, {
        ...section,
        icon,
        visible: true,
        collapsible: section.collapsible !== false
      });
    });
  } else {
    const sectionKeys = /* @__PURE__ */ new Set();
    rawItems.forEach((item) => {
      if (item.item_type === "group" || item.item_type === "header" || item.item_type === "section") {
        const sectionId = item.item_key || item.id;
        const icon = item.icon || DEFAULT_SECTION_ICONS[sectionId] || DEFAULT_SECTION_ICONS.default;
        _sections.set(sectionId, {
          id: sectionId,
          key: item.item_key || null,
          label: item.label || item.title || sectionId,
          icon,
          order: item.order_index ?? 100,
          visible: true,
          collapsible: item.collapsible !== false
        });
        sectionKeys.add(sectionId);
      }
    });
    rawItems.forEach((item) => {
      if (item.parent_key && !sectionKeys.has(item.parent_key) && !_sections.has(item.parent_key)) {
        const icon = DEFAULT_SECTION_ICONS[item.parent_key] || DEFAULT_SECTION_ICONS.default;
        _sections.set(item.parent_key, {
          id: item.parent_key,
          key: item.parent_key,
          label: item.parent_key,
          icon,
          order: 100,
          visible: true,
          collapsible: true
        });
        sectionKeys.add(item.parent_key);
      }
    });
  }
  _metrics.sectionsLoaded = _sections.size;
  rawItems.forEach((raw) => {
    if (raw.item_type === "group" || raw.item_type === "header" || raw.item_type === "section") return;
    const item = _normalizeItem(raw);
    _items.set(item.id, item);
    if (item.item_key) {
      _itemsByKey.set(item.item_key, item);
    }
  });
  _metrics.itemsLoaded = _items.size;
  _metrics.lastLoad = Date.now();
}
async function loadFromManifest() {
  try {
    const { getManifest } = await import("./items.manifest.js");
    const manifest = getManifest();
    _processManifestData(manifest);
    _metrics.source = "manifest";
    _notify(SIDEBAR_EVENTS.REGISTRY_LOADED, {
      source: "manifest",
      sectionsCount: _sections.size,
      itemsCount: _items.size
    });
    return { success: true, source: "manifest", sectionsCount: _sections.size, itemsCount: _items.size };
  } catch (error) {
    _metrics.errors++;
    _notify(SIDEBAR_EVENTS.REGISTRY_ERROR, { error: error.message });
    return { success: false, error: error.message };
  }
}
async function load() {
  _initPorts();
  if (CONFIG.source === "api") {
    return loadFromAPI();
  }
  return loadFromManifest();
}
function getSections() {
  return Array.from(_sections.values()).filter((s) => s.visible !== false).sort((a, b) => (a.order || a.priority || 100) - (b.order || b.priority || 100));
}
function getSectionById(id) {
  return _sections.get(id) || null;
}
function getSectionIcon(id) {
  const section = _sections.get(id);
  return section?.icon || DEFAULT_SECTION_ICONS[id] || DEFAULT_SECTION_ICONS.default;
}
function updateSection(id, updates) {
  const section = _sections.get(id);
  if (!section) return { success: false, error: "Section not found" };
  Object.assign(section, updates);
  _metrics.lastUpdate = Date.now();
  _notify(SIDEBAR_EVENTS.REGISTRY_UPDATED, { type: "section", id, updates });
  return { success: true };
}
function getItems(sectionId = null) {
  let items = Array.from(_items.values()).filter((i) => i.visible !== false);
  if (sectionId) {
    items = items.filter((i) => i.sectionId === sectionId || i.parent_key === sectionId);
  }
  return items.sort((a, b) => (a.order || a.priority || 100) - (b.order || b.priority || 100));
}
function getItemById(id) {
  const byId = _items.get(id);
  if (byId) return byId;
  if (typeof id === "string") {
    _metrics.keyLookups++;
    return _itemsByKey.get(id) || null;
  }
  return null;
}
function getItemsBySection(sectionId) {
  return getItems(sectionId);
}
function updateItem(id, updates) {
  const item = getItemById(id);
  if (!item) return { success: false, error: "Item not found" };
  Object.assign(item, updates);
  _metrics.lastUpdate = Date.now();
  _notify(SIDEBAR_EVENTS.REGISTRY_UPDATED, { type: "item", id, updates });
  return { success: true };
}
function setItemVisible(id, visible) {
  return updateItem(id, { visible });
}
function setItemDisabled(id, disabled) {
  return updateItem(id, { disabled });
}
function setBadge(itemId, badge) {
  _badges.set(itemId, {
    itemId,
    value: badge.value ?? null,
    type: badge.type || "info",
    visible: badge.visible ?? true,
    pulse: badge.pulse ?? false
  });
  _metrics.badgesSet++;
  _notify(SIDEBAR_EVENTS.REGISTRY_UPDATED, { type: "badge", itemId, badge });
  return { success: true };
}
function getBadge(itemId) {
  return _badges.get(itemId) || null;
}
function getBadges() {
  return Array.from(_badges.values()).filter((b) => b.visible !== false);
}
function removeBadge(itemId) {
  _badges.delete(itemId);
  _notify(SIDEBAR_EVENTS.REGISTRY_UPDATED, { type: "badge-removed", itemId });
  return { success: true };
}
function applyPermissionFilter(userLevel = null, userPermissions = []) {
  _metrics.filtersApplied++;
  _items.forEach((item, id) => {
    let hasPermission = true;
    const perms = item.permissions || [];
    if (perms.length > 0) {
      hasPermission = perms.some((p) => userPermissions.includes(p));
    }
    item.visible = hasPermission;
  });
  _sections.forEach((section, id) => {
    const visibleItems = getItemsBySection(id).filter((i) => i.visible);
    section.visible = visibleItems.length > 0;
  });
  _notify(SIDEBAR_EVENTS.REGISTRY_UPDATED, { type: "permission-filter", strategy: "uarps-only" });
  return {
    success: true,
    visibleSections: getSections().length,
    visibleItems: getItems().length
  };
}
function getUserLevel() {
  return _userLevel;
}
function invalidateCache() {
  _cache = { data: null, timestamp: 0 };
  return { success: true };
}
function setSource(source) {
  if (source === "api" || source === "manifest") {
    CONFIG.source = source;
    return { success: true, source };
  }
  return { success: false, error: "Invalid source" };
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _subscribers.add(callback);
  return () => _subscribers.delete(callback);
}
function unsubscribe(callback) {
  _subscribers.delete(callback);
}
function clear() {
  _sections.clear();
  _items.clear();
  _itemsByKey.clear();
  _badges.clear();
  _cache = { data: null, timestamp: 0 };
  _userLevel = 0;
}
function reset() {
  clear();
  Object.keys(_metrics).forEach((k) => {
    if (typeof _metrics[k] === "number") _metrics[k] = 0;
    else if (_metrics[k] !== null) _metrics[k] = null;
  });
}
function healthCheck() {
  const hasItems = _items.size > 0;
  const hasSections = _sections.size > 0;
  const cacheValid = CONFIG.cacheEnabled && _cache.data && Date.now() - _cache.timestamp < CONFIG.cacheTTL;
  const noErrors = _metrics.errors === 0;
  const apiWorking = _metrics.apiFails === 0 || _metrics.apiCalls > _metrics.apiFails;
  const portsInitialized = Ports.isInitialized();
  const hasDualIndex = _itemsByKey.size > 0;
  const checks = { hasItems, hasSections, hasDualIndex, cacheValid, noErrors, apiWorking, portsInitialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!hasItems || !hasSections) status = "UNHEALTHY";
  else if (_metrics.errors > 0 || !apiWorking) status = "DEGRADED";
  return {
    status,
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    source: _metrics.source,
    sectionsCount: _sections.size,
    itemsCount: _items.size,
    itemsByKeyCount: _itemsByKey.size,
    badgesCount: _badges.size,
    subscribersCount: _subscribers.size,
    metrics: { ..._metrics },
    config: { ...CONFIG },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    source: _metrics.source,
    sections: getSections(),
    items: getItems(),
    badges: getBadges(),
    metrics: { ..._metrics },
    config: { ...CONFIG },
    portsInitialized: Ports.isInitialized(),
    healthCheck: healthCheck()
  };
}
function getMetrics() {
  return { ..._metrics };
}
const SidebarRegistry = {
  VERSION,
  MODULE_ID,
  load,
  loadFromManifest,
  loadFromAPI,
  getSections,
  getSectionById,
  getSectionIcon,
  updateSection,
  getItems,
  getItemById,
  getItemsBySection,
  updateItem,
  setItemVisible,
  setItemDisabled,
  setBadge,
  getBadge,
  getBadges,
  removeBadge,
  applyPermissionFilter,
  getUserLevel,
  invalidateCache,
  setSource,
  subscribe,
  unsubscribe,
  clear,
  reset,
  healthCheck,
  info,
  getMetrics,
  injectPorts,
  getPorts
};
if (typeof window !== "undefined") {
  window.SidebarRegistry = SidebarRegistry;
}
var registry_default = SidebarRegistry;
export {
  MODULE_ID,
  VERSION,
  applyPermissionFilter,
  clear,
  registry_default as default,
  getBadge,
  getBadges,
  getItemById,
  getItems,
  getItemsBySection,
  getMetrics,
  getPorts,
  getSectionById,
  getSectionIcon,
  getSections,
  getUserLevel,
  healthCheck,
  info,
  injectPorts,
  invalidateCache,
  load,
  loadFromAPI,
  loadFromManifest,
  removeBadge,
  reset,
  setBadge,
  setItemDisabled,
  setItemVisible,
  setSource,
  subscribe,
  unsubscribe,
  updateItem,
  updateSection
};
