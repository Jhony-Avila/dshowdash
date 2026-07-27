const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/storage";
const PREFIX = "p01_";
function get(key, defaultValue) {
  try {
    const item = localStorage.getItem(PREFIX + key);
    return item ? JSON.parse(item) : defaultValue !== void 0 ? defaultValue : null;
  } catch (e) {
    return defaultValue !== void 0 ? defaultValue : null;
  }
}
function set(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}
function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
    return true;
  } catch (e) {
    return false;
  }
}
function clear() {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => {
      localStorage.removeItem(k);
    });
    return true;
  } catch (e) {
    return false;
  }
}
function getFilters() {
  return get("filters", {});
}
function setFilters(filters) {
  return set("filters", filters);
}
function getSort() {
  return get("sort", { field: "Data_Requisicao", order: "DESC" });
}
function setSort(sort) {
  return set("sort", sort);
}
function getDensity() {
  return get("density", "normal");
}
function setDensity(density) {
  return set("density", density);
}
function getColumns() {
  return get("columns", null);
}
function setColumns(columns) {
  return set("columns", columns);
}
function getColumnWidths() {
  return get("columnWidths", {});
}
function setColumnWidths(widths) {
  return set("columnWidths", widths);
}
function getColumnWidth(colId) {
  const widths = getColumnWidths();
  return widths[colId] || null;
}
function setColumnWidth(colId, width) {
  const widths = getColumnWidths();
  widths[colId] = width;
  return setColumnWidths(widths);
}
function getColumnOrder() {
  return get("columnOrder", null);
}
function setColumnOrder(order) {
  return set("columnOrder", order);
}
function getLastView() {
  return get("lastView", null);
}
function setLastView(viewId) {
  return set("lastView", viewId);
}
function getExpandedRows() {
  return get("expandedRows", []);
}
function setExpandedRows(rows) {
  return set("expandedRows", rows);
}
function getPageSize() {
  return get("pageSize", 25);
}
function setPageSize(size) {
  return set("pageSize", size);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var storage_default = {
  get,
  set,
  remove,
  clear,
  getFilters,
  setFilters,
  getSort,
  setSort,
  getDensity,
  setDensity,
  getColumns,
  setColumns,
  getColumnWidths,
  setColumnWidths,
  getColumnWidth,
  setColumnWidth,
  getColumnOrder,
  setColumnOrder,
  getLastView,
  setLastView,
  getExpandedRows,
  setExpandedRows,
  getPageSize,
  setPageSize
};
export {
  MODULE_ID,
  VERSION,
  clear,
  storage_default as default,
  get,
  getColumnOrder,
  getColumnWidth,
  getColumnWidths,
  getColumns,
  getDensity,
  getExpandedRows,
  getFilters,
  getLastView,
  getPageSize,
  getSort,
  healthCheck,
  info,
  remove,
  set,
  setColumnOrder,
  setColumnWidth,
  setColumnWidths,
  setColumns,
  setDensity,
  setExpandedRows,
  setFilters,
  setLastView,
  setPageSize,
  setSort
};
