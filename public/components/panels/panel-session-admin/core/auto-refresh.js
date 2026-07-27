import * as States from "../ui/states.js";
import tracker from "../telemetry/tracker.js";
import { showToast } from "./helpers.js";
import { localState } from "./state.js";
import { AUTO_REFRESH_SECONDS } from "./constants.js";
import { refresh } from "./data.js";
function startAutoRefresh() {
  if (localState.autoRefreshInterval) return;
  localState.autoRefreshEnabled = true;
  localState.countdown = AUTO_REFRESH_SECONDS;
  localState.autoRefreshInterval = setInterval(() => {
    if (document.hidden) return;
    localState.countdown--;
    if (States.setCountdown) States.setCountdown(localState.countdown);
    if (localState.countdown <= 0) {
      refresh();
      localState.countdown = AUTO_REFRESH_SECONDS;
    }
  }, 1e3);
  if (States.setAutoRefresh) States.setAutoRefresh(true);
  tracker.autoRefreshToggle(true);
}
function stopAutoRefresh() {
  if (localState.autoRefreshInterval) {
    clearInterval(localState.autoRefreshInterval);
    localState.autoRefreshInterval = null;
  }
  localState.autoRefreshEnabled = false;
  if (States.setAutoRefresh) States.setAutoRefresh(false);
}
function toggleAutoRefresh(onStateChange) {
  if (localState.autoRefreshEnabled) {
    stopAutoRefresh();
    showToast("Auto-refresh desativado", "info");
    tracker.autoRefreshToggle(false);
  } else {
    startAutoRefresh();
    showToast("Auto-refresh ativado", "success");
  }
  if (onStateChange) onStateChange();
  return localState.autoRefreshEnabled;
}
var auto_refresh_default = { startAutoRefresh, stopAutoRefresh, toggleAutoRefresh };
const MODULE_ID = "panels-panel-session-admin-core-auto-refresh";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  const running = !!localState.autoRefreshInterval;
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { autoRefreshReady: true, autoRefreshEnabled: localState.autoRefreshEnabled, running, visibilityGated: true } };
}
export {
  MODULE_ID,
  VERSION,
  auto_refresh_default as default,
  healthCheck,
  info,
  startAutoRefresh,
  stopAutoRefresh,
  toggleAutoRefresh
};
