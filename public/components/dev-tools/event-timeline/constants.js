const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "dev-tools-event-timeline-constants";
const MAX_EVENTS = 1e3;
const TIMELINE_COLORS = Object.freeze({ info: "#3b82f6", warn: "#f59e0b", error: "#ef4444", debug: "#8b5cf6" });
const EVENT_TYPES = Object.freeze({ USER: "user", SYSTEM: "system", NETWORK: "network", DOM: "dom" });
function healthCheck() {
  return { status: "HEALTHY", score: "1/1", checks: { available: true }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, constants: { MAX_EVENTS, eventTypes: Object.keys(EVENT_TYPES) }, timestamp: Date.now() };
}
const TIMELINE_STATES = Object.freeze({ IDLE: "idle", RECORDING: "recording", PAUSED: "paused", REPLAYING: "replaying" });
const DEFAULT_OPTIONS = Object.freeze({ maxEvents: 1e3, autoRecord: true });
var constants_default = { MAX_EVENTS, TIMELINE_COLORS, EVENT_TYPES, healthCheck, info, VERSION, MODULE_ID };
export {
  DEFAULT_OPTIONS,
  EVENT_TYPES,
  MAX_EVENTS,
  MODULE_ID,
  TIMELINE_COLORS,
  TIMELINE_STATES,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
