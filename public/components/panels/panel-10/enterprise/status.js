import { PAINEL_ID, VERSION as PANEL_VERSION, MAX_CONSECUTIVE_ERRORS } from "../core/constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-10-status";
function createStatusManager(getInstance) {
  return {
    getStatus() {
      const instance = getInstance();
      if (!instance) return { panelId: PAINEL_ID, mounted: false };
      const apiClient = instance.apiClient;
      const circuitBreaker = instance.circuitBreaker;
      const store = instance.store;
      return { panelId: PAINEL_ID, version: PANEL_VERSION, state: instance.state, mounted: instance.mounted, destroyed: instance.destroyed, isDegraded: instance.isDegraded, consecutiveErrors: instance.consecutiveErrors, loadCount: instance.loadCount, lastLoadTime: instance.lastLoadTime, metrics: { ...instance.performanceMetrics }, api: apiClient?.getMetrics?.() || {}, circuitBreaker: circuitBreaker?.getMetrics?.() || {}, store: store?.getStats?.() || {} };
    },
    healthCheck() {
      const status = this.getStatus();
      const instance = getInstance();
      const checks = { instanceExists: !!instance, mounted: status.mounted === true, notDestroyed: status.destroyed !== true, notDegraded: status.isDegraded !== true, lowErrorCount: (status.consecutiveErrors || 0) < MAX_CONSECUTIVE_ERRORS, circuitClosed: status.circuitBreaker?.state === "CLOSED" };
      const score = Object.values(checks).filter(Boolean).length;
      const maxScore = Object.keys(checks).length;
      return { status: score === maxScore ? "HEALTHY" : score >= 4 ? "DEGRADED" : "UNHEALTHY", score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, panelId: PAINEL_ID, version: VERSION, timestamp: Date.now() };
    },
    // @ts-expect-error strict migration — TS2783
    info() {
      return { panelId: PAINEL_ID, version: VERSION, moduleId: MODULE_ID, ...this.getStatus() };
    },
    getVersion() {
      return VERSION;
    }
  };
}
var status_default = { createStatusManager, MODULE_ID, VERSION };
export {
  MODULE_ID,
  VERSION,
  createStatusManager,
  status_default as default
};
