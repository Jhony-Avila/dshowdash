import { emitUIAction } from "../../_shared/event-helpers.js";
import { addListener, addKeyboardListener } from "../../_shared/listener-helpers.js";
import { BUTTON_CONFIG, ACTION_PAYLOAD } from "../contracts.js";
const MODULE_ID = "footer-button-activity-events";
const VERSION = "1.1.0-ENTERPRISE";
let _metrics = { eventsAttached: 0, clicks: 0 };
function attachEvents(element, cleanups = [], onClickCallback = null) {
  if (!element) return;
  _metrics.eventsAttached++;
  const handleClick = (e) => {
    _metrics.clicks++;
    e?.preventDefault?.();
    emitUIAction(
      ACTION_PAYLOAD.actionId,
      MODULE_ID,
      {
        label: BUTTON_CONFIG.label,
        icon: BUTTON_CONFIG.icon,
        kind: BUTTON_CONFIG.kind,
        ...ACTION_PAYLOAD.meta
      }
    );
    if (typeof onClickCallback === "function") {
      onClickCallback(e);
    }
  };
  addListener(element, "click", handleClick, cleanups);
  addKeyboardListener(element, handleClick, cleanups);
  return cleanups;
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { eventsReady: true }, metrics: getMetrics() };
}
var events_default = { attachEvents, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  attachEvents,
  events_default as default,
  getMetrics,
  healthCheck,
  info
};
