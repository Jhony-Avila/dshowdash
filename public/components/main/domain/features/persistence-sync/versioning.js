import { VERSION, STATE_VERSION, STORAGE_KEYS } from "./constants.js";
import { createLogger } from "/assets/js/core/logger-global/index.js";
import { metrics } from "./state.js";
const MODULE_ID = "main.domain.features.persistence-sync.versioning";
const _logger = createLogger("PersistenceSync");
let _logLevel = 1;
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3, none: 99 };
function _log(level, msg) {
  const levelNum = LOG_LEVELS[level] || 1;
  if (levelNum < _logLevel) return;
  if (level === "warn") _logger.warn(msg);
  else if (level === "error") _logger.error(msg);
  else if (level === "debug") _logger.debug(msg);
  else _logger.info(msg);
}
function setLogLevel(level) {
  if (typeof level === "string") {
    _logLevel = LOG_LEVELS[level] !== void 0 ? LOG_LEVELS[level] : 1;
  } else if (typeof level === "number") {
    _logLevel = level;
  }
  return _logLevel;
}
function wrapWithVersion(data) {
  return {
    _version: STATE_VERSION,
    _savedAt: Date.now(),
    _moduleVersion: VERSION,
    data
  };
}
function unwrapVersioned(wrapped) {
  if (!wrapped) return { data: null, needsMigration: false };
  if (wrapped._version === void 0) {
    return { data: wrapped, needsMigration: true, fromVersion: 0 };
  }
  if (wrapped._version !== STATE_VERSION) {
    return {
      // @ts-expect-error TS migration - TS2339
      data: wrapped.data,
      needsMigration: true,
      // @ts-expect-error TS migration - TS2339
      fromVersion: wrapped._version
    };
  }
  return { data: wrapped.data, needsMigration: false };
}
function migrateData(data, fromVersion, key) {
  let migrated = data;
  if (fromVersion === 0 || fromVersion === void 0) {
    migrated = data;
  }
  if (fromVersion === 1) {
    if (key === STORAGE_KEYS.NAVIGATION_STATE && migrated) {
      migrated.migratedAt = Date.now();
    }
  }
  metrics.migrations++;
  _log("info", `Migrated data from v${fromVersion} to v${STATE_VERSION}`);
  return migrated;
}
export {
  MODULE_ID,
  migrateData,
  setLogLevel,
  unwrapVersioned,
  wrapWithVersion
};
