// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.9.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-config-manager
// PURPOSE: Sidebar Features - Config Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   exportConfig() — exported function
//   exportConfigAsJSON() — exported function
//   downloadConfig() — exported function
//   importConfig() — exported function
//   importConfigFromJSON() — exported function
//   importConfigFromFile() — exported function
//   resetConfig() — exported function
//   getConfigSummary() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.CONFIG_INITIALIZED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.9.0-ES6';
export const MODULE_ID = 'sidebar-config-manager';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _metrics = { exports: 0, imports: 0, resets: 0, errors: 0 };

const CONFIG_KEYS = ['dsd-sidebar-collapsed', 'dsd-sidebar-width', 'dsd-sidebar-theme', 'dsd-sidebar-auto-theme', 'dsd-sidebar-favorites', 'dsd-sidebar-recent', 'dsd-sidebar-order', 'dsd-sidebar-expanded-sections'];

export function init(eventBus: DynObj) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.CONFIG_INITIALIZED);
}

export function exportConfig() {
  const config = { version: VERSION, exportedAt: new Date().toISOString(), settings: {} };
  CONFIG_KEYS.forEach(key => { try { const value = localStorage.getItem(key); if (value !== null) (config.settings as Record<string, DynObj>)[key] = value; } catch(e) { _metrics.errors++; } });
  _metrics.exports++;
  return config;
}

export function exportConfigAsJSON() { return JSON.stringify(exportConfig(), null, 2); }

export function downloadConfig(filename = 'sidebar-config.json') {
  const json = exportConfigAsJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function importConfig(config: DynObj) {
  if (!config?.settings) { _metrics.errors++; throw new Error('Invalid config format'); }
  const imported: DynObj[] = [];
  const failed: DynObj[] = [];
  Object.entries(config.settings).forEach(entry => { const key = entry[0]; const value = entry[1]; try { if (CONFIG_KEYS.includes(key)) { localStorage.setItem(key, value as string); imported.push(key); } } catch(e) { failed.push(key); _metrics.errors++; } });
  _metrics.imports++;
  return { imported, failed, total: Object.keys(config.settings).length };
}

export function importConfigFromJSON(jsonString: DynObj) { const config = JSON.parse(jsonString); return importConfig(config); }

export function importConfigFromFile(file: DynObj) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // @ts-expect-error strict migration — TS18047
    reader.onload = e => { try { const result = importConfigFromJSON(e.target.result); resolve(result); } catch(error) { _metrics.errors++; reject(error); } };
    reader.onerror = () => { _metrics.errors++; reject(new Error('Failed to read file')); };
    reader.readAsText(file);
  });
}

export function resetConfig() { CONFIG_KEYS.forEach(key => { try { localStorage.removeItem(key); } catch(e) { _metrics.errors++; } }); _metrics.resets++; }
export function getConfigSummary() { const summary = {}; CONFIG_KEYS.forEach(key => { try { const value = localStorage.getItem(key); (summary as Record<string, DynObj>)[key] = value !== null; } catch(e) { (summary as Record<string, DynObj>)[key] = false; } }); return summary; }
export function destroy() { }
export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), configKeys: CONFIG_KEYS.length, summary: getConfigSummary(), metrics: getMetrics() }; }
export function healthCheck() { return { status: _metrics.errors === 0 ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { configKeys: CONFIG_KEYS.length, noErrors: _metrics.errors === 0 }, metrics: getMetrics() }; }

export default { init, exportConfig, exportConfigAsJSON, downloadConfig, importConfig, importConfigFromJSON, importConfigFromFile, resetConfig, getConfigSummary, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID, CONFIG_KEYS };
