const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "pom-api-adapter";
const BASE_URL = "/api/admin/orchestrator";
function request(endpoint, options) {
  options = options || {};
  const url = endpoint.indexOf("http") === 0 ? endpoint : BASE_URL + endpoint;
  const config = { headers: Object.assign({ "Content-Type": "application/json" }, options.headers || {}) };
  Object.keys(options).forEach((k) => {
    if (k !== "headers" && k !== "body") config[k] = options[k];
  });
  if (options.body && typeof options.body === "object") config.body = JSON.stringify(options.body);
  return fetch(url, config).then((response) => response.json().then((data) => {
    if (!response.ok || data.success === false) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }));
}
const api = {
  getTriggers: (component) => {
    let url = "/?action=list&type=triggers";
    if (component && component !== "all") url += `&component=${component}`;
    return request(url).then((res) => res.data || []);
  },
  createTrigger: (data) => request("/?action=create&type=trigger", { method: "POST", body: data }),
  updateTrigger: (id, data) => request(`/?action=update&type=trigger&id=${id}`, { method: "PUT", body: data }),
  deleteTrigger: (id) => request(`/?action=delete&type=trigger&id=${id}`, { method: "DELETE" }),
  toggleTrigger: (id, currentState) => request(`/?action=toggle&type=trigger&id=${id}`, { method: "PUT", body: { is_active: currentState ? 0 : 1 } }),
  getRules: () => request("/rules.php").then((res) => res.data || []),
  createRule: (data) => request("/rules.php", { method: "POST", body: data }),
  updateRule: (id, data) => request(`/rules.php?id=${id}`, { method: "PUT", body: data }),
  deleteRule: (id) => request(`/rules.php?id=${id}`, { method: "DELETE" }),
  toggleRule: (id, currentState) => request(`/rules.php?id=${id}`, { method: "PUT", body: { is_active: currentState ? 0 : 1 } }),
  seedRules: () => request("/rules.php?action=seed"),
  getFlags: () => request("/flags.php").then((res) => res.data || []),
  createFlag: (data) => request("/flags.php", { method: "POST", body: data }),
  updateFlag: (id, data) => request(`/flags.php?id=${id}`, { method: "PUT", body: data }),
  deleteFlag: (id) => request(`/flags.php?id=${id}`, { method: "DELETE" }),
  toggleFlag: (id, currentState) => request(`/flags.php?id=${id}`, { method: "PUT", body: { is_enabled: currentState ? 0 : 1 } }),
  seedFlags: () => request("/flags.php?action=seed"),
  getStats: () => request("/?action=stats").then((res) => res.data || {}),
  syncAll: (options) => {
    options = options || {};
    return request("/sync-all.php", { method: "POST", body: { dry_run: options.dryRun !== void 0 ? options.dryRun : false, sources: options.sources || ["sidebar", "bindings", "keyboard"] } });
  },
  syncPreview() {
    return this.syncAll({ dryRun: true });
  },
  getAuditLog: (limit = 50) => request(`/?action=audit&limit=${limit}`).then((res) => res.data || [])
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { apiReady: typeof api.getTriggers === "function" } };
}
var adapter_default = api;
export {
  MODULE_ID,
  VERSION,
  api,
  adapter_default as default,
  healthCheck,
  info
};
