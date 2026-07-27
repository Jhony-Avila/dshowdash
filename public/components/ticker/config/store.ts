// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.config.store
// PURPOSE: Ticker Config Store (Enterprise)
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
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '6.4.0-P17WI';
export const MODULE_ID = 'ticker.config.store';
const CONFIG_VERSION = 2;
const hasWindow = typeof window !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug ?? false; };
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args); };
export class TickerConfigStore {
  [key: string]: any;
  constructor() { this.storageKey = 'dshowdash_ticker_config'; this.listeners = []; this._metrics = { loadCount: 0, saveCount: 0, updateCount: 0, resetCount: 0, migrateCount: 0, lastUpdateAt: null }; this.config = this._loadConfig(); }
  _getDefaultConfig() { return { _version: CONFIG_VERSION, behavior: { mode: 'ticker', direction: 'left', speed: 'medium', pauseOnHover: true }, content: { sources: ['g1', 'uol', 'folha'], categories: ['politica', 'economia', 'tecnologia', 'geral'], maxItems: 20, autoRefreshMinutes: 5 }, visual: { height: 'default', fontSize: 'medium', showTag: true, showIcon: true, showTime: true, separatorStyle: 'bullet' }, theme: { background: 'darkA', accent: 'purple', text: 'light', tagStyle: 'category', shadow: 'soft' }, accessibility: { respectReducedMotion: true, highContrast: false }, preset: 'enterprise-default' }; }
  _migrate(stored: Record<string, unknown>) { const version = stored._version || 1; if (version === CONFIG_VERSION) return stored; _log('info', `Migrando config v${version} -> v${CONFIG_VERSION}`); this._metrics.migrateCount++; let migrated: Record<string, any> = { ...stored }; if ((version as number) < 2) { migrated.visual = migrated.visual || {}; migrated.visual.separatorStyle = migrated.visual.separatorStyle || 'bullet'; migrated.accessibility = migrated.accessibility || { respectReducedMotion: true, highContrast: false }; } migrated._version = CONFIG_VERSION; return migrated; }
  _loadConfig() { this._metrics.loadCount++; try { const stored = localStorage.getItem(this.storageKey); if (stored) { let parsed = JSON.parse(stored); parsed = this._migrate(parsed); const merged = this._mergeDeep(this._getDefaultConfig(), parsed); if (parsed._version !== CONFIG_VERSION) { this._save(merged); } return merged; } } catch (error) { _log('warn', 'Erro ao carregar storage:', error); } return this._getDefaultConfig(); }
  getConfig() { return JSON.parse(JSON.stringify(this.config)); }
  getDefaultConfig() { return this._getDefaultConfig(); }
  getConfigVersion() { return CONFIG_VERSION; }
  update(partialConfig: Record<string, unknown>) { delete partialConfig._version; this.config = this._mergeDeep(this.config, partialConfig); this.config._version = CONFIG_VERSION; this._save(this.config); this._notify(); this._metrics.updateCount++; this._metrics.lastUpdateAt = Date.now(); }
  _save(config: unknown) { try { localStorage.setItem(this.storageKey, JSON.stringify(config)); this._metrics.saveCount++; } catch (error) { _log('error', 'Erro ao salvar:', error); } }
  reset() { this.config = this._getDefaultConfig(); this._save(this.config); this._notify(); this._metrics.resetCount++; }
  applyPreset(presetName: string) { const presets: Record<string, unknown> = { 'enterprise-default': this._getDefaultConfig(), 'reading-comfort': { behavior: { mode: 'ticker', direction: 'left', speed: 'slow', pauseOnHover: true }, visual: { height: 'tall', fontSize: 'large', showTag: true, showIcon: false, showTime: true, separatorStyle: 'bar' }, theme: { background: 'darkA', accent: 'blue', text: 'light', tagStyle: 'mono', shadow: 'soft' }, accessibility: { respectReducedMotion: true, highContrast: false } }, 'colorful-soft': { behavior: { mode: 'ticker', direction: 'left', speed: 'medium', pauseOnHover: true }, visual: { height: 'default', fontSize: 'medium', showTag: true, showIcon: true, showTime: true, separatorStyle: 'chevron' }, theme: { background: 'darkB', accent: 'purple', text: 'light', tagStyle: 'category', shadow: 'medium' }, accessibility: { respectReducedMotion: true, highContrast: false } } }; const preset = presets[presetName]; if (preset) { this.config = this._mergeDeep(this._getDefaultConfig(), preset as Record<string, unknown>); this.config.preset = presetName; this.config._version = CONFIG_VERSION; this._save(this.config); this._notify(); } }
  subscribe(listener: (...args: unknown[]) => void) { this.listeners.push(listener); return () => { this.listeners = this.listeners.filter((l: unknown) => l !== listener); }; }
  _notify() { this.listeners.forEach((listener: (...args: unknown[]) => void) => { try { listener(this.config); } catch (e) { _log('error', 'Erro em listener:', e); } }); }
  _mergeDeep(target: Record<string, unknown>, source: Record<string, unknown>) { const output = { ...target }; if (this._isObject(target) && this._isObject(source)) { Object.keys(source).forEach(key => { if (this._isObject(source[key])) { output[key] = !(key in target) ? source[key] : this._mergeDeep(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>); } else { output[key] = source[key]; } }); } return output; }
  _isObject(item: unknown) { return item && typeof item === 'object' && !Array.isArray(item); }
  validate(config: Record<string, any>) { return config.behavior && ['ticker', 'static'].includes(config.behavior.mode) && config.content && Array.isArray(config.content.sources) && config.visual && config.visual.height && config.theme && config.theme.background; }
  exportConfig() { return JSON.stringify(this.config, null, 2); }
  importConfig(jsonString: string) { try { const imported = JSON.parse(jsonString); if (this.validate(imported)) { imported._version = CONFIG_VERSION; this.config = this._mergeDeep(this._getDefaultConfig(), imported); this._save(this.config); this._notify(); return true; } return false; } catch (error) { _log('error', 'Erro ao importar:', error); return false; } }
  healthCheck() { const logger = _getPort('logger'); const checks = { hasConfig: !!this.config, validConfig: this.validate(this.config), correctVersion: this.config._version === CONFIG_VERSION, storageAccessible: true, loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; try { localStorage.getItem(this.storageKey); } catch { checks.storageAccessible = false; } const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 6 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/6`, checks, configVersion: CONFIG_VERSION, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, configVersion: CONFIG_VERSION, preset: this.config.preset, listenerCount: this.listeners.length, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() }; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { loadCount: 0, saveCount: 0, updateCount: 0, resetCount: 0, migrateCount: 0, lastUpdateAt: null }; }
}
export function getVersion() { return VERSION; }
export default TickerConfigStore;
