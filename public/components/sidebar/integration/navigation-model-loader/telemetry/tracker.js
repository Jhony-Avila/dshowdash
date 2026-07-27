import { MODULE_ID, VERSION } from "../core/constants.js";
const getGlobalTelemetry = () => window.DShow?.telemetry || window.telemetry || null;
const track = (event, data = {}) => {
  const telemetry = getGlobalTelemetry();
  const payload = {
    module: MODULE_ID,
    version: VERSION,
    event: `${MODULE_ID}:${event}`,
    timestamp: Date.now(),
    ...data
  };
  if (telemetry?.track) {
    try {
      telemetry.track(payload.event, payload);
    } catch (e) {
    }
  }
  if (window.DShow?.debug || window.DEBUG_NAV_LOADER) {
    console.debug(`[${MODULE_ID}]`, event, data);
  }
};
const trackLoad = (source, duration, success = true) => {
  track("load:complete", {
    source,
    duration,
    success
  });
};
const trackError = (error, context = {}) => {
  track("error", {
    error: error?.message || String(error),
    stack: error?.stack?.substring(0, 200),
    ...context
  });
};
const trackCache = (action, hit = false) => {
  track(`cache:${action}`, { hit });
};
export {
  track,
  trackCache,
  trackError,
  trackLoad
};
