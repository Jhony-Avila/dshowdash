import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.3.0-MIGRATION-PHASE7";
const MODULE_ID = "panel-nav-admin.telemetry.event-metrics";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[EventMetrics]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
function EventMetrics(options = {}) {
  const { rateWindowMs = 6e4, maxHistory = 500 } = options;
  const _counts = {};
  const _history = [];
  const _categoryTotals = {
    crud: 0,
    dragDrop: 0,
    filter: 0,
    view: 0,
    import: 0,
    export: 0,
    bulk: 0,
    other: 0
  };
  const _startTime = Date.now();
  function _categorize(event) {
    if (!event) return "other";
    if (event.includes(":item:") || event.includes(":section:")) return "crud";
    if (event.includes("drag") || event.includes("drop") || event.includes("reorder")) return "dragDrop";
    if (event.includes("filter")) return "filter";
    if (event.includes("view")) return "view";
    if (event.includes("import")) return "import";
    if (event.includes("export")) return "export";
    if (event.includes("bulk")) return "bulk";
    return "other";
  }
  function record(eventName, meta = {}) {
    const now = Date.now();
    _counts[eventName] = (_counts[eventName] || 0) + 1;
    const category = _categorize(eventName);
    _categoryTotals[category] = (_categoryTotals[category] || 0) + 1;
    _history.push({
      event: eventName,
      category,
      timestamp: now,
      meta
    });
    if (_history.length > Number(maxHistory)) {
      _history.splice(0, _history.length - Number(maxHistory));
    }
  }
  function getCount(eventName) {
    return _counts[eventName] || 0;
  }
  function getAllCounts() {
    return { ..._counts };
  }
  function getCategoryTotals() {
    return { ..._categoryTotals };
  }
  function getRate(eventName) {
    const now = Date.now();
    const cutoff = now - Number(rateWindowMs);
    const windowEvents = _history.filter((h) => {
      if (h.timestamp < cutoff) return false;
      return eventName ? h.event === eventName : true;
    });
    const windowMinutes = Number(rateWindowMs) / 6e4;
    return windowEvents.length / windowMinutes;
  }
  function getTopEvents(n = 10) {
    return Object.entries(_counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(([event, count]) => ({ event, count }));
  }
  function getSummary() {
    const totalEvents = Object.values(_counts).reduce((sum, c) => sum + c, 0);
    const uptimeMs = Date.now() - _startTime;
    return {
      totalEvents,
      uniqueEvents: Object.keys(_counts).length,
      categoryTotals: getCategoryTotals(),
      topEvents: getTopEvents(5),
      overallRate: getRate(),
      uptimeMs,
      historySize: _history.length
    };
  }
  function getRecentHistory(limit = 20) {
    return _history.slice(-limit);
  }
  function reset() {
    for (const key of Object.keys(_counts)) delete _counts[key];
    _history.length = 0;
    for (const key of Object.keys(_categoryTotals)) _categoryTotals[key] = 0;
    _log("info", "Metrics reset");
  }
  return {
    record,
    getCount,
    getAllCounts,
    getCategoryTotals,
    getRate,
    getTopEvents,
    getSummary,
    getRecentHistory,
    reset
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var event_metrics_default = { EventMetrics, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  EventMetrics,
  MODULE_ID,
  VERSION,
  event_metrics_default as default,
  healthCheck,
  info,
  injectPorts
};
