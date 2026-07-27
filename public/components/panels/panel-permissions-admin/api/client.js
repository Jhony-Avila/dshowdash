import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-permissions-admin.api.client";
const BASE_URL = "/api/permissions/uarps.php";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
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
function _getBaseUrl() {
  _initPorts();
  const config = _getPort("config");
  if (config && config.app && config.app.baseUrl) return config.app.baseUrl;
  if (config && config.baseUrl) return config.baseUrl;
  const routeState = _getPort("routeState");
  if (routeState && routeState.getBaseUrl) return routeState.getBaseUrl();
  return "";
}
async function _request(action, params = {}, { signal } = {}) {
  try {
    const base = _getBaseUrl();
    const url = new URL(BASE_URL, base || void 0);
    url.searchParams.set("action", action);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== void 0 && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Accept": "application/json" },
      credentials: "same-origin",
      signal
    });
    const data = await response.json();
    return { success: data.ok === true, data, error: data.error || null };
  } catch (error) {
    return { success: false, error: error.message, data: null };
  }
}
async function _post(action, data = {}, { signal } = {}) {
  try {
    const base = _getBaseUrl();
    const url = new URL(BASE_URL, base || void 0);
    url.searchParams.set("action", action);
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      credentials: "same-origin",
      signal,
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return { success: result.ok === true, data: result, error: result.error || null };
  } catch (error) {
    return { success: false, error: error.message, data: null };
  }
}
async function getUsers() {
  const res = await _request("all-users");
  if (res.success && res.data?.users) {
    return {
      success: true,
      data: res.data.users.map((u) => ({
        id: u.id,
        nome: u.nome_completo || u.username,
        name: u.nome_completo || u.username,
        email: u.email,
        nivel: u.level,
        level: u.level,
        ativo: true
      }))
    };
  }
  return res;
}
async function getInventory() {
  try {
    const inventory = window.Permissions?.getInventory?.() || window.PermissionsInventory?.getAll?.();
    if (inventory) {
      const triggers = [];
      const regions = [];
      if (inventory.triggers) {
        Object.entries(inventory.triggers).forEach(([id, data]) => {
          triggers.push({ id, label: data.label || _formatLabel(id), area: _extractArea(id), ...data });
        });
      }
      if (inventory.regions) {
        Object.entries(inventory.regions).forEach(([id, data]) => {
          regions.push({ id, label: data.label || _formatLabel(id), ...data });
        });
      }
      return { success: true, data: { triggers, regions } };
    }
    return _scanDOMForInventory();
  } catch (error) {
    return { success: false, error: error.message, data: { triggers: [], regions: [] } };
  }
}
function _scanDOMForInventory() {
  const triggers = [];
  const regions = [];
  document.querySelectorAll("[data-uarps-trigger]").forEach((el) => {
    const id = el.getAttribute("data-uarps-trigger");
    if (id && !triggers.find((t) => t.id === id)) {
      triggers.push({ id, label: el.textContent?.trim() || _formatLabel(id), area: _extractArea(id) });
    }
  });
  document.querySelectorAll("[data-uarps-region]").forEach((el) => {
    const id = el.getAttribute("data-uarps-region");
    if (id && !regions.find((r) => r.id === id)) {
      regions.push({ id, label: el.getAttribute("data-region-label") || _formatLabel(id) });
    }
  });
  return { success: true, data: { triggers, regions } };
}
function _extractArea(triggerId) {
  const parts = triggerId.split(":");
  return parts.length >= 2 ? parts[1] : "other";
}
function _formatLabel(id) {
  const parts = id.split(":");
  const last = parts[parts.length - 1] || id;
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ");
}
async function getUserPermissions(userId) {
  const res = await _request("user-permissions", { user_id: userId });
  if (res.success && res.data) {
    return {
      success: true,
      data: {
        triggers: (res.data.triggers || []).filter((t) => t.state === "allow").map((t) => t.trigger_id),
        regions: (res.data.regions || []).filter((r) => r.state === "allow").map((r) => r.region_id)
      }
    };
  }
  return res;
}
async function setTriggerPermission(userId, triggerId, granted) {
  return _post("set-trigger", { user_id: userId, trigger_id: triggerId, state: granted ? "allow" : "deny" });
}
async function setRegionPermission(userId, regionId, granted) {
  return _post("set-region", { user_id: userId, region_id: regionId, state: granted ? "allow" : "deny" });
}
async function bulkSetTriggers(userId, triggerIds, granted) {
  const permissions = {};
  triggerIds.forEach((id) => {
    permissions[id] = granted ? "allow" : "deny";
  });
  return _post("bulk-set-triggers", { user_id: userId, permissions });
}
async function bulkSetRegions(userId, regionIds, granted) {
  const permissions = {};
  regionIds.forEach((id) => {
    permissions[id] = granted ? "allow" : "deny";
  });
  return _post("bulk-set-regions", { user_id: userId, permissions });
}
async function syncInventory() {
  return getInventory();
}
async function copyPermissions(fromUserId, toUserId) {
  const fromPerms = await _request("user-permissions", { user_id: fromUserId });
  if (!fromPerms.success) return fromPerms;
  const triggerPerms = {};
  const regionPerms = {};
  (fromPerms.data.triggers || []).forEach((t) => {
    triggerPerms[String(t.trigger_id)] = t.state;
  });
  (fromPerms.data.regions || []).forEach((r) => {
    regionPerms[String(r.region_id)] = r.state;
  });
  await _post("bulk-set-triggers", { user_id: toUserId, permissions: triggerPerms });
  await _post("bulk-set-regions", { user_id: toUserId, permissions: regionPerms });
  return { success: true, data: { copied: true } };
}
async function getStats() {
  const users = await getUsers();
  const inventory = await getInventory();
  return { success: true, data: { users: users.data?.length || 0, triggers: inventory.data?.triggers?.length || 0, regions: inventory.data?.regions?.length || 0 } };
}
async function healthCheck() {
  return { success: true, status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
const Api = {
  getUsers,
  getInventory,
  getUserPermissions,
  setTriggerPermission,
  setRegionPermission,
  bulkSetTriggers,
  bulkSetRegions,
  syncInventory,
  copyPermissions,
  getStats,
  healthCheck,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};
var client_default = Api;
export {
  Api,
  MODULE_ID,
  VERSION,
  bulkSetRegions,
  bulkSetTriggers,
  copyPermissions,
  client_default as default,
  getInventory,
  getPorts,
  getStats,
  getUserPermissions,
  getUsers,
  healthCheck,
  injectPorts,
  setRegionPermission,
  setTriggerPermission,
  syncInventory
};
