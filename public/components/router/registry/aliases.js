import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { routes } from "./definitions.js";
const VERSION = "5.4.0-P17WI";
const MODULE_ID = "router.registry.aliases";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const aliasMap = /* @__PURE__ */ new Map();
(function buildAliasMap() {
  try {
    for (const [path, config] of Object.entries(routes)) {
      if (config.aliases && Array.isArray(config.aliases)) {
        for (const alias of config.aliases) {
          aliasMap.set(alias, path);
        }
      }
    }
  } catch (e) {
  }
})();
const resolveAlias = (path) => aliasMap.get(path) || path;
const routeExists = (path) => {
  try {
    return Object.prototype.hasOwnProperty.call(routes, path) || aliasMap.has(path);
  } catch (error) {
    return false;
  }
};
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, aliasCount: aliasMap.size, portsInitialized: Ports.isInitialized() };
}
var aliases_default = { aliasMap, resolveAlias, routeExists, VERSION, MODULE_ID, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  aliasMap,
  aliases_default as default,
  getPorts,
  healthCheck,
  injectPorts,
  resolveAlias,
  routeExists
};
