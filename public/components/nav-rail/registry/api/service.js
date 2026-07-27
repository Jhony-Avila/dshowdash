const MODULE_ID = "navrail-registry-api";
const VERSION = "4.2.0-ES6";
const API_BASE = "/api/ui/navrail/";
function fetchManifest() {
  return fetch(`${API_BASE}?action=manifest`, {
    credentials: "include",
    headers: { "Accept": "application/json" }
  });
}
function createItem(data) {
  return fetch(`${API_BASE}?action=item`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then((response) => response.json());
}
function updateItem(id, data) {
  return fetch(`${API_BASE}?action=item&id=${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then((response) => response.json());
}
function deleteItem(id) {
  return fetch(`${API_BASE}?action=item&id=${id}`, {
    method: "DELETE",
    credentials: "include"
  }).then((response) => response.json());
}
function toggleItem(id) {
  return fetch(`${API_BASE}?action=toggle&id=${id}`, {
    method: "POST",
    credentials: "include"
  }).then((response) => response.json());
}
function reorderItems(itemIds) {
  return fetch(`${API_BASE}?action=reorder`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: itemIds })
  }).then((response) => response.json());
}
var service_default = {
  fetchManifest,
  createItem,
  updateItem,
  deleteItem,
  toggleItem,
  reorderItems
};
export {
  MODULE_ID,
  VERSION,
  createItem,
  service_default as default,
  deleteItem,
  fetchManifest,
  reorderItems,
  toggleItem,
  updateItem
};
