import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "panel-user-management.telemetry.logger";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _getPort = (name) => Ports.get(name);
class Logger {
  // @ts-expect-error TS2322: options properties are unknown, assigned to dynamic index signature
  constructor(options = {}) {
    this.prefix = options.prefix || "[Logger]";
    this.debug = options.debug || false;
    this._metrics = { logs: 0, errors: 0, warns: 0 };
    Ports.init();
  }
  // @ts-expect-error strict migration — TS2774
  _log(level, ...args) {
    this._metrics.logs++;
    const logger = _getPort("logger");
    if (logger && logger[level]) {
      logger[level](this.prefix, ...args);
    } else if (this.debug) {
      console[level]?.(this.prefix, ...args);
    }
  }
  info(...args) {
    this._log("info", ...args);
  }
  warn(...args) {
    this._metrics.warns++;
    this._log("warn", ...args);
  }
  error(...args) {
    this._metrics.errors++;
    this._log("error", ...args);
  }
  // @ts-expect-error strict migration — TS2774
  debug(...args) {
    if (this.debug) this._log("debug", ...args);
  }
  getMetrics() {
    return { ...this._metrics };
  }
  healthCheck() {
    return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, metrics: this._metrics };
  }
  getInfo() {
    return { moduleId: MODULE_ID, version: VERSION, prefix: this.prefix, debug: this.debug };
  }
}
function createLogger(options) {
  return new Logger(options);
}
var logger_default = { Logger, createLogger, MODULE_ID, VERSION };
export {
  Logger,
  MODULE_ID,
  VERSION,
  createLogger,
  logger_default as default
};
