const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "header/components/user-menu/utils/formatters";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class Formatters {
  static formatUserName(user) {
    if (!user || !user.name) return "Usu\xE1rio";
    return user.name;
  }
  static formatRole(role) {
    const roleMap = { admin: "Administrador", user: "Usu\xE1rio", viewer: "Visualizador", superadmin: "Super Admin" };
    return roleMap[role] || role || "Usu\xE1rio";
  }
  static formatLastLogin(date) {
    if (!date) return "Nunca";
    const d = new Date(date);
    return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  static healthCheck() {
    const checks = { ready: true };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 1 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 1, scoreDisplay: `${passed}/1`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  static info() {
    return { version: VERSION, moduleId: MODULE_ID, healthCheck: this.healthCheck() };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [..._logBuffer];
  }
}
function setDebug(enabled) {
  _debug = !!enabled;
}
var formatters_default = Formatters;
export {
  Formatters,
  MODULE_ID,
  VERSION,
  formatters_default as default,
  setDebug
};
