import { createStatePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels-panel-12-state-persist";
const Ports = createStatePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const STORAGE_KEY = "panel12_preferences";
const DEFAULTS = { density: "comfortable", visibleColumns: ["id", "job_name", "type", "status", "success_rate", "last_execution"], sortColumn: "id", sortDirection: "asc" };
let preferences = { ...DEFAULTS };
const load = () => {
  _initPorts();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      preferences = { ...DEFAULTS, ...parsed };
    }
  } catch (e) {
    preferences = { ...DEFAULTS };
  }
  return preferences;
};
const save = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch (e) {
    return false;
  }
};
const getDensity = () => preferences.density;
const setDensity = (density) => {
  if (["compact", "comfortable", "spacious"].includes(density)) {
    preferences.density = density;
    save();
  }
};
const getVisibleColumns = () => [...preferences.visibleColumns];
const setVisibleColumns = (columns) => {
  if (Array.isArray(columns)) {
    preferences.visibleColumns = columns;
    save();
  }
};
const getSortColumn = () => preferences.sortColumn;
const getSortDirection = () => preferences.sortDirection;
const setSort = (column, direction) => {
  preferences.sortColumn = column;
  preferences.sortDirection = direction;
  save();
};
const reset = () => {
  preferences = { ...DEFAULTS };
  save();
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
const healthCheck = () => ({ status: Ports.snapshot()._initialized ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { persistReady: true, portsInitialized: Ports.snapshot()._initialized } });
export {
  MODULE_ID,
  VERSION,
  getDensity,
  getPorts,
  getSortColumn,
  getSortDirection,
  getVisibleColumns,
  healthCheck,
  info,
  injectPorts,
  load,
  reset,
  save,
  setDensity,
  setSort,
  setVisibleColumns
};
