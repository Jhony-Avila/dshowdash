function injectStyles() {
  if (document.getElementById("p14-styles")) return;
  const style = document.createElement("style");
  style.id = "p14-styles";
  style.textContent = `
    @keyframes p14-fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes p14-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    .p14-animate { animation: p14-fadeIn 0.3s ease-out; }
    .p14-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
    .p14-error-row { transition: all 0.2s; cursor: pointer; }
    .p14-error-row:hover { background: rgba(99,102,241,0.1); }
    .p14-bar { transition: width 0.8s ease-out; }
    .p14-severity-badge { animation: p14-pulse 2s infinite; }
  `;
  document.head.appendChild(style);
}
var styles_default = { injectStyles };
const MODULE_ID = "panels-ui-component-styles";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { stylesReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  styles_default as default,
  healthCheck,
  info,
  injectStyles
};
