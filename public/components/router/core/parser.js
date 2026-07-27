import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.router.core.parser";
const VERSION = "2.2.0-P18EC";
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
const _metrics = { parses: 0, builds: 0, errors: 0 };
function parseHash(hash) {
  _metrics.parses++;
  if (!hash) return { path: "", params: {}, query: {}, fragment: "" };
  let cleanHash = hash.charAt(0) === "#" ? hash.substring(1) : hash;
  const fragmentIndex = cleanHash.indexOf("#");
  let fragment = "";
  if (fragmentIndex >= 0) {
    fragment = cleanHash.substring(fragmentIndex + 1);
    cleanHash = cleanHash.substring(0, fragmentIndex);
  }
  const queryIndex = cleanHash.indexOf("?");
  const query = {};
  if (queryIndex >= 0) {
    const queryStr = cleanHash.substring(queryIndex + 1);
    cleanHash = cleanHash.substring(0, queryIndex);
    const pairs = queryStr.split("&");
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i].split("=");
      if (pair[0]) query[decodeURIComponent(pair[0])] = pair[1] ? decodeURIComponent(pair[1]) : "";
    }
  }
  return { path: cleanHash || "/", params: {}, query, fragment };
}
function parseRoute(pattern, path) {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) {
    const lastPattern = patternParts[patternParts.length - 1];
    if (!(lastPattern && lastPattern.charAt(0) === ":" && lastPattern.charAt(lastPattern.length - 1) === "*")) return null;
  }
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i];
    if (pp.charAt(0) === ":") {
      let paramName = pp.substring(1);
      if (paramName.charAt(paramName.length - 1) === "*") {
        paramName = paramName.slice(0, -1);
        params[paramName] = pathParts.slice(i).join("/");
        break;
      } else if (paramName.charAt(paramName.length - 1) === "?") {
        paramName = paramName.slice(0, -1);
        params[paramName] = pathParts[i] || "";
      } else params[paramName] = pathParts[i];
    } else if (pp !== pathParts[i]) return null;
  }
  return params;
}
function buildPath(pattern, params) {
  _metrics.builds++;
  params = params || {};
  const path = pattern.replace(/:([^/]+)/g, (match, paramName) => {
    const isOptional = paramName.charAt(paramName.length - 1) === "?";
    const isCatchAll = paramName.charAt(paramName.length - 1) === "*";
    if (isOptional || isCatchAll) paramName = paramName.slice(0, -1);
    return params[paramName] != null ? encodeURIComponent(params[paramName]) : "";
  });
  return path.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}
function buildQuery(params) {
  const pairs = [];
  for (const key in params) {
    if (params.hasOwnProperty(key) && params[key] != null && params[key] !== "") pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
  }
  return pairs.length > 0 ? `?${pairs.join("&")}` : "";
}
function buildHash(path, query, fragment) {
  let hash = `#${path.charAt(0) === "/" ? path : `/${path}`}`;
  if (query && typeof query === "object") hash += buildQuery(query);
  else if (query && typeof query === "string") hash += (query.charAt(0) === "?" ? "" : "?") + query;
  if (fragment) hash += `#${fragment}`;
  return hash;
}
function normalize(path) {
  if (!path) return "/";
  let normalized = path.replace(/\/+/g, "/");
  if (normalized.length > 1 && normalized.charAt(normalized.length - 1) === "/") normalized = normalized.slice(0, -1);
  if (normalized.charAt(0) !== "/") normalized = `/${normalized}`;
  return normalized;
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
const URLParser = {
  MODULE_ID,
  VERSION,
  init,
  parseHash,
  parseRoute,
  buildPath,
  buildQuery,
  buildHash,
  normalize,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
var parser_default = URLParser;
export {
  MODULE_ID,
  URLParser,
  VERSION,
  buildHash,
  buildPath,
  buildQuery,
  parser_default as default,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  normalize,
  parseHash,
  parseRoute
};
