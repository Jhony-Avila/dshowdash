// @upgrade v*.*.*-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// EnterpriseLoader - Telemetry Helper
// DEPENDENCY CONTRACT — Core js module
// @version 5.6.0-P0-ENTERPRISE
// @changelog v5.6.0-P0-ENTERPRISE - EventBus/Telemetry via Ports (elimina window fallbacks)
// @changelog v5.5.0-P22 - Removed dual-emit eventBus.emit(TELEMETRY_INTENTS.TRACK) - telemetry.track is the official trail for metrics (P22 compliance)
// @changelog v5.4.0-P18EC - Migrated from 'telemetry:' concat to TELEMETRY_INTENTS.TRACK
'use strict';

import { VERSION, MODULE_ID } from './constants.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';

interface TelemetryPort {
  track?: (eventName: string, data: Record<string, unknown>) => void;
}

const LOADER_TELEMETRY = {
  INIT: 'enterprise-loader:init',
  LOAD_START: 'enterprise-loader:load-start',
  LOAD_SUCCESS: 'enterprise-loader:load-success',
  LOAD_ERROR: 'enterprise-loader:load-error',
  COMPONENT_READY: 'enterprise-loader:component-ready',
  STAGE_COMPLETE: 'enterprise-loader:stage-complete'
} as const;

type LoaderTelemetryKey = keyof typeof LOADER_TELEMETRY;

// P0 ENTERPRISE: Ports-based access (no window.* fallbacks)
const HELPER_MODULE_ID = 'enterprise-loader-telemetry-helper';
const Ports = createCorePorts({ moduleId: HELPER_MODULE_ID });
let _portsInitialized = false;
function _initPorts(): void { if (_portsInitialized) return; Ports.init(); _portsInitialized = true; }
function _getPort(name: string): unknown { _initPorts(); return Ports.get(name); }

export function injectPorts(ports: unknown): unknown { return Ports.inject(ports); }
export function getPorts(): unknown { return Ports.snapshot(); }

// P22: telemetry.track is the official trail for metrics - eventBus.emit removed (was dual-emit)
export function trackLoaderEvent(eventKey: string, data?: Record<string, unknown>): void {
  const eventData: Record<string, unknown> = data || {};
  _initPorts();
  const eventName: string = (LOADER_TELEMETRY as Record<string, string>)[eventKey] || eventKey;
  try {
    const telemetry = _getPort('telemetry') as TelemetryPort | null;
    if (telemetry && telemetry.track) {
      telemetry.track(eventName, Object.assign({}, eventData, {
        component: MODULE_ID,
        version: VERSION,
        timestamp: Date.now()
      }));
    }
  } catch (_e) { /* silent */ }
}

export function healthCheck(): { status: string; score: string; checks: Record<string, boolean>; p0Enterprise: boolean; p22Compliant: boolean; timestamp: number } {
  _initPorts();
  const checks: Record<string, boolean> = { telemetryAvailable: !!_getPort('telemetry'), portsInitialized: _portsInitialized };
  const passed: number = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, p0Enterprise: true, p22Compliant: true, timestamp: Date.now() };
}

export function info(): { version: string; module: string; events: string[]; portsInitialized: boolean; p0Enterprise: boolean; p22Compliant: boolean } {
  return { version: VERSION, module: MODULE_ID, events: Object.keys(LOADER_TELEMETRY), portsInitialized: _portsInitialized, p0Enterprise: true, p22Compliant: true };
}

export { LOADER_TELEMETRY };
export type { LoaderTelemetryKey };
export default { trackLoaderEvent, injectPorts, getPorts, healthCheck, info, LOADER_TELEMETRY };
