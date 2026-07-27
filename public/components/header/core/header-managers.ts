// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.3.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/header-managers
// PURPOSE: Initializes API clients (Health, Alerts) and core managers (NetworkQuality, Polling)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   HealthAPI from ../api/health.js
//   AlertsAPI from ../api/alerts.js
//   NetworkQualityMonitor from ./network-quality.js
//   PollingManager from ./polling.js
// PROVIDES:
//   HeaderManagers (class) — initializes API and manager instances on header
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
//   getVersion() — return module version
//   VERSION — module version constant
//   MODULE_ID — module identifier constant
// ═══════════════════════════════════════════════════════════════

// Header Managers - API and Core Managers Initialization (Enterprise)
// @version 5.3.0-P17WI
// P17WI: PortsFactory/PortsProfiles
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { HealthAPI } from '../api/health.js';
import { AlertsAPI } from '../api/alerts.js';
import { NetworkQualityMonitor } from './network-quality.js';
import { PollingManager } from './polling.js';

export const VERSION = '5.3.0-P17WI';
export const MODULE_ID = 'header/core/header-managers';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => _getPort('config')?.app?.debug || false;
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { logger.error?.(prefix, ...args); return; } if (level === 'warn') { logger.warn?.(prefix, ...args); return; } if (level === 'info') { logger.info?.(prefix, ...args); return; } if (_debugEnabled()) logger.debug?.(prefix, ...args); };

export class HeaderManagers {
  [key: string]: any;
  constructor(header: Record<string,unknown>) { this.header = header; this._debug = false; this._metrics = { initAPICount: 0, initManagersCount: 0, lastInitAt: null }; }

  initAPI() { this._metrics.initAPICount++; this._metrics.lastInitAt = Date.now(); this.header.healthAPI = new HealthAPI(this.header.config, this.header.timers, this.header.logger, this.header.eventBus); this.header.alertsAPI = new AlertsAPI(this.header.config, this.header.logger, this.header.eventBus); _log('info', 'APIs inicializadas'); }

  initManagers() { this._metrics.initManagersCount++; this.header.networkMonitor = new NetworkQualityMonitor(this.header.config, this.header.store, this.header.logger); this.header.polling = new PollingManager(this.header.config, this.header.healthAPI, this.header.alertsAPI, this.header.networkMonitor, this.header.store, this.header.timers, this.header.telemetry, this.header.logger, this.header.eventBus); _log('info', 'Managers inicializados'); }

  healthCheck() { const checks = { headerAvailable: !!this.header, healthAPIReady: !!this.header?.healthAPI, alertsAPIReady: !!this.header?.alertsAPI, networkMonitorReady: !!this.header?.networkMonitor, pollingReady: !!this.header?.polling }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([,v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; }

  info() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { this._debug = !!enabled; }
  resetMetrics() { this._metrics = { initAPICount: 0, initManagersCount: 0, lastInitAt: null }; }
}

export function getVersion() { return VERSION; }
export default HeaderManagers;
