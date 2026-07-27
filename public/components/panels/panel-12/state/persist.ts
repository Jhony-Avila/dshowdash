// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-12-state-persist
// PURPOSE: Panel 12 - Persist State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createStatePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   load() — exported function
//   save() — exported function
//   getDensity() — exported function
//   setDensity() — exported function
//   getVisibleColumns() — exported function
//   setVisibleColumns() — exported function
//   getSortColumn() — exported function
//   getSortDirection() — exported function
//   setSort() — exported function
//   reset() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   VERSION — module constant
//   ... and 1 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createStatePorts } from '/core/runtime/ports-profiles.js';
const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panels-panel-12-state-persist';
const Ports = createStatePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const STORAGE_KEY = 'panel12_preferences';
const DEFAULTS = { density: 'comfortable', visibleColumns: ['id', 'job_name', 'type', 'status', 'success_rate', 'last_execution'], sortColumn: 'id', sortDirection: 'asc' };
let preferences = { ...DEFAULTS };
const load = () => { _initPorts(); try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) { const parsed = JSON.parse(stored); preferences = { ...DEFAULTS, ...parsed }; } } catch (e) { preferences = { ...DEFAULTS }; } return preferences; };
const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); return true; } catch (e) { return false; } };
const getDensity = () => preferences.density;
const setDensity = (density: string) => { if (['compact', 'comfortable', 'spacious'].includes(density)) { preferences.density = density; save(); } };
const getVisibleColumns = () => [...preferences.visibleColumns];
const setVisibleColumns = (columns: string[]) => { if (Array.isArray(columns)) { preferences.visibleColumns = columns; save(); } };
const getSortColumn = () => preferences.sortColumn;
const getSortDirection = () => preferences.sortDirection;
const setSort = (column: string, direction: string) => { preferences.sortColumn = column; preferences.sortDirection = direction; save(); };
const reset = () => { preferences = { ...DEFAULTS }; save(); };
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
const healthCheck = () => ({ status: Ports.snapshot()._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { persistReady: true, portsInitialized: Ports.snapshot()._initialized } });
export { load, save, getDensity, setDensity, getVisibleColumns, setVisibleColumns, getSortColumn, getSortDirection, setSort, reset, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
