import { TABS, TIME_PRESETS, SEVERITY, MODULES } from "../core/contracts.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-audit-trail-template";
const CSS_PREFIX = "pat";
const COLUMNS = {
  [TABS.AUDIT]: [
    { key: "created_at", label: "Data/Hora", sortable: true, visible: true, filterable: false },
    { key: "username", label: "Usu\xE1rio", sortable: true, visible: true, filterable: true, filterType: "text" },
    { key: "action_type", label: "A\xE7\xE3o", sortable: true, visible: true, filterable: true, filterType: "select", filterOptions: ["CREATE", "UPDATE", "DELETE", "VIEW", "LOGIN", "LOGOUT"] },
    { key: "resource_type", label: "Recurso", sortable: false, visible: true, filterable: true, filterType: "text" },
    { key: "module", label: "M\xF3dulo", sortable: true, visible: true, filterable: true, filterType: "select", filterOptions: ["auth", "users", "permissions", "settings", "dashboard", "api"] },
    { key: "actions", label: "", sortable: false, visible: true, filterable: false }
  ],
  [TABS.PERMISSIONS]: [
    { key: "created_at", label: "Data/Hora", sortable: true, visible: true, filterable: false },
    { key: "username", label: "Usu\xE1rio", sortable: true, visible: true, filterable: true, filterType: "text" },
    { key: "permission_key", label: "Permiss\xE3o", sortable: true, visible: true, filterable: true, filterType: "text" },
    { key: "action", label: "A\xE7\xE3o", sortable: true, visible: true, filterable: true, filterType: "select", filterOptions: ["GRANT", "REVOKE", "CHECK"] },
    { key: "resource_type", label: "Recurso", sortable: false, visible: true, filterable: true, filterType: "text" },
    { key: "ip_address", label: "IP", sortable: false, visible: true, filterable: true, filterType: "text" },
    { key: "actions", label: "", sortable: false, visible: true, filterable: false }
  ],
  [TABS.FRONTEND]: [
    { key: "created_at", label: "Data/Hora", sortable: true, visible: true, filterable: false },
    { key: "log_level", label: "N\xEDvel", sortable: true, visible: true, filterable: true, filterType: "select", filterOptions: ["error", "warn", "warning", "info", "debug"] },
    { key: "logger_name", label: "Logger", sortable: true, visible: true, filterable: true, filterType: "text" },
    { key: "message", label: "Mensagem", sortable: false, visible: true, filterable: true, filterType: "text" },
    { key: "page_url", label: "URL", sortable: false, visible: true, filterable: true, filterType: "text" },
    { key: "actions", label: "", sortable: false, visible: true, filterable: false }
  ],
  [TABS.SECURITY]: [
    { key: "created_at", label: "Data/Hora", sortable: true, visible: true, filterable: false },
    { key: "severity", label: "Severidade", sortable: true, visible: true, filterable: true, filterType: "select", filterOptions: ["critical", "high", "medium", "low", "info"] },
    { key: "event_type", label: "Tipo", sortable: true, visible: true, filterable: true, filterType: "select", filterOptions: ["LOGIN_FAILED", "SUSPICIOUS_ACTIVITY", "PERMISSION_DENIED", "RATE_LIMIT", "CSRF_VIOLATION"] },
    { key: "username", label: "Usu\xE1rio", sortable: true, visible: true, filterable: true, filterType: "text" },
    { key: "resource", label: "Recurso", sortable: false, visible: true, filterable: true, filterType: "text" },
    { key: "details", label: "Detalhes", sortable: false, visible: true, filterable: false },
    { key: "actions", label: "", sortable: false, visible: true, filterable: false }
  ]
};
var template_constants_default = { VERSION, MODULE_ID, CSS_PREFIX, COLUMNS, TABS, TIME_PRESETS };
export {
  COLUMNS,
  CSS_PREFIX,
  MODULES,
  MODULE_ID,
  SEVERITY,
  TABS,
  TIME_PRESETS,
  VERSION,
  template_constants_default as default
};
