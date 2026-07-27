export * from "./renderer.js";
const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "main/ui";
function healthCheck() {
  return { status: "HEALTHY", module: MODULE_ID, version: VERSION, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, exports: ["renderer"], healthCheck: healthCheck(), timestamp: Date.now() };
}
export {
  MODULE_ID,
  VERSION,
  healthCheck,
  info
};
