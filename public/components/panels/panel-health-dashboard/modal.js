import { ICONS, STATUS_CONFIG } from "./constants.js";
import { selectors } from "./state/store.js";
function showModuleDetails(moduleName) {
  const snapshot = selectors.getSnapshot();
  if (!snapshot) return;
  let moduleData = null;
  for (const [catKey, modules] of Object.entries(snapshot.categories)) {
    const mods = modules;
    if (mods[moduleName]) {
      moduleData = mods[moduleName];
      break;
    }
  }
  if (!moduleData) return;
  const statusCfg = STATUS_CONFIG[moduleData.status] || STATUS_CONFIG.UNKNOWN;
  const modal = document.createElement("div");
  modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;";
  const _icons = ICONS;
  modal.innerHTML = `<div style="background:#16161f;border:1px solid #2a2a3a;border-radius:12px;width:90%;max-width:400px;overflow:hidden;"><div style="display:flex;justify-content:space-between;align-items:center;padding:16px;border-bottom:1px solid #2a2a3a;"><div style="display:flex;align-items:center;gap:8px;"><span class="phd-icon" style="color:${statusCfg.color};">${_icons[statusCfg.icon]}</span><span style="font-size:14px;font-weight:600;color:#f0f0f5;">${moduleName}</span></div><button style="background:none;border:none;color:#606070;font-size:20px;cursor:pointer;padding:0 8px;" data-close>&times;</button></div><div style="padding:16px;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;"><div style="background:#12121a;border-radius:6px;padding:12px;text-align:center;"><div style="font-size:10px;color:#606070;margin-bottom:4px;">STATUS</div><span class="phd-badge" style="background:${statusCfg.bg};color:${statusCfg.color};">${statusCfg.label}</span></div><div style="background:#12121a;border-radius:6px;padding:12px;text-align:center;"><div style="font-size:10px;color:#606070;margin-bottom:4px;">SCORE</div><div style="font-size:18px;font-weight:700;color:${statusCfg.color};">${moduleData.score !== null ? `${moduleData.score}%` : "--"}</div></div></div>${moduleData.version ? `<div style="font-size:11px;color:#606070;margin-bottom:12px;">Version: <span style="color:#a0a0b0;">${moduleData.version}</span></div>` : ""}${moduleData.checks && Object.keys(moduleData.checks).length > 0 ? `<div style="background:#12121a;border-radius:6px;padding:12px;"><div style="font-size:10px;color:#606070;margin-bottom:8px;text-transform:uppercase;">Checks</div>${Object.entries(moduleData.checks).map(([k, v]) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:11px;"><span style="color:#a0a0b0;">${k}</span><span style="color:${v ? "#22c55e" : "#ef4444"};">${v ? ICONS.check : ICONS.x}</span></div>`).join("")}</div>` : ""}${moduleData.issues?.length ? `<div style="margin-top:12px;background:rgba(239,68,68,0.1);border-radius:6px;padding:12px;"><div style="font-size:10px;color:#ef4444;margin-bottom:8px;text-transform:uppercase;">Issues</div>${moduleData.issues.map((issue) => `<div style="font-size:11px;color:#f87171;padding:2px 0;">${issue}</div>`).join("")}</div>` : ""}</div></div>`;
  modal.querySelector("[data-close]").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
  document.body.appendChild(modal);
}
var modal_default = { showModuleDetails };
const MODULE_ID = "panels-panels-panel-health-dashboard-modal";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { modalReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  modal_default as default,
  healthCheck,
  info,
  showModuleDetails
};
