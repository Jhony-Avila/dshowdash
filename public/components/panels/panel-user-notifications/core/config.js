const MODULE_ID = "panel-user-notifications.core.config";
const VERSION = "9.3.0-P2-ENTERPRISE";
const CONFIG = {
  panelId: "panel-user-notifications",
  apiEndpoint: "/api/v1/notifications",
  refreshInterval: 15e3,
  maxNotifications: 100,
  defaultPageSize: 20,
  features: {
    autoRefresh: true,
    markAsRead: true,
    bulkActions: true,
    filtering: true
  },
  types: {
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    SUCCESS: "success"
  }
};
var config_default = CONFIG;
export {
  CONFIG,
  MODULE_ID,
  VERSION,
  config_default as default
};
