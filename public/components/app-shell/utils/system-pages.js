const MODULE_ID = "app-shell-system-pages-proxy";
const VERSION = "8.1.0-ENTERPRISE-AAA";
export * from "/app/pages/system-pages.js";
import { default as default2 } from "/app/pages/system-pages.js";
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    note: "Proxy - use /app/pages/system-pages.js directly"
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION
  };
}
export {
  MODULE_ID,
  VERSION,
  default2 as default,
  healthCheck,
  info
};
