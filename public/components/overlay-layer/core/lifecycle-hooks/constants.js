const VERSION = "1.0.0";
const MODULE_ID = "overlay-layer-lifecycle-hooks";
const HOOK_TYPES = [
  "beforeOpen",
  "afterOpen",
  "beforeClose",
  "afterClose",
  "beforeUpdate",
  "afterUpdate",
  "beforeCloseAll",
  "afterCloseAll",
  "beforeCloseMany",
  "afterCloseMany"
];
const DEFAULT_CONFIG = {
  enabled: true,
  asyncHooks: true,
  timeoutMs: 5e3,
  continueOnError: true,
  logErrors: true
};
export {
  DEFAULT_CONFIG,
  HOOK_TYPES,
  MODULE_ID,
  VERSION
};
