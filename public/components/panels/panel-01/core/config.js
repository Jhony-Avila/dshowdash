const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/core/config";
const CONFIG = {
  api: {
    baseUrl: "/api/requisicoes",
    timeout: 3e4,
    retries: 3,
    retryDelay: 1e3
  },
  refresh: {
    interval: 3e4,
    enabled: true
  },
  pagination: {
    defaultLimit: 25,
    limits: [10, 25, 50, 100]
  },
  table: {
    defaultSort: { field: "Data_Requisicao", order: "DESC" },
    defaultDensity: "normal",
    virtualScroll: { enabled: true, rowHeight: 44, bufferSize: 5 },
    stickyColumns: { left: ["select", "id"], right: ["actions"] },
    editableFields: ["descricao", "observacao"]
  },
  features: {
    autoRefresh: true,
    keyboardNav: true,
    contextMenu: true,
    bulkActions: true,
    urlState: true,
    localStorage: true,
    virtualScroll: true,
    lazyLoading: true,
    webWorkers: true,
    memoization: true,
    debounce: true,
    prefetch: true,
    indexedDB: true,
    serviceWorker: false,
    dragDrop: true,
    columnResize: true,
    stickyColumns: false,
    inlineEdit: true,
    multiSort: true,
    savedViews: true,
    animations: true,
    hapticFeedback: true,
    fuzzySearch: true,
    bulkEdit: true,
    importExport: true,
    exportPDF: true,
    tags: true,
    preview: true,
    duplicate: true,
    websocket: false,
    badgeNew: true,
    errorBoundary: true
  },
  performance: {
    memoization: { maxSize: 500, ttl: 6e4 },
    debounce: { search: 400, filter: 300, resize: 150 },
    prefetch: { maxCached: 5, ttl: 6e4 },
    indexedDB: { ttl: 3e5 }
  },
  websocket: {
    url: null,
    reconnectDelay: 3e3,
    maxReconnects: 5
  }
};
function getConfig(path) {
  return path.split(".").reduce((obj, key) => obj && obj[key], CONFIG);
}
function setConfig(path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((obj, key) => {
    obj[key] = obj[key] || {};
    return obj[key];
  }, CONFIG);
  target[last] = value;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var config_default = CONFIG;
export {
  CONFIG,
  MODULE_ID,
  VERSION,
  config_default as default,
  getConfig,
  healthCheck,
  info,
  setConfig
};
