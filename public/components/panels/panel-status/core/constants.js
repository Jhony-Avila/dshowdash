const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-status";
const PANEL_ID = "panel-status";
const REFRESH_INTERVAL = 3e4;
const STATUS_LEVELS = Object.freeze({ OK: "ok", WARNING: "warning", ERROR: "error", UNKNOWN: "unknown" });
const STATUS_TYPES = Object.freeze({
  "status-database": { icon: "database", label: "Database", color: "#10B981", api: "/api/status/database" },
  "status-server": { icon: "server", label: "Servidor", color: "#3B82F6", api: "/api/status/server" },
  "status-cloud": { icon: "cloud", label: "Cloud", color: "#8B5CF6", api: "/api/status/cloud" },
  "status-cpu": { icon: "cpu", label: "CPU", color: "#F59E0B", api: "/api/status/cpu" },
  "status-memory": { icon: "hard-drive", label: "Mem\xF3ria", color: "#EF4444", api: "/api/status/memory" },
  "status-disk": { icon: "hard-drive", label: "Disco", color: "#6366F1", api: "/api/status/disk" },
  "status-wifi": { icon: "wifi", label: "Rede", color: "#14B8A6", api: "/api/status/network" },
  "status-activity": { icon: "activity", label: "Atividade", color: "#F97316", api: "/api/status/activity" }
});
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var constants_default = { VERSION, MODULE_ID, PANEL_ID, REFRESH_INTERVAL, STATUS_LEVELS, STATUS_TYPES };
export {
  MODULE_ID,
  PANEL_ID,
  REFRESH_INTERVAL,
  STATUS_LEVELS,
  STATUS_TYPES,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
