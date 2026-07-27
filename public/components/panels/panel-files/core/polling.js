import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "panel-files.core.polling";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
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
class PollingManager {
  constructor(options = {}) {
    this.interval = options.interval || 3e4;
    this.callback = options.callback || (() => {
    });
    this._timer = null;
    this._running = false;
    this._metrics = { pollCount: 0, errorCount: 0, lastPollAt: null };
  }
  start() {
    if (this._running) return;
    this._running = true;
    this._poll();
    this._timer = setInterval(() => this._poll(), this.interval);
  }
  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._running = false;
  }
  async _poll() {
    if (document.hidden) return;
    this._metrics.pollCount++;
    this._metrics.lastPollAt = Date.now();
    try {
      await this.callback();
    } catch (e) {
      this._metrics.errorCount++;
      _getPort("logger")?.error(`[${MODULE_ID}] Poll error:`, e);
    }
  }
  setInterval(ms) {
    this.interval = ms;
    if (this._running) {
      this.stop();
      this.start();
    }
  }
  isRunning() {
    return this._running;
  }
  healthCheck() {
    return { status: "healthy", running: this._running, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, running: this._running, interval: this.interval, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
}
var polling_default = PollingManager;
export {
  MODULE_ID,
  PollingManager,
  VERSION,
  polling_default as default,
  getPorts,
  injectPorts
};
