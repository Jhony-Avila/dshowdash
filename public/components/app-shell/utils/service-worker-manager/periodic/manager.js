import { getConfig, getCheckIntervalId, setCheckIntervalId } from "../state.js";
import { checkForUpdates } from "../updates/manager.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.service-worker-manager.periodic.manager";
function startPeriodicCheck(interval) {
  stopPeriodicCheck();
  const config = getConfig();
  interval = interval || config.checkInterval;
  setCheckIntervalId(setInterval(() => {
    checkForUpdates();
  }, interval));
  return { ok: true, interval };
}
function stopPeriodicCheck() {
  const id = getCheckIntervalId();
  if (id) {
    clearInterval(id);
    setCheckIntervalId(null);
  }
}
export {
  MODULE_ID,
  VERSION,
  startPeriodicCheck,
  stopPeriodicCheck
};
