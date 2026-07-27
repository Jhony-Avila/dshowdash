import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { createResolvedRoute } from "./route-factory.js";
const VERSION = "1.1.0-P17WI";
const MODULE_ID = "router.core.legacy-inference";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const knownPatterns = [/^status-/, /^meu-perfil$/, /^preferencias$/, /^seguranca$/, /^sessoes$/];
function isKnownDynamicPattern(path) {
  const cleanPath = path.replace(/^\//, "");
  return knownPatterns.some((p) => p.test(cleanPath));
}
function inferDynamicRoute(path) {
  const cleanPath = path.replace(/^\//, "");
  let panel = "panel-status";
  let page = "panel-status";
  let title = cleanPath.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  if (cleanPath === "meu-perfil") {
    panel = "panel-profile";
    page = "panel-profile";
    title = "Meu Perfil";
  } else if (cleanPath === "preferencias") {
    panel = "panel-preferences";
    page = "panel-preferences";
    title = "Prefer\xEAncias";
  } else if (cleanPath === "seguranca") {
    panel = "panel-security";
    page = "panel-security";
    title = "Seguran\xE7a";
  } else if (cleanPath === "sessoes") {
    panel = "panel-sessions";
    page = "panel-sessions";
    title = "Sess\xF5es";
  } else if (cleanPath.startsWith("status-")) {
    title = `Status: ${cleanPath.replace("status-", "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`;
  }
  const config = { page, title, public: false, requiresAuth: true, permissions: [], featureFlags: [], layout: "default", defaultHash: `#/${cleanPath}`, id: `inferred-${cleanPath}`, name: cleanPath, defaultView: panel, virtualDefaults: { view: panel, tab: "overview", section: null, entity: null, mode: "view" }, tags: ["LEGACY", "INFERRED", "NOT_AAA"] };
  const resolved = createResolvedRoute(config, `/${cleanPath}`, "inferred");
  resolved._isLegacyInferred = true;
  resolved._aaa = false;
  return resolved;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, patterns: knownPatterns.length, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, patterns: knownPatterns.length, portsInitialized: Ports.isInitialized() };
}
var legacy_inference_default = { isKnownDynamicPattern, inferDynamicRoute, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  legacy_inference_default as default,
  getPorts,
  healthCheck,
  inferDynamicRoute,
  info,
  injectPorts,
  isKnownDynamicPattern
};
