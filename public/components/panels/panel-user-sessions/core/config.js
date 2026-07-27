const MODULE_ID = "panel-user-sessions.core.config";
const VERSION = "9.3.0-P2-ENTERPRISE";
const CONFIG = {
  panelId: "panel-user-sessions",
  apiEndpoint: "/api/v1/sessions",
  refreshInterval: 3e4,
  maxSessions: 100,
  defaultPageSize: 20,
  features: {
    autoRefresh: true,
    export: true,
    filtering: true,
    sorting: true
  },
  columns: [
    { key: "id", label: "ID", sortable: true },
    { key: "user", label: "Usu\xE1rio", sortable: true },
    { key: "device", label: "Dispositivo", sortable: true },
    { key: "ip", label: "IP", sortable: true },
    { key: "startedAt", label: "In\xEDcio", sortable: true },
    { key: "lastActivity", label: "\xDAltima Atividade", sortable: true },
    { key: "status", label: "Status", sortable: true }
  ]
};
var config_default = CONFIG;
export {
  CONFIG,
  MODULE_ID,
  VERSION,
  config_default as default
};
