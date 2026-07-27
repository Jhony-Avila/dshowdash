const VERSION = "1.0.0-MODULAR";
const MODULE_ID = "container-main:event-recorder";
const RECORDER_STATES = Object.freeze({
  IDLE: "idle",
  RECORDING: "recording",
  PAUSED: "paused",
  REPLAYING: "replaying"
});
const EVENT_TYPES = Object.freeze({
  EVENTBUS: "eventbus",
  DOM: "dom",
  NETWORK: "network",
  STATE: "state",
  USER: "user",
  CUSTOM: "custom"
});
var constants_default = {
  VERSION,
  MODULE_ID,
  RECORDER_STATES,
  EVENT_TYPES
};
export {
  EVENT_TYPES,
  MODULE_ID,
  RECORDER_STATES,
  VERSION,
  constants_default as default
};
