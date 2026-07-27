import { createUiPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "panel-navrail-admin:navrail-adapter";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _apiBase = "/api/ui/navrail";
let _cachedItems = null;
let _cachedGroups = null;
let _cacheTimestamp = 0;
const _cacheTTL = 3e4;
function _getLogger() {
  const logger = _getPort("logger");
  if (logger) return logger;
  if (window.Core?.windowAdapter?.get) {
    const wl = window.Core.windowAdapter.get("Logger");
    if (wl) return wl;
  }
  return null;
}
function log(level, msg, data) {
  const logger = _getLogger();
  if (logger && logger[level]) logger[level](`[${MODULE_ID}]`, msg, data);
}
function isCacheValid() {
  return _cachedItems && Date.now() - _cacheTimestamp < _cacheTTL;
}
function clearCache() {
  _cachedItems = null;
  _cachedGroups = null;
  _cacheTimestamp = 0;
  log("debug", "Cache cleared");
}
async function fetchItems(forceRefresh) {
  if (!forceRefresh && isCacheValid()) {
    return { success: true, data: _cachedItems, groups: _cachedGroups };
  }
  try {
    const response = await fetch(`${_apiBase}/items`, { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } });
    const result = await response.json();
    if (result.success && result.data) {
      _cachedItems = result.data.map((item, index) => ({
        id: item.item_key,
        label: item.label,
        tooltip: item.tooltip,
        icon: item.icon_name,
        groupId: item.group_id,
        actionType: item.action_type || "openPanel",
        actionPanelId: item.action_panel_id,
        order: item.order_index || index,
        badgeType: item.badge_type || "none",
        showOnDesktop: !!item.show_on_desktop,
        showOnTablet: !!item.show_on_tablet,
        showOnMobile: !!item.show_on_mobile,
        isActive: !!item.is_active,
        dbId: item.id,
        uarpsTrigger: item.uarps_trigger_id || null,
        minLevel: item.min_access_level || 0
      }));
      _cachedGroups = result.groups || [];
      _cacheTimestamp = Date.now();
      log("info", "Items fetched", { count: _cachedItems.length });
    }
    return { success: true, data: _cachedItems, groups: _cachedGroups };
  } catch (err) {
    log("error", "Failed to fetch items", { error: err.message });
    return { success: false, error: err.message };
  }
}
async function fetchGroups() {
  try {
    const response = await fetch(`${_apiBase}/groups`, { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } });
    const result = await response.json();
    if (result.success) {
      _cachedGroups = result.data || [];
    }
    return result;
  } catch (err) {
    log("error", "Failed to fetch groups", { error: err.message });
    return { success: false, error: err.message };
  }
}
async function createItem(item) {
  try {
    const payload = { item_key: item.id, label: item.label, tooltip: item.tooltip || null, icon_name: item.icon || "circle", group_id: item.groupId || null, action_type: item.actionType || "openPanel", action_panel_id: item.actionPanelId || null, order_index: item.order || 99, badge_type: item.badgeType || "none", show_on_desktop: item.showOnDesktop ? 1 : 0, show_on_tablet: item.showOnTablet ? 1 : 0, show_on_mobile: item.showOnMobile ? 1 : 0, is_active: item.isActive ? 1 : 0, uarps_trigger_id: item.uarpsTrigger || null };
    const response = await fetch(`${_apiBase}/items`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (result.success) clearCache();
    return result;
  } catch (err) {
    log("error", "Failed to create item", { error: err.message });
    return { success: false, error: err.message };
  }
}
async function updateItem(itemId, updates) {
  try {
    const payload = { id: itemId };
    if (updates.label !== void 0) payload.label = updates.label;
    if (updates.tooltip !== void 0) payload.tooltip = updates.tooltip;
    if (updates.icon !== void 0) payload.icon_name = updates.icon;
    if (updates.groupId !== void 0) payload.group_id = updates.groupId;
    if (updates.actionType !== void 0) payload.action_type = updates.actionType;
    if (updates.actionPanelId !== void 0) payload.action_panel_id = updates.actionPanelId;
    if (updates.order !== void 0) payload.order_index = updates.order;
    if (updates.badgeType !== void 0) payload.badge_type = updates.badgeType;
    if (updates.showOnDesktop !== void 0) payload.show_on_desktop = updates.showOnDesktop ? 1 : 0;
    if (updates.showOnTablet !== void 0) payload.show_on_tablet = updates.showOnTablet ? 1 : 0;
    if (updates.showOnMobile !== void 0) payload.show_on_mobile = updates.showOnMobile ? 1 : 0;
    if (updates.isActive !== void 0) payload.is_active = updates.isActive ? 1 : 0;
    if (updates.uarpsTrigger !== void 0) payload.uarps_trigger_id = updates.uarpsTrigger;
    const response = await fetch(`${_apiBase}/items`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (result.success) clearCache();
    return result;
  } catch (err) {
    log("error", "Failed to update item", { error: err.message });
    return { success: false, error: err.message };
  }
}
async function deleteItem(itemId) {
  try {
    const response = await fetch(`${_apiBase}/items?id=${itemId}`, { method: "DELETE", credentials: "include", headers: { "Content-Type": "application/json" } });
    const result = await response.json();
    if (result.success) clearCache();
    return result;
  } catch (err) {
    log("error", "Failed to delete item", { error: err.message });
    return { success: false, error: err.message };
  }
}
async function reorderItems(itemIds) {
  var items = itemIds.map(function(id, index) {
    return { id, order_index: index + 1 };
  });
  var response = await fetch(_apiBase + "/items?action=reorder", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items })
  });
  var result = await response.json();
  if (result.success) clearCache();
  return result;
}
const NavRailAdapter = { getItems: fetchItems, getGroups: fetchGroups, createItem, updateItem, deleteItem, reorderItems, clearCache, injectPorts, getPorts };
export {
  MODULE_ID,
  NavRailAdapter,
  VERSION,
  clearCache,
  createItem,
  deleteItem,
  fetchGroups,
  fetchItems,
  getPorts,
  injectPorts,
  reorderItems,
  updateItem
};
