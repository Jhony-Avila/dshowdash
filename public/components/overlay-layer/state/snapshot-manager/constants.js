const VERSION = "1.0.0";
const MODULE_ID = "overlay-layer-snapshot-manager";
const SNAPSHOT_FORMAT_VERSION = "1.0.0";
const DEFAULT_CONFIG = Object.freeze({
  maxSnapshots: 10,
  includeMetrics: true,
  includeTimestamps: true,
  compressData: false
});
var constants_default = {
  VERSION,
  MODULE_ID,
  SNAPSHOT_FORMAT_VERSION,
  DEFAULT_CONFIG
};
export {
  DEFAULT_CONFIG,
  MODULE_ID,
  SNAPSHOT_FORMAT_VERSION,
  VERSION,
  constants_default as default
};
