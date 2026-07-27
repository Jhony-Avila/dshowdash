import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.router.utils.doc-generator";
const VERSION = "2.1.1-P17WI";
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
const _state = { initialized: false };
const _metrics = { generated: 0 };
function generateRouteDoc(route) {
  const doc = { pattern: route.pattern || route.path, name: route.name || "unnamed", method: route.method || "GET", params: [], query: [], description: route.description || "", meta: route.meta || {} };
  const paramMatches = (route.pattern || "").match(/:\w+/g) || [];
  for (let i = 0; i < paramMatches.length; i++) {
    const param = paramMatches[i].substring(1);
    const isOptional = param.endsWith("?");
    const isCatchAll = param.endsWith("*");
    doc.params.push({ name: isOptional || isCatchAll ? param.slice(0, -1) : param, required: !isOptional, catchAll: isCatchAll });
  }
  return doc;
}
function generateRoutesDoc(routes) {
  _metrics.generated++;
  return routes.map(generateRouteDoc);
}
function generateMarkdown(routes) {
  const docs = generateRoutesDoc(routes);
  let md = "# Router Documentation\n\n";
  md += `Generated: ${(/* @__PURE__ */ new Date()).toISOString()}

`;
  md += "## Routes\n\n";
  for (let i = 0; i < docs.length; i++) {
    const d = docs[i];
    md += `### ${d.name}

`;
    md += `**Pattern:** \`${d.pattern}\`

`;
    if (d.description) md += `${d.description}

`;
    if (d.params.length > 0) {
      md += "**Parameters:**\n";
      for (let j = 0; j < d.params.length; j++) {
        const p = d.params[j];
        md += `- \`${p.name}\`${p.required ? " (required)" : " (optional)"}${p.catchAll ? " (catch-all)" : ""}
`;
      }
      md += "\n";
    }
    md += "---\n\n";
  }
  return md;
}
function generateJSON(routes) {
  return JSON.stringify(generateRoutesDoc(routes), null, 2);
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var doc_generator_default = { MODULE_ID, VERSION, init, generateRouteDoc, generateRoutesDoc, generateMarkdown, generateJSON, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  doc_generator_default as default,
  generateJSON,
  generateMarkdown,
  generateRouteDoc,
  generateRoutesDoc,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts
};
