import { MODULE_ID, VERSION, PANEL_ID, CSS_PREFIX } from "../core/constants.js";
const CSS_URLS = ["/components/panels/panel-criacao-botoes/styles/index.css"];
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
    checks: { moduleReady: true },
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    panelId: PANEL_ID,
    description: "Vis\xE3o especializada da sidebar: cria\xE7\xE3o/edi\xE7\xE3o dos bot\xF5es em ui_nav_items via adapter compartilhado."
  };
}
export {
  healthCheck,
  info,
  loadCSS
};
