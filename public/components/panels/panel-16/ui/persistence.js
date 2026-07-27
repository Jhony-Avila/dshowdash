import { STORAGE_KEYS, COLUMN_TYPES } from "./constants.js";
import { COLUMNS, DEFAULT_VIEWS } from "../core/constants.js";
import { StoragePort } from "../ports/index.js";
function loadFilters() {
  return StoragePort.session.get(STORAGE_KEYS.FILTERS) || {};
}
function saveFilters(filters) {
  StoragePort.session.set(STORAGE_KEYS.FILTERS, filters);
}
function loadViewMode() {
  return StoragePort.session.get(STORAGE_KEYS.VIEW) || "normal";
}
function saveViewMode(mode) {
  StoragePort.session.set(STORAGE_KEYS.VIEW, mode);
}
function loadColumns() {
  const saved = StoragePort.local.get(STORAGE_KEYS.COLUMNS);
  if (saved) return saved;
  return COLUMNS.map((c) => ({ ...c, ...COLUMN_TYPES[c.id] || {} }));
}
function saveColumns(columns) {
  StoragePort.local.set(STORAGE_KEYS.COLUMNS, columns);
}
function loadSavedViews() {
  const saved = StoragePort.local.get(STORAGE_KEYS.VIEWS);
  return saved || [...DEFAULT_VIEWS];
}
function saveSavedViews(views) {
  StoragePort.local.set(STORAGE_KEYS.VIEWS, views);
}
function loadFavorites() {
  const saved = StoragePort.local.get(STORAGE_KEYS.FAVORITES);
  return saved ? new Set(saved) : /* @__PURE__ */ new Set();
}
function saveFavorites(favorites) {
  StoragePort.local.set(STORAGE_KEYS.FAVORITES, [...favorites]);
}
function loadSort() {
  return StoragePort.local.get(STORAGE_KEYS.SORT) || [{ column: "nome", direction: "asc" }];
}
function saveSort(sortColumns) {
  StoragePort.local.set(STORAGE_KEYS.SORT, sortColumns);
}
function loadPinnedCols(side) {
  const saved = StoragePort.local.get(`${STORAGE_KEYS.PINNED}_${side}`);
  if (saved) return new Set(saved);
  return new Set(side === "left" ? ["checkbox", "nome"] : ["action"]);
}
function savePinnedCols(pinnedLeft, pinnedRight) {
  StoragePort.local.set(`${STORAGE_KEYS.PINNED}_left`, [...pinnedLeft]);
  StoragePort.local.set(`${STORAGE_KEYS.PINNED}_right`, [...pinnedRight]);
}
var persistence_default = { loadFilters, saveFilters, loadViewMode, saveViewMode, loadColumns, saveColumns, loadSavedViews, saveSavedViews, loadFavorites, saveFavorites, loadSort, saveSort, loadPinnedCols, savePinnedCols };
const MODULE_ID = "panels-panel-16-ui-persistence";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true, storagePortAvailable: StoragePort.isAvailable() } };
}
export {
  MODULE_ID,
  VERSION,
  persistence_default as default,
  healthCheck,
  info,
  loadColumns,
  loadFavorites,
  loadFilters,
  loadPinnedCols,
  loadSavedViews,
  loadSort,
  loadViewMode,
  saveColumns,
  saveFavorites,
  saveFilters,
  savePinnedCols,
  saveSavedViews,
  saveSort,
  saveViewMode
};
