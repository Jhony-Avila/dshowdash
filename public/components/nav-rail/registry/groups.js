const MODULE_ID = "navrail-registry-groups";
const VERSION = "5.0.0-FACTORY";
const GROUPS = [
  { id: "operations", label: "Opera\xE7\xF5es", order: 1 },
  { id: "analytics", label: "Analytics", order: 2 },
  { id: "data", label: "Dados", order: 3 },
  { id: "integrations", label: "Integra\xE7\xF5es", order: 4 },
  { id: "admin", label: "Admin", order: 5 },
  { id: "system", label: "Sistema", order: 99 }
];
function info() {
  return { moduleId: MODULE_ID, version: VERSION, groupCount: GROUPS.length };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { groupsLoaded: GROUPS.length > 0 } };
}
var groups_default = { GROUPS, MODULE_ID, VERSION, info, healthCheck };
export {
  GROUPS,
  MODULE_ID,
  VERSION,
  groups_default as default,
  healthCheck,
  info
};
