import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import * as Telemetry from "../telemetry/tracker.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:utils:lifecycle";
let _debug = false;
const _logBuffer = [];
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const setDebug = (enabled) => {
  _debug = !!enabled;
};
const getLogs = () => [..._logBuffer];
const emitLifecycle = (moduleId, version, event, data = {}) => {
  _initPorts();
  const eventBus = _getPort("eventBus");
  if (eventBus?.emit) {
    eventBus.emit(event, { moduleId, version, timestamp: Date.now(), ...data });
  }
  Telemetry.track(event.replace("panel-05:", ""), data);
};
const log = (level, ...args) => {
  const prefix = "[Panel-05]";
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
  const logger = _getPort("logger");
  if (logger && (_debug || level === "error" || level === "warn")) {
    if (level === "error" && logger.error) logger.error(prefix, ...args);
    else if (level === "warn" && logger.warn) logger.warn(prefix, ...args);
    else if (_debug && logger.debug) logger.debug(prefix, ...args);
  }
};
const healthCheck = () => {
  const ps = Ports.snapshot();
  return { status: ps._initialized ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: ps._initialized, timestamp: Date.now() };
};
const info = () => {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized, logBufferSize: _logBuffer.length, timestamp: Date.now() };
};
var lifecycle_default = { emitLifecycle, log, info, healthCheck, injectPorts, getPorts, setDebug, getLogs, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  lifecycle_default as default,
  emitLifecycle,
  getLogs,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  log,
  setDebug
};
