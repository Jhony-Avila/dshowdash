const MODULE_ID = "components._shared.permissions.config";
const VERSION = "1.1.0-P2-ENTERPRISE";
const PermissionsConfig = {
  mode: "uarps-first",
  debug: false,
  silentMode: true,
  cache: { enabled: true, ttl: 3e5, maxSize: 1e3 },
  sync: { enabled: true, interval: 6e4, endpoint: "/api/permissions/uarps.php" },
  uiFeedback: { enabled: true, mode: "disable", showTooltips: true },
  migrationBridge: { enabled: true, mode: "uarps-first", logDecisions: false },
  fallback: { useRoles: true, defaultDeny: false },
  version: VERSION,
  lastMigration: "2025-12-23T03:45:00Z"
};
if (typeof window !== "undefined") window.PermissionsConfig = PermissionsConfig;
var config_default = PermissionsConfig;
function info() {
  return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true }, timestamp: Date.now() };
}
export {
  MODULE_ID,
  VERSION,
  config_default as default,
  healthCheck,
  info
};
