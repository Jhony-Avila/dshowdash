import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.3.0-ES6";
const MODULE_ID = "app-shell-ticker-adapter";
const hasWindow = typeof window !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
let _tickerInstance = null;
let _mounted = false;
let _metrics = { mounts: 0, unmounts: 0, errors: 0 };
function _trackEvent(event, data) {
  data = data || {};
  try {
    const t = _getPort("telemetry");
    if (t && t.event) t.event(MODULE_ID + ":" + event, data);
  } catch (e) {
  }
}
function _findTickerRegion() {
  return document.querySelector('[data-region="ticker"]') || document.getElementById("shell-ticker-region") || document.getElementById("ticker");
}
async function connect(regionId) {
  if (_mounted && _tickerInstance) return true;
  const region = _findTickerRegion();
  if (!region) {
    _trackEvent("no-region", { regionId: regionId || "ticker" });
    return false;
  }
  try {
    const TickerModule = await import("/components/ticker/index.js");
    const TickerComponentEnterprise = TickerModule.TickerComponentEnterprise;
    if (!TickerComponentEnterprise) {
      throw new Error("TickerComponentEnterprise not found");
    }
    _tickerInstance = new TickerComponentEnterprise({ container: region });
    await _tickerInstance.mount();
    _mounted = true;
    _metrics.mounts++;
    if (hasWindow) {
      window.Ticker = _tickerInstance;
      window.__dev = window.__dev || {};
      window.__dev.ticker = _tickerInstance;
    }
    _trackEvent("connected", { regionId: region.id });
    return true;
  } catch (error) {
    _metrics.errors++;
    _trackEvent("connect-error", { error: error.message });
    return false;
  }
}
async function disconnect() {
  if (_tickerInstance && _mounted) {
    try {
      await _tickerInstance.unmount();
      _tickerInstance = null;
      _mounted = false;
      _metrics.unmounts++;
      _trackEvent("disconnected");
      return true;
    } catch (error) {
      _metrics.errors++;
      return false;
    }
  }
  return false;
}
function getInstance() {
  return _tickerInstance;
}
function isConnected() {
  return _mounted;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function healthCheck() {
  const ps = Ports.snapshot();
  const checks = {
    mounted: _mounted,
    hasInstance: !!_tickerInstance,
    portsInitialized: ps._initialized
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: _mounted ? "HEALTHY" : "DEGRADED",
    score: passed + "/" + keys.length,
    checks,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
}
function info() {
  const ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    mounted: _mounted,
    hasInstance: !!_tickerInstance,
    metrics: getMetrics(),
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
}
var ticker_adapter_default = {
  connect,
  disconnect,
  getInstance,
  isConnected,
  getMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  connect,
  ticker_adapter_default as default,
  disconnect,
  getInstance,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isConnected
};
