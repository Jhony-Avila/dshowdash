// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:utils:lifecycle
// PURPOSE: Panel-05 - Lifecycle Utilities
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   emitLifecycle() — exported function
//   log() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   setDebug() — exported function
//   getLogs() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import * as Telemetry from '../telemetry/tracker.js';
const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-05:utils:lifecycle';
let _debug = false;
const _logBuffer: Array<{ level: string; args: unknown[]; ts: number }> = [];
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
const injectPorts = (p: unknown) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const setDebug = (enabled: unknown) => { _debug = !!enabled; };
const getLogs = () => [..._logBuffer];
const emitLifecycle = (moduleId: string, version: string, event: string, data: Record<string, unknown> = {}) => { _initPorts(); const eventBus = _getPort('eventBus'); if (eventBus?.emit) { eventBus.emit(event, { moduleId, version, timestamp: Date.now(), ...data }); } Telemetry.track(event.replace('panel-05:', ''), data); };
const log = (level: string, ...args: unknown[]) => { const prefix = '[Panel-05]'; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); const logger = _getPort('logger'); if (logger && (_debug || level === 'error' || level === 'warn')) { if (level === 'error' && (logger as Record<string, unknown>).error) (logger as Record<string, (...a: unknown[]) => void>).error(prefix, ...args); else if (level === 'warn' && (logger as Record<string, unknown>).warn) (logger as Record<string, (...a: unknown[]) => void>).warn(prefix, ...args); else if (_debug && (logger as Record<string, unknown>).debug) (logger as Record<string, (...a: unknown[]) => void>).debug(prefix, ...args); } };
const healthCheck = () => { const ps = Ports.snapshot(); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: ps._initialized, timestamp: Date.now() }; };
const info = () => { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized, logBufferSize: _logBuffer.length, timestamp: Date.now() }; };
export { emitLifecycle, log, info, healthCheck, injectPorts, getPorts, setDebug, getLogs, VERSION, MODULE_ID };
export default { emitLifecycle, log, info, healthCheck, injectPorts, getPorts, setDebug, getLogs, VERSION, MODULE_ID };
