const VERSION = "13.0.0-PHASE7";
const MODULE_ID = "container-main:bootstrap.config.states";
const BOOTSTRAP_STATES = Object.freeze({
  IDLE: "idle",
  BOOTING: "booting",
  PHASE1_READY: "phase1-ready",
  PHASE2_READY: "phase2-ready",
  PHASE3_READY: "phase3-ready",
  PHASE4_READY: "phase4-ready",
  PHASE5_READY: "phase5-ready",
  PHASE6_READY: "phase6-ready",
  PHASE7_READY: "phase7-ready",
  KERNEL_READY: "kernel-ready",
  COMPONENTS_READY: "components-ready",
  PLUGINS_READY: "plugins-ready",
  RUNNING: "running",
  ERROR: "error",
  SHUTDOWN: "shutdown"
});
var states_default = { VERSION, MODULE_ID, BOOTSTRAP_STATES };
export {
  BOOTSTRAP_STATES,
  MODULE_ID,
  VERSION,
  states_default as default
};
