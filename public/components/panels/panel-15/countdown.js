import { updateCountdown, setAutoRefreshState } from "./core/template.js";
import { log } from "./ports.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-15:countdown";
const REFRESH_INTERVAL = 30;
function startCountdown(panel) {
  stopCountdown(panel);
  panel.countdownValue = REFRESH_INTERVAL;
  updateCountdown(panel.container, panel.countdownValue);
  panel.countdownInterval = setInterval(() => {
    if (typeof document !== "undefined" && document.hidden) return;  // aba oculta: nao conta nem busca
    if (!panel.autoRefreshEnabled) return;
    panel.countdownValue;
    panel.countdownValue = panel.countdownValue - 1;
    updateCountdown(panel.container, panel.countdownValue);
    if (panel.countdownValue <= 0) {
      panel.countdownValue = REFRESH_INTERVAL;
      if (panel.dataLoader) panel.dataLoader.loadData();
    }
  }, 1e3);
}
function stopCountdown(panel) {
  if (panel.countdownInterval) {
    clearInterval(panel.countdownInterval);
    panel.countdownInterval = null;
  }
}
function toggleAutoRefresh(panel) {
  panel.autoRefreshEnabled = !panel.autoRefreshEnabled;
  setAutoRefreshState(panel.container, panel.autoRefreshEnabled);
  if (panel.autoRefreshEnabled) {
    panel.countdownValue = REFRESH_INTERVAL;
    updateCountdown(panel.container, panel.countdownValue);
  }
  log("info", "auto-refresh.toggled", { enabled: panel.autoRefreshEnabled });
}
function pause(panel) {
  panel.autoRefreshEnabled = false;
  setAutoRefreshState(panel.container, false);
}
function resume(panel) {
  panel.autoRefreshEnabled = true;
  setAutoRefreshState(panel.container, true);
  panel.countdownValue = REFRESH_INTERVAL;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, refreshInterval: REFRESH_INTERVAL };
}
var countdown_default = { startCountdown, stopCountdown, toggleAutoRefresh, pause, resume, REFRESH_INTERVAL };
export {
  MODULE_ID,
  REFRESH_INTERVAL,
  VERSION,
  countdown_default as default,
  info,
  pause,
  resume,
  startCountdown,
  stopCountdown,
  toggleAutoRefresh
};
