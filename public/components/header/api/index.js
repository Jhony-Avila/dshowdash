const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/api";
import { ResilientFetch, createFetchClient, fetchWithTimeout } from "./fetch.js";
import { HealthAPI } from "./health.js";
import { AlertsAPI } from "./alerts.js";
import * as APIFacade from "./api-facade.js";
const modules = ["fetch", "health", "alerts", "api-facade"];
function info() {
  return { version: VERSION, moduleId: MODULE_ID, modules, totalModules: modules.length };
}
var api_default = { VERSION, MODULE_ID, modules, info, APIFacade };
export {
  APIFacade,
  AlertsAPI,
  HealthAPI,
  MODULE_ID,
  ResilientFetch,
  VERSION,
  createFetchClient,
  api_default as default,
  fetchWithTimeout,
  info,
  modules
};
