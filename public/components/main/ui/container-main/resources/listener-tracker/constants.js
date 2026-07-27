const VERSION = "1.0.0-MODULAR";
const MODULE_ID = "container-main:listener-tracker";
const LISTENER_TYPES = Object.freeze({
  DOM: "dom",
  EVENTBUS: "eventbus",
  WINDOW: "window",
  DOCUMENT: "document",
  CUSTOM: "custom",
  OBSERVER: "observer",
  TIMER: "timer",
  INTERVAL: "interval",
  RAF: "raf"
});
const DEFAULT_LIMITS = Object.freeze({
  maxListenersPerPanel: 50,
  maxTimersPerPanel: 10,
  maxIntervalsPerPanel: 5,
  maxObserversPerPanel: 10,
  warnThreshold: 0.8
});
var constants_default = {
  VERSION,
  MODULE_ID,
  LISTENER_TYPES,
  DEFAULT_LIMITS
};
export {
  DEFAULT_LIMITS,
  LISTENER_TYPES,
  MODULE_ID,
  VERSION,
  constants_default as default
};
