const VERSION = "6.0.0-P0-AUTH-OWNERSHIP";
const MODULE_ID = "header/core/header-events";
const TELEMETRY_ACTIONS = Object.freeze({
  HEADER: {
    REFRESH_DONE: "header:refresh:done",
    DEGRADED: "header:degraded"
  }
});
export {
  MODULE_ID,
  TELEMETRY_ACTIONS,
  VERSION
};
