import { createPerformanceAPI } from "./factory.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.performance-api.singleton";
let _instance = null;
function getPerformanceAPI(options = {}) {
  if (!_instance) {
    _instance = createPerformanceAPI(options);
  }
  return _instance;
}
function resetPerformanceAPI() {
  if (_instance) {
    _instance.reset();
    _instance = null;
  }
}
export {
  MODULE_ID,
  VERSION,
  getPerformanceAPI,
  resetPerformanceAPI
};
