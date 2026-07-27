const VERSION = "9.3.0-P2-ENTERPRISE";
import { createModuleFetch } from "../../_shared/api/fetch-base.js";
const MODULE_ID = "panels/panel-integration-loja-integrada/api/fetch";
const _mod = createModuleFetch(MODULE_ID);
const { request, get, post, configure, healthCheck, info, getMetrics, resetMetrics } = _mod;
var fetch_default = { request, get, post, configure, healthCheck, info, getMetrics, resetMetrics, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  configure,
  fetch_default as default,
  get,
  getMetrics,
  healthCheck,
  info,
  post,
  request,
  resetMetrics
};
