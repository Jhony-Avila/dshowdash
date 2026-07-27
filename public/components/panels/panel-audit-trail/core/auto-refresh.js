import * as Renderer from "../ui/renderer.js";
import { localState as _localState } from "./state.js";
import { AUTO_REFRESH_SECONDS } from "./constants.js";
const localState = _localState;
function startAutoRefresh(onRefresh) {
  if (!localState.autoRefreshEnabled) return;
  localState.countdown = AUTO_REFRESH_SECONDS;
  localState.countdownInterval = setInterval(() => {
    if (document.hidden) return;
    localState.countdown--;
    Renderer.setAutoRefreshState(true, localState.countdown);
    if (localState.countdown <= 0) {
      localState.countdown = AUTO_REFRESH_SECONDS;
      onRefresh?.(true);
    }
  }, 1e3);
  Renderer.setAutoRefreshState(true, localState.countdown);
}
function stopAutoRefresh() {
  if (localState.countdownInterval) {
    clearInterval(localState.countdownInterval);
    localState.countdownInterval = null;
  }
  Renderer.setAutoRefreshState(false, 0);
}
function toggleAutoRefresh(onRefresh) {
  localState.autoRefreshEnabled = !localState.autoRefreshEnabled;
  if (localState.autoRefreshEnabled) {
    startAutoRefresh(onRefresh);
    Renderer.toast("Auto-refresh ativado", "success");
  } else {
    stopAutoRefresh();
    Renderer.toast("Auto-refresh desativado", "info");
  }
}
var auto_refresh_default = { startAutoRefresh, stopAutoRefresh, toggleAutoRefresh };
const MODULE_ID = "panels-panel-audit-trail-core-auto-refresh";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { autoRefreshReady: true } };
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
