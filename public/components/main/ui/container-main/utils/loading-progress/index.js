import { VERSION, MODULE_ID, LOADING_STATES } from "./constants.js";
import { createLoadingProgress } from "./manager.js";
import {
  getLoadingProgress,
  resetLoadingProgress,
  startLoading,
  doneLoading,
  setLoadingProgress,
  isLoading,
  info,
  healthCheck
} from "./api.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, LOADING_STATES as LOADING_STATES2 } from "./constants.js";
import { createLoadingProgress as createLoadingProgress2 } from "./manager.js";
import {
  getLoadingProgress as getLoadingProgress2,
  resetLoadingProgress as resetLoadingProgress2,
  startLoading as startLoading2,
  doneLoading as doneLoading2,
  setLoadingProgress as setLoadingProgress2,
  isLoading as isLoading2,
  info as info2,
  healthCheck as healthCheck2
} from "./api.js";
var loading_progress_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  LOADING_STATES: LOADING_STATES2,
  createLoadingProgress: createLoadingProgress2,
  getLoadingProgress: getLoadingProgress2,
  resetLoadingProgress: resetLoadingProgress2,
  startLoading: startLoading2,
  doneLoading: doneLoading2,
  setLoadingProgress: setLoadingProgress2,
  isLoading: isLoading2,
  info: info2,
  healthCheck: healthCheck2
};
export {
  LOADING_STATES,
  MODULE_ID,
  VERSION,
  createLoadingProgress,
  loading_progress_default as default,
  doneLoading,
  getLoadingProgress,
  healthCheck,
  info,
  isLoading,
  resetLoadingProgress,
  setLoadingProgress,
  startLoading
};
