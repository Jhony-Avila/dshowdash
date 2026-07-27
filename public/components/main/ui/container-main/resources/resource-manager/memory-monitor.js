import { getResourceStats } from "../../contracts/resource-contract.js";
const VERSION = "2.0.0-MODULAR";
const MODULE_ID = "container-main:resource-manager:memory-monitor";
function createMemoryMonitor(options = {}) {
  const {
    warningThreshold,
    criticalThreshold,
    checkInterval = 3e4,
    maxHistorySize = 100,
    onWarning,
    onCritical,
    onCheck
  } = options;
  let _checkTimer = null;
  let _destroyed = false;
  let _lastCheck = null;
  const _history = [];
  function check(panelStats = {}) {
    if (_destroyed) return null;
    const stats = getResourceStats();
    const memoryUsage = stats.totalMemoryEstimate;
    _history.push({ timestamp: Date.now(), usage: memoryUsage });
    if (_history.length > maxHistorySize) _history.shift();
    _lastCheck = {
      timestamp: Date.now(),
      memoryUsage,
      resourceCount: stats.total,
      byType: stats.byType,
      byState: stats.byState,
      byPanel: panelStats
    };
    if (memoryUsage >= criticalThreshold) {
      onCritical?.(memoryUsage);
    } else if (memoryUsage >= warningThreshold) {
      onWarning?.(memoryUsage);
    }
    onCheck?.(_lastCheck);
    return _lastCheck;
  }
  function start(getPanelStats) {
    if (_checkTimer) return;
    _checkTimer = setInterval(() => {
      const panelStats = getPanelStats?.() || {};
      check(panelStats);
    }, checkInterval);
    check(getPanelStats?.() || {});
  }
  function stop() {
    if (_checkTimer) {
      clearInterval(_checkTimer);
      _checkTimer = null;
    }
  }
  function getLastCheck() {
    return _lastCheck ? { ..._lastCheck } : null;
  }
  function getHistory() {
    return [..._history];
  }
  function isCritical() {
    const stats = getResourceStats();
    return stats.totalMemoryEstimate >= criticalThreshold;
  }
  function isWarning() {
    const stats = getResourceStats();
    const usage = stats.totalMemoryEstimate;
    return usage >= warningThreshold && usage < criticalThreshold;
  }
  function destroy() {
    _destroyed = true;
    stop();
    _history.length = 0;
    _lastCheck = null;
  }
  return {
    check,
    start,
    stop,
    getLastCheck,
    getHistory,
    isCritical,
    isWarning,
    isMonitoring: () => !!_checkTimer,
    destroy
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["createMemoryMonitor"]
  };
}
var memory_monitor_default = {
  VERSION,
  MODULE_ID,
  createMemoryMonitor,
  info
};
export {
  MODULE_ID,
  VERSION,
  createMemoryMonitor,
  memory_monitor_default as default,
  info
};
