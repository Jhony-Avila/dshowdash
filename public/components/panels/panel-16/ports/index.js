import { EventBusPort } from "./event-bus.port.js";
import { LoggerPort } from "./logger.port.js";
import { ConfigPort } from "./config.port.js";
import { AuthPort } from "./auth.port.js";
import { DomPort } from "./dom.port.js";
import { StoragePort } from "./storage.port.js";
import { TelemetryPort } from "./telemetry.port.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-16:ports";
function injectAll(deps = {}) {
  if (deps.eventBus) EventBusPort.inject(deps.eventBus);
  if (deps.logger) LoggerPort.inject(deps.logger, { debug: deps.debug });
  if (deps.config) ConfigPort.inject(deps.config);
  if (deps.auth) AuthPort.inject(deps.auth);
  if (deps.window || deps.document) DomPort.inject(deps.window, deps.document);
  if (deps.localStorage || deps.sessionStorage) StoragePort.inject(deps.localStorage, deps.sessionStorage);
  if (deps.telemetry) TelemetryPort.inject(deps.telemetry);
}
function resetAll() {
  EventBusPort.reset();
  LoggerPort.reset();
  ConfigPort.reset();
  AuthPort.reset();
  DomPort.reset();
  StoragePort.reset();
  TelemetryPort.reset();
}
function portsInfo() {
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
function healthCheck() {
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
  return { status: passed >= 5 ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/7`, checks, version: VERSION, moduleId: MODULE_ID };
}
var ports_default = { VERSION, MODULE_ID, injectAll, resetAll, portsInfo, healthCheck, EventBusPort, LoggerPort, ConfigPort, AuthPort, DomPort, StoragePort, TelemetryPort };
export {
  AuthPort,
  ConfigPort,
  DomPort,
  EventBusPort,
  LoggerPort,
  MODULE_ID,
  StoragePort,
  TelemetryPort,
  VERSION,
  ports_default as default,
  healthCheck,
  injectAll,
  portsInfo,
  resetAll
};
