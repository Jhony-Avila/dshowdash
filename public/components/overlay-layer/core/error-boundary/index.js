import { VERSION, MODULE_ID, ERROR_TYPES, SEVERITY } from "./constants.js";
import { inject } from "./helpers/logger.js";
import { capture } from "./boundary/capture.js";
import { boundary, boundarySync } from "./boundary/wrappers.js";
import { registerRecoveryStrategy, removeRecoveryStrategy } from "./recovery/strategies.js";
import { getErrors, getErrorsByType, getErrorsBySeverity, getUnrecoveredErrors, getLastError } from "./queries.js";
import { clearError, clearErrors, cleanExpired, onError, clearHandlers } from "./operations.js";
import { getStats, configure, getConfig, healthCheck, info } from "./api.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, ERROR_TYPES as ERROR_TYPES2, SEVERITY as SEVERITY2 } from "./constants.js";
import { inject as inject2 } from "./helpers/logger.js";
import { capture as capture2 } from "./boundary/capture.js";
import { boundary as boundary2, boundarySync as boundarySync2 } from "./boundary/wrappers.js";
import { registerRecoveryStrategy as registerRecoveryStrategy2, removeRecoveryStrategy as removeRecoveryStrategy2 } from "./recovery/strategies.js";
import { getErrors as getErrors2, getErrorsByType as getErrorsByType2, getErrorsBySeverity as getErrorsBySeverity2, getUnrecoveredErrors as getUnrecoveredErrors2, getLastError as getLastError2 } from "./queries.js";
import { clearError as clearError2, clearErrors as clearErrors2, cleanExpired as cleanExpired2, onError as onError2, clearHandlers as clearHandlers2 } from "./operations.js";
import { getStats as getStats2, configure as configure2, getConfig as getConfig2, healthCheck as healthCheck2, info as info2 } from "./api.js";
var error_boundary_default = {
  inject: inject2,
  capture: capture2,
  registerRecoveryStrategy: registerRecoveryStrategy2,
  removeRecoveryStrategy: removeRecoveryStrategy2,
  onError: onError2,
  clearHandlers: clearHandlers2,
  boundary: boundary2,
  boundarySync: boundarySync2,
  getErrors: getErrors2,
  getErrorsByType: getErrorsByType2,
  getErrorsBySeverity: getErrorsBySeverity2,
  getUnrecoveredErrors: getUnrecoveredErrors2,
  getLastError: getLastError2,
  clearError: clearError2,
  clearErrors: clearErrors2,
  cleanExpired: cleanExpired2,
  getStats: getStats2,
  configure: configure2,
  getConfig: getConfig2,
  healthCheck: healthCheck2,
  info: info2,
  ERROR_TYPES: ERROR_TYPES2,
  SEVERITY: SEVERITY2,
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2
};
export {
  ERROR_TYPES,
  MODULE_ID,
  SEVERITY,
  VERSION,
  boundary,
  boundarySync,
  capture,
  cleanExpired,
  clearError,
  clearErrors,
  clearHandlers,
  configure,
  error_boundary_default as default,
  getConfig,
  getErrors,
  getErrorsBySeverity,
  getErrorsByType,
  getLastError,
  getStats,
  getUnrecoveredErrors,
  healthCheck,
  info,
  inject,
  onError,
  registerRecoveryStrategy,
  removeRecoveryStrategy
};
