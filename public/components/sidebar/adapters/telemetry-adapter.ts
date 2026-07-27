// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-telemetry-adapter
// PURPOSE: Sidebar V2 - Telemetry Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   createTelemetryAdapter() — exported function
//   info() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '6.0.0-ES6';
export const MODULE_ID = 'sidebar-telemetry-adapter';

const PREFIX = '[sidebar]';

const TELEMETRY_EVENTS = {
  ERROR: 'telemetry:sidebar:error',
  NAVIGATION: 'telemetry:sidebar:navigation',
  TOGGLE: 'telemetry:sidebar:toggle',
  SECTION_TOGGLE: 'telemetry:sidebar:section:toggle',
  SEARCH: 'telemetry:sidebar:search'
};

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function createTelemetryAdapter() {
  let _metrics = { logs: { debug: 0, info: 0, warn: 0, error: 0 }, tracks: 0, errors: 0, lastLog: null as DynObj, lastTrack: null as DynObj };
  const getLogger = () => _getPort('logger');
  const getTelemetry = () => _getPort('telemetryCore') || _getPort('telemetry');

  return {
    log(level: string, message: string, data = {}) {
      try {
        const logger = getLogger();
        const formattedMsg = `${PREFIX} ${message}`;
        const payload = Object.assign({ timestamp: Date.now() }, data);
        if (!logger) return;
        switch (level) {
          case 'debug': if (logger.debug) logger.debug(formattedMsg, payload); _metrics.logs.debug++; break;
          case 'info': if (logger.info) logger.info(formattedMsg, payload); _metrics.logs.info++; break;
          case 'warn': if (logger.warn) logger.warn(formattedMsg, payload); _metrics.logs.warn++; break;
          case 'error': if (logger.error) logger.error(formattedMsg, payload); _metrics.logs.error++; break;
          default: if (logger.info) logger.info(formattedMsg, payload);
        }
        _metrics.lastLog = { level, message, timestamp: Date.now() };
      } catch (e) { _metrics.errors++; }
    },
    track(event: string, data = {}) {
      try {
        const telemetry = getTelemetry();
        const payload = Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data);
        if (telemetry && telemetry.track) telemetry.track(event, payload);
        _metrics.tracks++; _metrics.lastTrack = { event, timestamp: Date.now() };
      } catch (e) { _metrics.errors++; }
    },
    error(message: string, error: Error) { this.log('error', message, { error: error ? error.message : error }); this.track('sidebar:error', { message, error: error ? error.message : null }); },
    info(message: string, data: DynObj) { this.log('info', message, data); },
    debug(message: string, data: DynObj) { this.log('debug', message, data); },
    warn(message: string, data: DynObj) { this.log('warn', message, data); },
    trackNavigation(itemId: string, route: string) { this.track('sidebar:navigation', { itemId, route }); },
    trackToggle(collapsed: boolean) { this.track('sidebar:toggle', { collapsed }); },
    trackSectionToggle(sectionId: string, expanded: boolean) { this.track('sidebar:section:toggle', { sectionId, expanded }); },
    trackSearch(query: string, resultsCount: number) { this.track('sidebar:search', { query, resultsCount }); },
    trackError(error: Error, context: DynObj) { this.track('sidebar:error', Object.assign({ error: error ? error.message : error }, context || {})); },
    getMetrics() { return Object.assign({}, _metrics); },
    reset() { _metrics = { logs: { debug: 0, info: 0, warn: 0, error: 0 }, tracks: 0, errors: 0, lastLog: null, lastTrack: null }; },
    getInfo() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), hasLogger: !!getLogger(), hasTelemetry: !!getTelemetry(), metrics: this.getMetrics() }; },
    healthCheck() {
      const hasLogger = !!getLogger();
      const hasTelemetry = !!_getPort('telemetryCore');
      const hasEventBus = !!_getPort('eventBus');
      const totalLogs = _metrics.logs.debug + _metrics.logs.info + _metrics.logs.warn + _metrics.logs.error;
      const checks = { hasLogger, hasTelemetry, hasEventBus, noErrors: _metrics.errors === 0, logsWorking: totalLogs > 0 || _metrics.errors === 0 };
      const passed = Object.values(checks).filter(Boolean).length;
      const total = Object.keys(checks).length;
      return { status: passed >= 3 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, metrics: _metrics, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
    }
  };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function getMetrics() { return {}; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), loggerReady: !!_getPort('logger') }; }

export default { VERSION, MODULE_ID, TELEMETRY_EVENTS, createTelemetryAdapter, info, getMetrics, healthCheck };
