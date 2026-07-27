import { MODULE_ID, VERSION, CSS_PREFIX } from "../core/constants.js";
const CSS_URLS = [
  "/components/panels/panel-gestao-paineis/styles/panel-gestao.css"
];
function loadCSS() {
  for (const url of CSS_URLS) {
    const id = `css-${CSS_PREFIX}`;
    if (document.getElementById(id)) continue;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  }
}
function healthCheck() {
  return {
    status: "HEALTHY",
    module: MODULE_ID,
    version: VERSION,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    panelId: "panel-gestao-paineis",
    description: "Painel administrativo para gerenciamento visual de todos os pain\xE9is do sistema"
  };
}
export {
  healthCheck,
  info,
  loadCSS
};
