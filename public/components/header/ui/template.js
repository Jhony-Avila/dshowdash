const VERSION = "6.2.0-ENTERPRISE";
const MODULE_ID = "header-ui-template";
let _metrics = { renders: 0 };
const headerTemplate = '<header class="site-header" role="banner"><div class="header-inner"><div class="header-left"></div><h1 class="visually-hidden">DshowDash - Dashboard de An\xE1lise e Monitoramento em Tempo Real</h1><div class="header-center" role="group" aria-label="\xC1rea central do header"></div><div class="header-right" role="group" aria-label="A\xE7\xF5es e informa\xE7\xF5es do usu\xE1rio"></div></div><div class="header-status-live" role="status" aria-live="polite" aria-atomic="true" aria-relevant="additions text"></div></header>';
function getVersion() {
  return VERSION;
}
function getMetrics() {
  _metrics.renders++;
  return Object.assign({}, _metrics);
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, templateSize: headerTemplate.length, hasLiveRegion: headerTemplate.includes("header-status-live"), hasAccessibility: headerTemplate.includes('role="banner"') };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { templateReady: true } };
}
var template_default = headerTemplate;
export {
  MODULE_ID,
  VERSION,
  template_default as default,
  getMetrics,
  getVersion,
  headerTemplate,
  healthCheck,
  info
};
