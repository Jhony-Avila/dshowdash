const VERSION = "1.0.0-ELEVATION";
const MODULE_ID = "overlay-kernel:runtime-integration";
const VALID_MODES = Object.freeze([
  "NORMAL",
  "DEGRADED",
  "MAINTENANCE",
  "RECOVERY",
  "FAILED",
  "INITIALIZING"
]);
var constants_default = {
  VERSION,
  MODULE_ID,
  VALID_MODES
};
export {
  MODULE_ID,
  VALID_MODES,
  VERSION,
  constants_default as default
};
