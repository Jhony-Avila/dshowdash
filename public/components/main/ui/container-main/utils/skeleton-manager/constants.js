const VERSION = "1.0.0";
const MODULE_ID = "container-main:skeleton-manager";
const SKELETON_TYPES = Object.freeze({
  DASHBOARD: "dashboard",
  TABLE: "table",
  LIST: "list",
  PROFILE: "profile",
  FORM: "form",
  CARDS: "cards",
  CHART: "chart",
  GENERIC: "generic",
  CUSTOM: "custom"
});
const DELAY_VARIANTS = Object.freeze({
  INSTANT: "instant",
  NORMAL: "normal",
  SLOW: "slow"
});
var constants_default = {
  VERSION,
  MODULE_ID,
  SKELETON_TYPES,
  DELAY_VARIANTS
};
export {
  DELAY_VARIANTS,
  MODULE_ID,
  SKELETON_TYPES,
  VERSION,
  constants_default as default
};
