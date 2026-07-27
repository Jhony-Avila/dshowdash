const VERSION = "1.0.0";
const MODULE_ID = "overlay-kernel-pending-queue";
const DEFAULT_CONFIG = {
  enabled: true,
  maxSize: 20,
  maxAge: 6e4,
  autoProcess: true,
  processInterval: 5e3,
  processOnModeChange: true,
  retryLimit: 3
};
export {
  DEFAULT_CONFIG,
  MODULE_ID,
  VERSION
};
