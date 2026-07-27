import { createUiPorts } from "/core/runtime/ports-profiles.js";
var MODULE_ID = "panel-nav-admin:nav-adapter";
var VERSION = "11.3.0-CSRF-AUTORENEW";
var Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
var _apiBase = "/api/admin/navigation";
var _cachedItems = null;
var _cachedSections = null;
var _cacheTimestamp = 0;
var _cacheTTL = 3e4;
var _cachedRoutes = null;
var _routesCacheTimestamp = 0;
var _routesCacheTTL = 6e4;
function _getLogger() {
  var lg = _getPort("logger");
  if (lg) return lg;
  if (typeof window !== "undefined" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var wab = window.Core.windowAdapter.get("Logger");
    if (wab) return wab;
  }
  return null;
}
function log(level, msg, data) {
  var logger = _getLogger();
  if (logger && logger[level]) logger[level]("[" + MODULE_ID + "]", msg, data);
}
function _normalizeResponse(result) {
  if (result && typeof result.ok === "boolean" && typeof result.success === "undefined") {
    result.success = result.ok;
  }
  return result;
}
function _getCSRFToken() {
  var csrf = _getPort("securityCSRF");
  if (csrf && csrf.getToken) {
    var token = csrf.getToken();
    if (token) return token;
  }
  if (typeof window !== "undefined" && window.SecurityCSRF && window.SecurityCSRF.getToken) {
    var globalToken = window.SecurityCSRF.getToken();
    if (globalToken) return globalToken;
  }
  if (typeof document !== "undefined") {
    var meta = document.querySelector('meta[name="csrf-token"]');
    if (meta && meta.content) return meta.content;
  }
  if (typeof document !== "undefined" && document.cookie) {
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
      var c = cookies[i].trim();
      if (c.indexOf("csrf_token=") === 0) {
        return c.substring(11);
      }
    }
  }
  return "";
}
function _readHeaders() {
  return { "Content-Type": "application/json" };
}
function _writeHeaders() {
  return {
    "Content-Type": "application/json",
    "X-CSRF-Token": _getCSRFToken()
  };
}
var _csrfRefreshing = null;
async function _refreshCSRFToken() {
  if (_csrfRefreshing) return _csrfRefreshing;
  _csrfRefreshing = (async () => {
    try {
      var resp = await fetch("/api/auth/check", { method: "GET", credentials: "include" });
      var json = await resp.json();
      var newToken = json?.data?.session?.csrf_token || "";
      if (newToken) {
        if (typeof document !== "undefined") {
          var meta = document.querySelector('meta[name="csrf-token"]');
          if (meta) meta.content = newToken;
        }
        if (typeof window !== "undefined" && window.SecurityCSRF && window.SecurityCSRF.setToken) {
          window.SecurityCSRF.setToken(newToken);
        }
        log("info", "CSRF token refreshed successfully");
      }
      return newToken;
    } catch (err) {
      log("error", "Failed to refresh CSRF token", { error: err.message });
      return "";
    } finally {
      _csrfRefreshing = null;
    }
  })();
  return _csrfRefreshing;
}
async function _fetchWithCSRFRetry(url, options) {
  var response = await fetch(url, options);
  if (response.status === 403) {
    var body = null;
    try {
      body = await response.clone().json();
    } catch (_e) {
    }
    var errorCode = body?.error || body?.code || "";
    if (errorCode === "ERR_INVALID_CSRF" || errorCode.indexOf("CSRF") >= 0 || response.status === 403) {
      log("warn", "CSRF token rejected (403), refreshing and retrying...");
      var newToken = await _refreshCSRFToken();
      if (newToken) {
        var newHeaders = Object.assign({}, options.headers, { "X-CSRF-Token": newToken });
        var retryOptions = Object.assign({}, options, { headers: newHeaders });
        var retryResponse = await fetch(url, retryOptions);
        return retryResponse;
      }
    }
  }
  return response;
}
function isCacheValid() {
  return _cachedItems && Date.now() - _cacheTimestamp < _cacheTTL;
}
function clearCache() {
  _cachedItems = null;
  _cachedSections = null;
  _cacheTimestamp = 0;
  log("debug", "Cache cleared");
}
function _mapApiItem(item, index) {
  return {
    id: item.item_key,
    sourceId: item.source_id,
    sourceTable: item.source_table,
    label: item.label,
    displayTitle: item.display_title || null,
    href: item.route_path || null,
    icon: item.icon_name,
    description: item.description || null,
    section: item.display_context,
    parentKey: item.parent_key || null,
    parentLabel: item.parent_label || null,
    itemType: item.item_type || "navigation",
    panelId: item.panel_id || null,
    order: item.order_index != null ? Number(item.order_index) : index,
    isActive: item.is_active == 1 || item.is_active === true,
    isVisible: item.is_visible == 1 || item.is_visible === true,
    minLevel: Number(item.min_level) || 0,
    uarpsTrigger: item.uarps_trigger_id || null,
    isDivider: item.item_type === "separator",
    dbId: item.source_id,
    subtitle: null,
    sectionLabel: item.parent_label || null,
    sectionId: null,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  };
}
async function fetchItems(forceRefresh, opts = {}) {
  if (!opts) opts = {};
  if (!forceRefresh && isCacheValid()) {
    return { success: true, data: _cachedItems };
  }
  try {
    var response = await fetch(_apiBase + "/items", { method: "GET", credentials: "include", headers: _readHeaders(), signal: opts.signal });
    var result = _normalizeResponse(await response.json());
    if (result.success && result.data) {
      _cachedItems = result.data.map(function(item, index) {
        return _mapApiItem(item, index);
      });
      _cacheTimestamp = Date.now();
      log("info", "Items fetched and mapped (unified)", { count: _cachedItems.length });
    }
    return result;
  } catch (err) {
    log("error", "Failed to fetch items", { error: err.message });
    return { success: false, error: err.message };
  }
}
async function fetchAvailableRoutes(forceRefresh, opts = {}) {
  if (!opts) opts = {};
  if (!forceRefresh && _cachedRoutes && Date.now() - _routesCacheTimestamp < _routesCacheTTL) {
    return { success: true, data: _cachedRoutes };
  }
  try {
    var response = await fetch(_apiBase + "/?action=available-routes", { method: "GET", credentials: "include", headers: _readHeaders(), signal: opts.signal });
    var result = _normalizeResponse(await response.json());
    if (result.success && result.data) {
      _cachedRoutes = result.data;
      _routesCacheTimestamp = Date.now();
      log("info", "Available routes fetched", { count: _cachedRoutes.length });
    }
    return result;
  } catch (err) {
    log("error", "Failed to fetch available routes", { error: err.message });
    return { success: false, error: err.message };
  }
}
async function createItem(item, opts = {}) {
  if (!opts) opts = {};
  try {
    var payload = {
      display_context: item.section || "sidebar",
      item_key: item.id,
      label: item.label,
      route_path: item.href || null,
      icon_name: item.icon || "circle",
      item_type: item.itemType || "navigation",
      panel_id: item.panelId || null,
      parent_key: item.parentKey || null,
      order_index: item.order || 99,
      is_active: item.isActive !== false ? 1 : 0,
      is_visible: item.isVisible !== false ? 1 : 0,
      min_level: item.minLevel || 0,
      uarps_trigger_id: item.uarpsTrigger || null,
      description: item.description || null
    };
    var response = await _fetchWithCSRFRetry(_apiBase + "/items", { method: "POST", credentials: "include", headers: _writeHeaders(), body: JSON.stringify(payload), signal: opts.signal });
    var result = _normalizeResponse(await response.json());
    if (result.success) clearCache();
    return result;
  } catch (err) {
    log("error", "Failed to create item", { error: err.message });
    return { success: false, error: err.message };
  }
}
async function updateItem(itemId, updates, opts = {}) {
  if (!opts) opts = {};
  try {
    const payload = {
      source_table: updates.sourceTable,
      source_id: updates.sourceId
    };
    if (updates.label !== void 0) payload.label = updates.label;
    if (updates.displayTitle !== void 0) payload.display_title = updates.displayTitle;
    if (updates.href !== void 0) payload.route_path = updates.href;
    if (updates.icon !== void 0) payload.icon_name = updates.icon;
    if (updates.parentKey !== void 0) payload.parent_key = updates.parentKey;
    if (updates.order !== void 0) payload.order_index = updates.order;
    if (updates.panelId !== void 0) payload.panel_id = updates.panelId;
    if (updates.isActive !== void 0) payload.is_active = updates.isActive ? 1 : 0;
    if (updates.isVisible !== void 0) payload.is_visible = updates.isVisible ? 1 : 0;
    if (updates.minLevel !== void 0) payload.min_level = updates.minLevel;
    if (updates.uarpsTrigger !== void 0) payload.uarps_trigger_id = updates.uarpsTrigger;
    if (updates.description !== void 0) payload.description = updates.description;
    var response = await _fetchWithCSRFRetry(_apiBase + "/items", { method: "PATCH", credentials: "include", headers: _writeHeaders(), body: JSON.stringify(payload), signal: opts.signal });
    var result = _normalizeResponse(await response.json());
    if (result.success) {
      clearCache();
    } else {
      log("error", "updateItem PATCH failed", { status: response.status, statusText: response.statusText, body: result });
    }
    return result;
  } catch (err) {
    log("error", "Failed to update item", { error: err.message });
    return { success: false, error: err.message };
  }
}
async function deleteItem(itemId, sourceTable, sourceId, opts = {}) {
  if (!opts) opts = {};
  try {
    var payload = { source_table: sourceTable, source_id: sourceId };
    var response = await _fetchWithCSRFRetry(_apiBase + "/items", { method: "DELETE", credentials: "include", headers: _writeHeaders(), body: JSON.stringify(payload), signal: opts.signal });
    var result = _normalizeResponse(await response.json());
    if (result.success) clearCache();
    return result;
  } catch (err) {
    log("error", "Failed to delete item", { error: err.message });
    return { success: false, error: err.message };
  }
}
async function restoreItem(sourceTable, sourceId, opts = {}) {
  if (!opts) opts = {};
  try {
    var payload = { source_table: sourceTable, source_id: sourceId, is_active: 1 };
    if (sourceTable === "navrail_items" || sourceTable === "header_components") {
      payload.is_deleted = 0;
    }
    if (sourceTable === "ui_nav_items" || sourceTable === "footer_items") {
      payload.is_visible = 1;
    }
    var response = await _fetchWithCSRFRetry(_apiBase + "/items", { method: "PATCH", credentials: "include", headers: _writeHeaders(), body: JSON.stringify(payload), signal: opts.signal });
    var result = _normalizeResponse(await response.json());
    if (result.success) clearCache();
    return result;
  } catch (err) {
    log("error", "Failed to restore item", { error: err.message });
    return { success: false, error: err.message };
  }
}
async function reorderItems(items, opts = {}) {
  if (!opts) opts = {};
  try {
    var mapped = items.map(function(i) {
      return { source_table: i.sourceTable, source_id: i.sourceId, order_index: i.order };
    });
    var response = await _fetchWithCSRFRetry(_apiBase + "/reorder", { method: "POST", credentials: "include", headers: _writeHeaders(), body: JSON.stringify({ items: mapped }), signal: opts.signal });
    var result = _normalizeResponse(await response.json());
    if (result.success) clearCache();
    return result;
  } catch (err) {
    log("error", "Failed to reorder items", { error: err.message });
    return { success: false, error: err.message };
  }
}
async function fetchSections(opts = {}) {
  if (!opts) opts = {};
  var ctx = opts.context || "sidebar";
  var url = _apiBase + "/sections" + (ctx ? "?context=" + encodeURIComponent(ctx) : "");
  try {
    var response = await fetch(url, { method: "GET", credentials: "include", headers: _readHeaders(), signal: opts.signal });
    var result = _normalizeResponse(await response.json());
    if (result.success && result.data) {
      _cachedSections = result.data;
    }
    return result.success ? result.data || {} : {};
  } catch (err) {
    log("error", "Failed to fetch sections", { error: err.message });
    return {};
  }
}
async function fetchAuditHistory(limit = 50, opts = {}) {
  if (!opts) opts = {};
  try {
    var response = await fetch(_apiBase + "/audit?limit=" + limit, { method: "GET", credentials: "include", headers: _readHeaders(), signal: opts.signal });
    var result = _normalizeResponse(await response.json());
    return result;
  } catch (err) {
    log("error", "Failed to fetch audit history", { error: err.message });
    return { success: false, error: err.message };
  }
}
async function fetchIcons() {
  return [];
}
async function getItems(forceRefresh = false) {
  await fetchItems(forceRefresh);
  return _cachedItems || [];
}
async function getSections() {
  return fetchSections();
}
async function getIcons() {
  return [];
}
export {
  MODULE_ID,
  VERSION,
  clearCache,
  createItem,
  deleteItem,
  fetchAuditHistory,
  fetchAvailableRoutes,
  fetchIcons,
  fetchItems,
  fetchSections,
  getIcons,
  getItems,
  getPorts,
  getSections,
  injectPorts,
  reorderItems,
  restoreItem,
  updateItem
};
