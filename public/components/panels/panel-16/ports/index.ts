// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-16:ports
// PURPOSE: Ports Index - Panel-16 AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   EventBusPort from ./event-bus.port.js
//   LoggerPort from ./logger.port.js
//   ConfigPort from ./config.port.js
//   AuthPort from ./auth.port.js
//   DomPort from ./dom.port.js
//   StoragePort from ./storage.port.js
//   TelemetryPort from ./telemetry.port.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectAll() — exported function
//   resetAll() — exported function
//   portsInfo() — exported function
//   healthCheck() — exported function
//   EventBusPort — exported value
//   LoggerPort — exported value
//   ConfigPort — exported value
//   AuthPort — exported value
//   DomPort — exported value
//   StoragePort — exported value
//   TelemetryPort — exported value
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


// @ts-expect-error TS migration - TS2614
import { EventBusPort } from './event-bus.port.js';

// @ts-expect-error TS migration - TS2614
import { LoggerPort } from './logger.port.js';

// @ts-expect-error TS migration - TS2614
import { ConfigPort } from './config.port.js';

// @ts-expect-error TS migration - TS2614
import { AuthPort } from './auth.port.js';
import { DomPort } from './dom.port.js';
import { StoragePort } from './storage.port.js';
import { TelemetryPort } from './telemetry.port.js';

export { EventBusPort, LoggerPort, ConfigPort, AuthPort, DomPort, StoragePort, TelemetryPort };

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-16:ports';

export function injectAll(deps: Record<string, unknown> = {}) {
  if (deps.eventBus) EventBusPort.inject(deps.eventBus);
  if (deps.logger) LoggerPort.inject(deps.logger, { debug: deps.debug });
  if (deps.config) ConfigPort.inject(deps.config);
  if (deps.auth) AuthPort.inject(deps.auth);
  if (deps.window || deps.document) DomPort.inject(deps.window as Window, deps.document as Document);
  if (deps.localStorage || deps.sessionStorage) StoragePort.inject(deps.localStorage as Storage | Record<string, unknown>, deps.sessionStorage as Storage | Record<string, unknown>);
  if (deps.telemetry) TelemetryPort.inject(deps.telemetry as Record<string, unknown>);
}

export function resetAll() {
  EventBusPort.reset();
  LoggerPort.reset();
  ConfigPort.reset();
  AuthPort.reset();
  DomPort.reset();
  StoragePort.reset();
  TelemetryPort.reset();
}

export function portsInfo() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    ports: {
      eventBus: EventBusPort.info(),
      logger: LoggerPort.info(),
      config: ConfigPort.info(),
      auth: AuthPort.info(),
      dom: DomPort.info(),
      storage: StoragePort.info(),

      // @ts-expect-error TS migration - TS2554
      telemetry: TelemetryPort.info()
    }
  };
}

export function healthCheck() {
  const ports = portsInfo().ports;
  const checks = {
    eventBusAvailable: ports.eventBus.available,
    loggerAvailable: ports.logger.available,
    configAvailable: ports.config.available,
    authAvailable: ports.auth.available,
    domAvailable: ports.dom.available,
    storageAvailable: ports.storage.available,
    telemetryConnected: ports.telemetry.connected
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed >= 5 ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/7`, checks, version: VERSION, moduleId: MODULE_ID };
}

export default { VERSION, MODULE_ID, injectAll, resetAll, portsInfo, healthCheck, EventBusPort, LoggerPort, ConfigPort, AuthPort, DomPort, StoragePort, TelemetryPort };
