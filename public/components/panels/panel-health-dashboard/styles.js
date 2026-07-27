function injectStyles() {
  if (document.getElementById("phd-styles")) return;
  const style = document.createElement("style");
  style.id = "phd-styles";
  style.textContent = `
    @keyframes phd-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes phd-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes phd-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .phd-animate { animation: phd-fadeIn 0.3s ease-out; }
    .phd-skeleton { background: linear-gradient(90deg, #1a1a24 25%, #252532 50%, #1a1a24 75%); background-size: 200% 100%; animation: phd-shimmer 1.5s infinite; border-radius: 4px; }
    .phd-card { background: #12121a; border: 1px solid #1e1e2d; border-radius: 8px; transition: all 0.2s; }
    .phd-card:hover { border-color: #2a2a3a; }
    .phd-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .phd-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #1a1a24; border: 1px solid #2a2a3a; border-radius: 6px; color: #a0a0b0; font-size: 11px; cursor: pointer; transition: all 0.2s; }
    .phd-btn:hover { background: #252532; border-color: #3a3a4a; color: #f0f0f5; }
    .phd-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .phd-btn .phd-spin { animation: phd-spin 1s linear infinite; }
    .phd-module-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-bottom: 1px solid #1a1a24; cursor: pointer; transition: all 0.15s; }
    .phd-module-row:hover { background: rgba(99,102,241,0.05); }
    .phd-module-row:last-child { border-bottom: none; }
    .phd-category-header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; cursor: pointer; transition: all 0.15s; }
    .phd-category-header:hover { background: rgba(99,102,241,0.05); }
    .phd-category-content { overflow: hidden; transition: max-height 0.3s ease; }
    .phd-category-content.collapsed { max-height: 0 !important; }
    .phd-icon { display: inline-flex; align-items: center; justify-content: center; }
    .phd-icon svg { width: 16px; height: 16px; }
  `;
  document.head.appendChild(style);
}
var styles_default = { injectStyles };
const MODULE_ID = "panels-panels-panel-health-dashboard-styles";
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
