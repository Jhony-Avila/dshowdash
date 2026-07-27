const MODULE_ID = "panel-13.core.config";
const VERSION = "9.3.0-P2-ENTERPRISE";
const CONFIG = {
  panelId: "panel-13",
  apiEndpoint: "/api/v1/panel-13",
  refreshInterval: 3e4,
  maxItems: 100,
  defaultPageSize: 20,
  features: {
    autoRefresh: true,
    export: true,
    filtering: true,
    sorting: true
  }
};
function getConfig(key) {
  return key ? CONFIG[key] : CONFIG;
}
var config_default = CONFIG;
export {
  CONFIG,
  MODULE_ID,
  VERSION,
  config_default as default,
  getConfig
};
