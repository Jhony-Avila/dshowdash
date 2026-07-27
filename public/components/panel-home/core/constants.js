const PANEL_ID = "panel-home";
const MODULE_ID = "panel-home";
const VERSION = "1.1.0";
const CSS_PATH = "/components/panel-home/styles/panel-home.css";
const TIME_PERIODS = Object.freeze({
  DAWN: "dawn",
  // 05:00 - 05:59
  MORNING: "morning",
  // 06:00 - 11:59
  AFTERNOON: "afternoon",
  // 12:00 - 17:59
  EVENING: "evening",
  // 18:00 - 20:59
  NIGHT: "night"
  // 21:00 - 04:59
});
const MESSAGE_CATEGORIES = Object.freeze({
  TEMPORAL: "temporal",
  ACOLHIMENTO: "acolhimento",
  ACAO: "acao",
  CONTEXTO: "contexto",
  ESTADO: "estado",
  INSPIRACIONAL: "inspiracional",
  IDLE: "idle"
});
const PRIORITIES = Object.freeze({
  CRITICAL: 100,
  HIGH: 80,
  MEDIUM: 50,
  LOW: 20,
  MINIMAL: 10
});
const SYSTEM_STATES = Object.freeze({
  READY: "ready",
  LOADING: "loading",
  ERROR: "error",
  DEGRADED: "degraded",
  MAINTENANCE: "maintenance"
});
const PANEL_EVENTS = Object.freeze({
  MOUNTED: "panel-home:mounted",
  UNMOUNTED: "panel-home:unmounted",
  READY: "panel-home:ready",
  ERROR: "panel-home:error",
  MESSAGE_DISPLAYED: "panel-home:message:displayed",
  MESSAGE_NONE: "panel-home:message:none",
  MESSAGE_EMPTY: "panel-home:message:empty",
  REFRESH: "panel-home:refresh",
  CONTEXT_RESOLVED: "panel-home:context:resolved"
});
const DEFAULTS = Object.freeze({
  ANIMATION_DURATION: 400,
  MESSAGE_FADE_IN: 300,
  RETRY_DELAY: 5e3,
  MAX_RETRIES: 3
});
var constants_default = {
  PANEL_ID,
  MODULE_ID,
  VERSION,
  CSS_PATH,
  TIME_PERIODS,
  MESSAGE_CATEGORIES,
  PRIORITIES,
  SYSTEM_STATES,
  PANEL_EVENTS,
  DEFAULTS
};
export {
  CSS_PATH,
  DEFAULTS,
  MESSAGE_CATEGORIES,
  MODULE_ID,
  PANEL_EVENTS,
  PANEL_ID,
  PRIORITIES,
  SYSTEM_STATES,
  TIME_PERIODS,
  VERSION,
  constants_default as default
};
