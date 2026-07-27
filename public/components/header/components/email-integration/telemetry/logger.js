import { createUiPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "header.email-integration.telemetry.logger";
const VERSION = "2.2.0-P17WI";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
let _metrics = { logs: 0, warns: 0, errors: 0 };
class Logger {
  // @ts-expect-error TS2322: debug boolean conflicts with index signature method type
  constructor(options = {}) {
    this.prefix = options.prefix || "[email-integration]";
    this.debug = options.debug || false;
  }
  info(...args) {
    if (!this.debug) return;
    _metrics.logs++;
    const L = _getPort("logger");
    if (L?.info) L.info(this.prefix, ...args);
    else if (L?.debug) L.debug(this.prefix, ...args);
  }
  warn(...args) {
    _metrics.warns++;
    const L = _getPort("logger");
    if (L?.warn) L.warn(this.prefix, ...args);
  }
  error(...args) {
    _metrics.errors++;
    const L = _getPort("logger");
    if (L?.error) L.error(this.prefix, ...args);
  }
  debug(...args) {
    if (!this.debug) return;
    _metrics.logs++;
    const L = _getPort("logger");
    if (L?.debug) L.debug(this.prefix, ...args);
  }
  getMetrics() {
    return { ..._metrics };
  }
  healthCheck() {
    const ps = Ports.snapshot();
    return { status: ps._initialized ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { loggerReady: !!_getPort("logger"), portsInitialized: ps._initialized }, metrics: this.getMetrics(), portsInitialized: ps._initialized, timestamp: Date.now() };
  }
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized, timestamp: Date.now() };
}
function healthCheck() {
  const ps = Ports.snapshot();
  return { status: ps._initialized ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { loggerReady: !!_getPort("logger"), portsInitialized: ps._initialized }, portsInitialized: ps._initialized, timestamp: Date.now() };
}
export {
  Logger,
  MODULE_ID,
  VERSION,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
