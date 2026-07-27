import { PAINEL_ID } from "../core/constants.js";
const MODULE_ID = "panel-10-template";
const VERSION = "9.3.0-P2-ENTERPRISE";
function renderPanelStructure(container) {
  container.innerHTML = `<div class="${PAINEL_ID}-wrapper" role="region" aria-label="Server Health Dashboard"><header class="${PAINEL_ID}-header"><div class="${PAINEL_ID}-header-title"><svg class="${PAINEL_ID}-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg><span class="${PAINEL_ID}-title">Sa\xFAde do Servidor</span></div><div class="${PAINEL_ID}-header-info"><span class="${PAINEL_ID}-status" data-status aria-live="polite">Carregando...</span><span class="${PAINEL_ID}-last-update" data-last-update>---</span></div></header><main id="${PAINEL_ID}-content" class="${PAINEL_ID}-content" aria-busy="true"></main></div>`;
}
function updateStatus(container, status) {
  const el = container?.querySelector("[data-status]");
  if (el) el.textContent = status;
}
function updateTimestamp(container, timestamp) {
  const el = container?.querySelector("[data-last-update]");
  if (!el || !timestamp) return;
  const time = new Date(timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  el.textContent = `Atualizado: ${time}`;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { templateReady: true } };
}
var template_default = { renderPanelStructure, updateStatus, updateTimestamp, MODULE_ID, VERSION, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  template_default as default,
  healthCheck,
  info,
  renderPanelStructure,
  updateStatus,
  updateTimestamp
};
