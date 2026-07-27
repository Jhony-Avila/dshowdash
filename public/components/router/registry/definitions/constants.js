import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "6.2.0-P17WI";
const MODULE_ID = "router.registry.definitions.constants";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const GUARD_POLICIES = Object.freeze({ UARPS: "uarps", PERMISSIONS: "permissions", HYBRID: "hybrid", LEGACY: "legacy", PUBLIC: "public" });
const PERMISSION_GRAMMAR = Object.freeze({ CAPABILITY_PREFIX: "cap:", ROLE_PREFIX: "role:", LEVEL_PREFIX: "level:" });
const ROUTES_SCHEMA = Object.freeze({ path: "string", id: "string", name: "string", title: "string", public: "boolean", requiresAuth: "boolean", permissions: ["string"], featureFlags: ["string"], layout: "string", defaultView: "string", virtualDefaults: { view: "string", tab: "string", section: "string", entity: "string", mode: "string" }, seo: { title: "string", description: "string" }, aliases: ["string"], tags: ["string"], mountMain: "boolean", domain: "string", guardPolicy: "string", minLevel: "number" });
const DOMAINS = Object.freeze({ DASHBOARD: "dashboard", CLIENTES: "clientes", FINANCEIRO: "financeiro", COMERCIAL: "comercial", RH: "rh", SUPRIMENTOS: "suprimentos", JURIDICO: "juridico", INTEGRACOES: "integracoes", IMPORTACAO: "importacao", OPERACIONAL: "operacional", ADMIN: "admin", SYSTEM: null });
const LAYOUTS = Object.freeze({ DEFAULT: "default", LOGIN_ONLY: "login-only", FULL_SCREEN: "full-screen" });
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
}
var constants_default = { VERSION, MODULE_ID, ROUTES_SCHEMA, DOMAINS, LAYOUTS, GUARD_POLICIES, PERMISSION_GRAMMAR, healthCheck, injectPorts, getPorts };
export {
  DOMAINS,
  GUARD_POLICIES,
  LAYOUTS,
  MODULE_ID,
  PERMISSION_GRAMMAR,
  ROUTES_SCHEMA,
  VERSION,
  constants_default as default,
  getPorts,
  healthCheck,
  injectPorts
};
