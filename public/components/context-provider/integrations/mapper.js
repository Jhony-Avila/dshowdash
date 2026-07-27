import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { CORE_CONTEXTS } from "../core/registry.js";
import { integrationState } from "./state.js";
const MODULE_ID = "context-provider:mapper";
const VERSION = "5.4.0-P17WI";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function defaultGlobalStateMapper(state) {
  try {
    if (!state || typeof state !== "object") return state;
    const mapped = {};
    mapped[CORE_CONTEXTS.GLOBAL_STATE] = { session: state.session, navigation: state.navigation, preferences: state.preferences, ui: state.ui };
    if (state.session) {
      mapped[CORE_CONTEXTS.SESSION] = { authenticated: state.session.isAuthenticated || state.session.authenticated || false, user: state.session.user || null, token: state.session.token || null };
    }
    if (state.ui && state.ui.layout || state.layout) {
      mapped[CORE_CONTEXTS.LAYOUT] = { mode: state.ui && state.ui.layout && state.ui.layout.mode || state.layout && state.layout.mode || "default", breakpoint: state.ui && state.ui.layout && state.ui.layout.breakpoint || state.layout && state.layout.breakpoint || "desktop", compact: state.ui && state.ui.layout && state.ui.layout.compact || state.layout && state.layout.compact || false };
    }
    if (state.preferences && (state.preferences.language || state.preferences.locale)) {
      mapped[CORE_CONTEXTS.LOCALE] = { language: state.preferences.language || state.preferences.locale || "pt-BR", fallback: "en-US" };
    }
    if (state.session && state.session.user && state.session.user.roles || state.permissions) {
      mapped[CORE_CONTEXTS.PERMISSIONS] = { roles: state.session && state.session.user && state.session.user.roles || state.permissions && state.permissions.roles || [], capabilities: state.session && state.session.user && state.session.user.capabilities || state.permissions && state.permissions.capabilities || [] };
    }
    return mapped;
  } catch (error) {
    const logger = _getPort("logger");
    if (logger && logger.warn) logger.warn(`[${MODULE_ID}]`, "defaultGlobalStateMapper error:", error.message);
    return integrationState.lastValidGlobalState;
  }
}
function getMapper() {
  return integrationState.mapGlobalStateContext || defaultGlobalStateMapper;
}
function setMapper(mapper) {
  integrationState.mapGlobalStateContext = mapper;
}
function info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized };
}
function healthCheck() {
  const ps = Ports.snapshot();
  return { status: ps._initialized ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized };
}
var mapper_default = { defaultGlobalStateMapper, getMapper, setMapper, injectPorts, getPorts, info, healthCheck, MODULE_ID, VERSION };
export {
  MODULE_ID,
  VERSION,
  mapper_default as default,
  defaultGlobalStateMapper,
  getMapper,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  setMapper
};
