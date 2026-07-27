// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.5.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.ui.panels.settings-sections
// PURPOSE: Ticker Settings Sections Manager (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'input'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '5.5.0-ES6';
export const MODULE_ID = 'ticker.ui.panels.settings-sections';
const hasWindow = typeof window !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug ?? false; };
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args); };
export class SettingsSectionsManager {
  [key: string]: any;
  constructor(panel: HTMLElement, config: Record<string, any>) { this.panel = panel; this.config = JSON.parse(JSON.stringify(config)); this.listeners = new Map(); this._metrics = { changeCount: 0, lastChangeAt: null }; }
  init() { this.attachInputListeners(); _log('debug', 'Sections manager initialized'); }
  attachInputListeners() { this.panel.querySelectorAll('input[type="radio"]').forEach((radio: Element) => { const listener = (e: Event) => this.handleRadioChange(e); radio.addEventListener('change', listener); this.listeners.set(radio, listener); }); this.panel.querySelectorAll('input[type="checkbox"][data-setting]').forEach((checkbox: Element) => { const listener = (e: Event) => this.handleCheckboxChange(e); checkbox.addEventListener('change', listener); this.listeners.set(checkbox, listener); }); this.panel.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach((checkbox: Element) => { const listener = (e: Event) => this.handleArrayCheckboxChange(e); checkbox.addEventListener('change', listener); this.listeners.set(checkbox, listener); }); this.panel.querySelectorAll('input[type="number"], input[type="text"]').forEach((input: Element) => { const listener = (e: Event) => this.handleInputChange(e); input.addEventListener('input', listener); this.listeners.set(input, listener); }); this.panel.querySelectorAll('select').forEach((select: Element) => { const listener = (e: Event) => this.handleSelectChange(e); select.addEventListener('change', listener); this.listeners.set(select, listener); }); }
  handleRadioChange(e: Event) { const t = e.target as HTMLInputElement; const group = t.closest('[data-setting]') as HTMLElement | null; if (!group) return; this.setConfigValue(group.dataset.setting!, t.value); this._metrics.changeCount++; this._metrics.lastChangeAt = Date.now(); }
  handleCheckboxChange(e: Event) { const t = e.target as HTMLInputElement; const path = t.dataset.setting; if (!path) return; this.setConfigValue(path, t.checked); this._metrics.changeCount++; this._metrics.lastChangeAt = Date.now(); }

  handleArrayCheckboxChange(e: Event) { const t = e.target as HTMLInputElement; const group = t.closest('[data-setting]') as HTMLElement | null; if (!group) return; const checkboxes = group.querySelectorAll('input[type="checkbox"]:checked'); const values = Array.from(checkboxes).map((cb: Element) => (cb as HTMLInputElement).value); this.setConfigValue(group.dataset.setting!, values); this._metrics.changeCount++; this._metrics.lastChangeAt = Date.now(); }
  handleInputChange(e: Event) { const t = e.target as HTMLInputElement; const path = t.dataset.setting; if (!path) return; const value = t.type === 'number' ? parseInt(t.value, 10) : t.value; this.setConfigValue(path, value); this._metrics.changeCount++; this._metrics.lastChangeAt = Date.now(); }
  handleSelectChange(e: Event) { const t = e.target as HTMLSelectElement; const path = t.dataset.setting; if (!path) return; let value: any = t.value; if (!isNaN(value)) { value = parseInt(value, 10); } this.setConfigValue(path, value); this._metrics.changeCount++; this._metrics.lastChangeAt = Date.now(); }
  setConfigValue(path: string, value: unknown) { const keys = path.split('.'); let current = this.config; for (let i = 0; i < keys.length - 1; i++) { if (!current[keys[i]]) { current[keys[i]] = {}; } current = current[keys[i]]; } current[keys[keys.length - 1]] = value; _log('debug', `Config value set: ${path} =`, value); }
  getConfig() { return JSON.parse(JSON.stringify(this.config)); }
  destroy() { this.listeners.forEach((listener: EventListener, element: Element) => { element.removeEventListener('change', listener); element.removeEventListener('input', listener); }); this.listeners.clear(); this.panel = null; this.config = null; _log('debug', 'Sections manager destroyed'); }
  healthCheck() { const logger = _getPort('logger'); const checks = { hasPanel: !!this.panel, hasConfig: !!this.config, loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 4 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, listenerCount: this.listeners.size, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() }; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { changeCount: 0, lastChangeAt: null }; }
}
export function getVersion() { return VERSION; }
export default SettingsSectionsManager;
