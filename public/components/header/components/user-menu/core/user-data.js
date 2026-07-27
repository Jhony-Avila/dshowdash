import { StateValidators } from "../state/validators.js";
import { Formatters } from "../utils/formatters.js";
import { emitUIAction } from "./actions.js";
import { getPort, getHardNavService } from "./ports.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
import { COMPONENT_EVENTS } from "/core/runtime/events/catalog/component.events.js";
const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "header/components/user-menu/core/user-data";
const COMPONENT_MODULE_ID = "header/components/user-menu";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
function normalizeUser(raw) {
  if (!raw) return null;
  return {
    // @ts-expect-error TS migration - TS2339
    id: raw.id,
    // @ts-expect-error TS migration - TS2339
    name: raw.name || raw.full_name || "Usu\xE1rio",
    // @ts-expect-error TS migration - TS2339
    fullName: raw.full_name || raw.name,
    // @ts-expect-error TS migration - TS2339
    email: raw.email,
    // @ts-expect-error TS migration - TS2339
    avatar: raw.avatar_url || raw.avatar,
    // @ts-expect-error TS migration - TS2339
    avatar_url: raw.avatar_url || raw.avatar,
    // @ts-expect-error TS migration - TS2339
    role: raw.role || "user",
    // @ts-expect-error TS migration - TS2339
    roleDisplay: Formatters.formatRole(raw.role),
    // @ts-expect-error TS migration - TS2339
    funcao: raw.funcao,
    // @ts-expect-error TS migration - TS2339
    departamento: raw.departamento
  };
}
function initialFetch(component) {
  if (component.isDestroyed) return Promise.resolve();
  component._metrics.fetchCount++;
  return component.circuitBreaker.execute(() => component.api.fetchCurrentUser()).then((user) => {
    if (component.isDestroyed) return;
    if (user) {
      try {
        StateValidators.validateUser(user);
      } catch (e) {
        component._log("warn", "User validation warning:", e.message);
      }
      component.store.setState({
        user: normalizeUser(user),
        status: "ok"
      });
      component._log("debug", "Usu\xE1rio carregado:", user.name);
    } else {
      component.store.setState({ user: null, status: "guest" });
      component._log("debug", "Nenhum usu\xE1rio autenticado");
    }
  }).catch((error) => {
    if (component.isDestroyed) return;
    component.store.setState({ user: null, status: "error" });
    component._log("warn", `Erro no fetch (Circuit Breaker state: ${component.circuitBreaker.getState()}):`, error);
  });
}
function setUser(component, userData) {
  if (component.isDestroyed) return;
  component._metrics.setUserCount++;
  component._metrics.lastSetUserAt = Date.now();
  if (userData) {
    try {
      StateValidators.validateUser(userData);
    } catch (e) {
      component._log("warn", "User validation warning:", e.message);
    }
    component.store.setState({
      user: normalizeUser(userData),
      status: "ok"
    });
    component._log("info", "Estado atualizado via setUser:", userData.name);
    component._announce(`Usu\xE1rio atualizado: ${userData.name || "Usu\xE1rio"}`);
    const eb = getPort("eventBus");
    if (eb && eb.emit) {
      eb.emit(COMPONENT_EVENTS.DATA_UPDATED, {
        // @ts-expect-error TS migration - TS2339
        componentId: component.constructor._exportId || "user-menu",
        moduleId: COMPONENT_MODULE_ID,
        data: { user: userData },
        timestamp: Date.now()
      });
    }
  } else {
    component.store.setState({ user: null, status: "guest" });
    component._log("info", "Estado atualizado: guest");
  }
}
function clearUser(component) {
  setUser(component, null);
}
function handleLogout(component) {
  if (component.isDestroyed) return Promise.resolve();
  component._announce("Saindo da conta...");
  emitUIAction("logout", { confirmed: true });
  const eb = getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(UI_EVENTS.ACTION, {
      action: "logout",
      source: COMPONENT_MODULE_ID,
      timestamp: Date.now()
    });
  }
  return component.circuitBreaker.execute(() => component.api.logout()).then(() => {
    clearUser(component);
    const hns = getHardNavService();
    hns.redirect("/login", "logout", COMPONENT_MODULE_ID);
  }).catch((error) => {
    component._log("error", "Erro logout:", error);
    component._announce("Erro ao sair. Tente novamente.");
  });
}
function healthCheck() {
  const checks = { ready: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 1 ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: 1,
    scoreDisplay: `${passed}/1`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    healthCheck: healthCheck()
  };
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getLogs() {
  return [..._logBuffer];
}
export {
  MODULE_ID,
  VERSION,
  clearUser,
  getLogs,
  handleLogout,
  healthCheck,
  info,
  initialFetch,
  normalizeUser,
  setDebug,
  setUser
};
