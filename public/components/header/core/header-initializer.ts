// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.5.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/header-initializer
// PURPOSE: Core initialization logic — config loading, validation, element caching and structure validation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   HEADER_EVENTS from /core/runtime/events/catalog/header.events.js
// PROVIDES:
//   HeaderInitializer (class) — loads config, caches elements, validates structure
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
//   getVersion() — return module version
//   VERSION — module version constant
//   MODULE_ID — module identifier constant
// EMITS (eventos):
//   HEADER_EVENTS.CONFIG_LOAD_FAILED — when config fetch fails (via telemetry.track)
// WINDOW ACCESS:
//   document.body.dataset — read header config override
//   document.querySelector — cache header DOM elements
// ═══════════════════════════════════════════════════════════════

// Header Initializer - Core Initialization Logic (Enterprise)
// @version 5.5.0-P18EC
// @changelog v5.5.0-P18EC - Migração telemetry.track() para constantes P18EC
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { HEADER_EVENTS } from '/core/runtime/events/catalog/header.events.js';

export const VERSION = '5.5.0-P18EC';
export const MODULE_ID = 'header/core/header-initializer';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => _getPort('config')?.app?.debug || false;
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { logger.error?.(prefix, ...args); return; } if (level === 'warn') { logger.warn?.(prefix, ...args); return; } if (level === 'info') { logger.info?.(prefix, ...args); return; } if (_debugEnabled()) logger.debug?.(prefix, ...args); };

export class HeaderInitializer {
  [key: string]: any;
  constructor(header: Record<string,unknown>) { this.header = header; this._debug = false; this._metrics = { configLoadCount: 0, cacheElementsCount: 0, validateCount: 0, errorCount: 0, lastInitAt: null }; }

  async loadConfig() { try { const response = await this.header.fetchClient.fetch('/components/header/config.json', { timeout: 5000, retries: 1, bypassCircuit: true }); this.header.config = await response.json(); this.validateConfig(); _log('info', 'Config carregado'); this._metrics.configLoadCount++; this._metrics.lastInitAt = Date.now(); } catch (error: any) { _log('warn', 'Erro ao carregar config, usando defaults:', error.message); this.header.config = this.getDefaultConfig(); this._metrics.errorCount++; if (this.header.telemetry) { this.header.telemetry.track(HEADER_EVENTS.CONFIG_LOAD_FAILED, { reason: error.message, instanceId: this.header.instanceId, action: 'config-error' }); } } try { const override = document.body.dataset.headerConfig; if (override) { this.header.config = { ...this.header.config, ...JSON.parse(override) }; _log('debug', 'Config override aplicado'); } } catch (e) { _log('warn', 'Erro ao parsear data-header-config'); } }

  // @ts-expect-error TS migration - TS2740
  validateConfig() { this._metrics.validateCount++; const requiredPaths = ['api.healthEndpoint', 'api.timeout', 'polling.healthInterval', 'telemetry.sampleRate']; const missing = []; for (const path of requiredPaths) { const keys = path.split('.'); let obj = this.header.config; for (const key of keys) { if (obj && typeof obj === 'object' && key in obj) { obj = obj[key]; } else { missing.push(path); break; } } } if (missing.length > 0) { _log('warn', `Campos ausentes no config: ${missing.join(', ')}`); const defaults = this.getDefaultConfig(); for (const path of missing) { const keys = path.split('.'); let target = this.header.config, source = defaults; for (let i = 0; i < keys.length - 1; i++) { const key = keys[i]; if (!target[key]) target[key] = {}; target = target[key]; source = (source as Record<string,unknown>)[key]; } target[keys[keys.length - 1]] = (source as Record<string,unknown>)[keys[keys.length - 1]]; } } }

  getDefaultConfig() { const cfg = _getPort('config'); const globalSampleRate = cfg?.telemetry?.sampleRate; const debugMode = cfg?.app?.debug; const sampleRate = globalSampleRate !== undefined ? globalSampleRate : (debugMode ? 1.0 : 0.1); return { module: 'header', version: this.header.version, api: { healthEndpoint: '/api/health/status.php', healthWithCredentials: false, alertsEndpoint: '/api/alerts/header-alerts.php', timeout: 6000, retries: 3 }, polling: { healthInterval: 15000, alertsInterval: 30000, networkQualityInterval: 30000 }, network: { rttThresholds: { online: 120, degraded: 350 } }, refresh: { throttle: 5000, fallbackTimeout: 1200 }, ui: { tooltipDelayShow: 250, scrollThreshold: 50 }, accessibility: { announceDebounce: 800, rovingTabindexEnabled: true, keyboardShortcutsEnabled: true }, telemetry: { enabled: true, sampleRate }, fallback: { autoHide: true, autoHideDuration: 8000, debounce: 300 } }; }

  cacheElements(container: HTMLElement|null) { this._metrics.cacheElementsCount++; const root = container || document; this.header.elements = { header: root.querySelector('.site-header'), statusLive: root.querySelector('.header-status-live'), envChip: root.querySelector('.header-env-chip'), btnRefresh: root.querySelector('#btn-refresh'), btnFullscreen: root.querySelector('#btn-fullscreen'), container: root }; this.header.features = { refresh: !!this.header.elements.btnRefresh, fullscreen: !!this.header.elements.btnFullscreen }; }

  validateStructure() { this._metrics.validateCount++; const critical = ['header']; const criticalMissing = critical.filter(key => !this.header.elements[key]); if (criticalMissing.length > 0) { _log('error', `Elementos criticos faltando: ${criticalMissing.join(', ')}`); this._metrics.errorCount++; throw new Error('Estrutura HTML critica invalida'); } _log('info', 'Estrutura HTML validada - Componentes via loader'); return true; }

  healthCheck() { const checks = { headerAvailable: !!this.header, fetchClientAvailable: !!this.header?.fetchClient, configLoaded: !!this.header?.config, noExcessiveErrors: this._metrics.errorCount < 5 }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([,v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; }

  info() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { this._debug = !!enabled; }
  resetMetrics() { this._metrics = { configLoadCount: 0, cacheElementsCount: 0, validateCount: 0, errorCount: 0, lastInitAt: null }; }
}

export function getVersion() { return VERSION; }
export default HeaderInitializer;
