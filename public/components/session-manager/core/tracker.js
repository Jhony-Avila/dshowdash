import { sessionStore } from "../state/store.js";
import { trackSessionEvent } from "../telemetry/tracker.js";
const SessionTracker = {
  _interval: null,
  startTracking() {
    if (this._interval) clearInterval(this._interval);
    sessionStore.setLastActivity(Date.now());
    this._interval = setInterval(() => sessionStore.setLastActivity(Date.now()), 6e4);
    trackSessionEvent("session:tracking:started");
  },
  stopTracking() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    trackSessionEvent("session:tracking:stopped");
  },
  updateActivity() {
    sessionStore.setLastActivity(Date.now());
  }
};
const MODULE_ID = "session-manager-core-tracker";
const VERSION = "5.0.0-BULLETPROOF";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  const tracking = !!SessionTracker._interval;
  return { status: tracking ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { ready: true, tracking } };
}
export {
  MODULE_ID,
  SessionTracker,
  VERSION,
  healthCheck,
  info
};
