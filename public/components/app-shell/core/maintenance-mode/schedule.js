import { scheduledMaintenance } from "./state.js";
import { activate } from "./core.js";
import { notifySubscribers } from "./subscription.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.maintenance-mode.schedule";
function schedule(options) {
  if (!options.startAt) {
    return { ok: false, error: "startAt required" };
  }
  const startIn = options.startAt - Date.now();
  if (startIn <= 0) {
    return activate(options);
  }
  scheduledMaintenance.value = {
    options,
    scheduledFor: options.startAt,
    timer: setTimeout(() => {
      activate(options);
      scheduledMaintenance.value = null;
    }, startIn)
  };
  notifySubscribers({
    type: "scheduled",
    scheduledFor: options.startAt,
    timestamp: Date.now()
  });
  return { ok: true, scheduledFor: options.startAt };
}
function cancelScheduled() {
  if (!scheduledMaintenance.value) {
    return { ok: false, error: "Nothing scheduled" };
  }
  clearTimeout(scheduledMaintenance.value.timer);
  scheduledMaintenance.value = null;
  notifySubscribers({
    type: "schedule-cancelled",
    timestamp: Date.now()
  });
  return { ok: true };
}
function getScheduled() {
  if (!scheduledMaintenance.value) return null;
  return {
    scheduledFor: scheduledMaintenance.value.scheduledFor,
    options: scheduledMaintenance.value.options
  };
}
export {
  MODULE_ID,
  VERSION,
  cancelScheduled,
  getScheduled,
  schedule
};
