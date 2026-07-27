import { REFRESH_INTERVAL_BASE, REFRESH_INTERVAL_DEGRADED } from "./constants.js";
const MODULE_ID = "panel-10-refresh";
const VERSION = "9.3.0-P2-ENTERPRISE";
function createRefreshManager(context) {
  const logger = context.logger;
  let refreshTimer = null;
  return {
    start(instance, loadDataFn) {
      this.stop();
      const tick = async () => {
        if (refreshTimer) {
          clearTimeout(refreshTimer);
          refreshTimer = null;
        }
        const interval = this.getInterval(instance);
        refreshTimer = setTimeout(async () => {
          if (!document.hidden && instance.mounted && !instance.destroyed) {
            logger.debug("refresh.tick", { interval });
            await loadDataFn();
          }
          tick();
        }, interval);
      };
      tick();
      logger.info("refresh.started", { interval: REFRESH_INTERVAL_BASE });
    },
    stop() {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
        logger.debug("refresh.stopped");
      }
    },
    getInterval(instance) {
      if (instance.isDegraded) return REFRESH_INTERVAL_DEGRADED;
      const conn = navigator.connection;
      if (conn?.effectiveType) {
        if (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g") {
          return REFRESH_INTERVAL_BASE * 4;
        }
        if (conn.effectiveType === "3g") {
          return REFRESH_INTERVAL_BASE * 2;
        }
      }
      return REFRESH_INTERVAL_BASE;
    },
    isRunning() {
      return refreshTimer !== null;
    }
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { refreshReady: true } };
}
var refresh_default = { createRefreshManager, MODULE_ID, VERSION, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  createRefreshManager,
  refresh_default as default,
  healthCheck,
  info
};
