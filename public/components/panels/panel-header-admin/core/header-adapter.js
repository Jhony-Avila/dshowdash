const MODULE_ID = "panel-header-admin-adapter";
const VERSION = "9.3.0-P2-ENTERPRISE";
const API_BASE = "/api/ui/header/";
function fetchAPI(action, options = {}) {
  const url = `${API_BASE}?action=${action}`;
  const fetchOpts = { credentials: "include", headers: { "Content-Type": "application/json" } };
  for (const k in options) {
    if (options.hasOwnProperty(k)) fetchOpts[k] = options[k];
  }
  return fetch(url, fetchOpts).then((response) => {
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  });
}
function getGroups() {
  return fetchAPI("groups").then((result) => result.success ? result.data.groups : []);
}
function getComponents(includeInactive) {
  const url = includeInactive ? "components&include_inactive=1" : "components";
  return fetchAPI(url).then((result) => result.success ? result.data.components : []);
}
function getConfig() {
  return fetchAPI("config").then((result) => result.success ? result.data : {});
}
function getLayouts() {
  return fetchAPI("layouts").then((result) => result.success ? result.data.layouts : []);
}
function createComponent(data) {
  return fetchAPI("component", { method: "POST", body: JSON.stringify(data) });
}
function updateComponent(id, data) {
  return fetch(`${API_BASE}?action=component&id=${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then((r) => r.json());
}
function deleteComponent(id) {
  return fetch(`${API_BASE}?action=component&id=${id}`, {
    method: "DELETE",
    credentials: "include"
  }).then((r) => r.json());
}
function toggleComponent(id) {
  return fetch(`${API_BASE}?action=toggle&id=${id}`, {
    method: "POST",
    credentials: "include"
  }).then((r) => r.json());
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, apiBase: API_BASE };
}
var header_adapter_default = { MODULE_ID, VERSION, getGroups, getComponents, getConfig, getLayouts, createComponent, updateComponent, deleteComponent, toggleComponent, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  createComponent,
  header_adapter_default as default,
  deleteComponent,
  getComponents,
  getConfig,
  getGroups,
  getLayouts,
  healthCheck,
  info,
  toggleComponent,
  updateComponent
};
