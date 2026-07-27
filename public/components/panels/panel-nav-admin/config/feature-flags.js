const VERSION = "10.1.0-MIGRATION-PHASE1";
const MODULE_ID = "panel-nav-admin.config.feature-flags";
const DEFAULT_FLAGS = Object.freeze({
  // ─── Arquitetura (A) ───
  errorBoundary: true,
  stateMachine: true,
  featureRegistry: true,
  lazyLoading: true,
  // ─── UI Components (B) ───
  virtualScroll: false,
  skeletonLoading: true,
  toastNotifications: true,
  contextMenu: false,
  drawer: false,
  toolbar: false,
  badges: false,
  highlighting: false,
  cardView: false,
  splitView: false,
  dateRangeFilter: false,
  multiSelectFilter: false,
  quickFilters: false,
  filterPresets: false,
  pagination: false,
  hoverMenu: false,
  // ─── Data Handling (C) ───
  circuitBreaker: false,
  smartCache: false,
  deltaUpdates: false,
  debouncedRequest: true,
  fuzzySearch: false,
  bulkOperations: false,
  searchHistory: false,
  duplicateItem: true,
  memoization: false,
  exportCSV: false,
  exportPDF: false,
  exportXLSX: false,
  importCSV: false,
  importXLSX: false,
  // ─── Events (D) ───
  customEventEmitter: true,
  eventMetrics: false,
  eventBindings: false,
  // ─── State & Navigation (E) ───
  urlStateSync: false,
  savedViews: false,
  statePersistence: false,
  // ─── Security (F) ───
  htmlEscape: true,
  // ─── Services (G) ───
  websocket: false,
  pushNotifications: false,
  soundNotifications: false,
  // ─── Performance (H) ───
  performanceMonitor: false,
  prefetch: false,
  webWorker: false,
  indexedDBCache: false,
  // ─── Telemetry (I) ───
  percentileMetrics: false,
  // ─── Collaboration (J) ───
  activityLog: false,
  mentions: false,
  // ─── Existing features (always on) ───
  diagnosticMode: true,
  unifiedSSOT: true,
  uarpsTriggers: true,
  permissionLevels: true,
  iconPicker: true,
  sectionsCRUD: true,
  dragDrop: true,
  inlineEdit: true,
  keyboardShortcuts: true,
  autoRefresh: true
});
const FLAGS = { ...DEFAULT_FLAGS };
function getFlag(path) {
  if (!path) return void 0;
  if (path.indexOf(".") === -1) return FLAGS[path];
  return path.split(".").reduce((obj, key) => obj != null ? obj[key] : void 0, FLAGS);
}
function setFlag(path, value) {
  if (!path) return;
  if (path.indexOf(".") === -1) {
    FLAGS[path] = value;
    return;
  }
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((obj, key) => {
    if (obj[key] == null) obj[key] = {};
    return obj[key];
  }, FLAGS);
  target[last] = value;
}
function isEnabled(flagName) {
  return !!FLAGS[flagName];
}
function getAllFlags() {
  return { ...FLAGS };
}
function resetFlags() {
  for (const key of Object.keys(FLAGS)) {
    delete FLAGS[key];
  }
  Object.assign(FLAGS, DEFAULT_FLAGS);
}
function getFlagStats() {
  const keys = Object.keys(FLAGS);
  const enabled = keys.filter((k) => !!FLAGS[k]).length;
  return { enabled, total: keys.length };
}
function info() {
  const stats = getFlagStats();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    flagsEnabled: stats.enabled,
    flagsTotal: stats.total
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    checks: { flagsLoaded: Object.keys(FLAGS).length > 0 }
  };
}
var feature_flags_default = { FLAGS, getFlag, setFlag, isEnabled, getAllFlags, resetFlags, getFlagStats, info, healthCheck, VERSION, MODULE_ID };
export {
  FLAGS,
  MODULE_ID,
  VERSION,
  feature_flags_default as default,
  getAllFlags,
  getFlag,
  getFlagStats,
  healthCheck,
  info,
  isEnabled,
  resetFlags,
  setFlag
};
