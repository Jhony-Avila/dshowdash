const VERSION = "10.0.0-INTEGRATED";
const MODULE_ID = "container-main:adaptive-kernel";
const KERNEL_STATES = Object.freeze({
  IDLE: "idle",
  INITIALIZING: "initializing",
  READY: "ready",
  RUNNING: "running",
  PAUSED: "paused",
  ERROR: "error",
  RESETTING: "resetting",
  DESTROYED: "destroyed"
});
var constants_default = { VERSION, MODULE_ID, KERNEL_STATES };
export {
  KERNEL_STATES,
  MODULE_ID,
  VERSION,
  constants_default as default
};
