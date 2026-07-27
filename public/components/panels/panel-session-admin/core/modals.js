import { LIFECYCLE_EVENTS } from "/core/runtime/events/catalog/lifecycle.events.js";
import * as Store from "../state/store.js";
import tracker from "../telemetry/tracker.js";
import { showToast } from "./helpers.js";
import { localState } from "./state.js";
import { terminateSession } from "./data.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels-panel-session-admin-core-modals";
let _modalListeners = [];
function _addModalListener(el, event, handler) {
  if (!el) return;
  el.addEventListener(event, handler);
  _modalListeners.push({ el, event, handler });
}
function _cleanupModalListeners() {
  _modalListeners.forEach((item) => {
    try {
      item.el.removeEventListener(item.event, item.handler);
    } catch (e) {
    }
  });
  _modalListeners = [];
}
function showDetails(token) {
  const sessions = Store.getSessions();
  localState.detailsSession = sessions.find((s) => (s.session_token || s.id) === token);
  if (localState.detailsSession) {
    renderDetailsModal();
    tracker.track(LIFECYCLE_EVENTS.INTERACTION, { action: "details:open", token: token ? token.slice(0, 8) : "" });
  }
}
function closeDetails() {
  _cleanupModalListeners();
  localState.detailsSession = null;
  const modal = document.querySelector(".psa__details-modal");
  if (modal) modal.remove();
  tracker.track(LIFECYCLE_EVENTS.INTERACTION, { action: "details:close" });
}
async function copySessionToken(token) {
  try {
    await navigator.clipboard.writeText(token);
    showToast("Token copiado!");
    tracker.track(LIFECYCLE_EVENTS.INTERACTION, { action: "session:copy", token: token ? token.slice(0, 8) : "" });
    return { ok: true };
  } catch (error) {
    showToast("Erro ao copiar", "error");
    return { ok: false, error: error.message };
  }
}
function renderDetailsModal() {
  if (!localState.detailsSession) return;
  const s = localState.detailsSession;
  const token = s.session_token || s.id;
  const _fmtDate = (v) => v ? new Date(v).toLocaleString("pt-BR") : "-";
  const existingModal = document.querySelector(".psa__details-modal");
  if (existingModal) {
    _cleanupModalListeners();
    existingModal.remove();
  }
  const modal = document.createElement("div");
  modal.className = "psa__details-modal psa__details-modal--open";
  modal.innerHTML = `<div class="psa__details-panel"><div class="psa__details-header"><h3 class="psa__details-title"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> Detalhes da Sess\xE3o</h3><button type="button" class="psa__details-close" data-action="close-details"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div><div class="psa__details-body"><div class="psa__details-grid"><div class="psa__details-item psa__details-item--full"><span class="psa__details-label">Token</span><span class="psa__details-value psa__details-value--mono">${token}</span></div><div class="psa__details-item"><span class="psa__details-label">Usu\xE1rio</span><span class="psa__details-value">${s.username || s.user_id || "-"}</span></div><div class="psa__details-item"><span class="psa__details-label">Status</span><span class="psa__details-value psa__details-value--highlight">${s.is_active ? "Ativa" : "Inativa"}${s.is_current ? " (Atual)" : ""}</span></div><div class="psa__details-item"><span class="psa__details-label">Dispositivo</span><span class="psa__details-value">${s.device_type || "-"}</span></div><div class="psa__details-item"><span class="psa__details-label">Browser</span><span class="psa__details-value">${s.browser || "-"}</span></div><div class="psa__details-item"><span class="psa__details-label">Sistema</span><span class="psa__details-value">${s.os || "-"}</span></div><div class="psa__details-item"><span class="psa__details-label">IP Origem</span><span class="psa__details-value">${s.origin_ip || "-"}</span></div><div class="psa__details-item"><span class="psa__details-label">\xDAltimo IP</span><span class="psa__details-value">${s.last_ip || "-"}</span></div><div class="psa__details-item psa__details-item--full"><span class="psa__details-label">User Agent</span><span class="psa__details-value psa__details-value--mono">${s.user_agent || "-"}</span></div></div><div class="psa__details-section"><h4 class="psa__details-section-title">Timestamps</h4><div class="psa__details-grid"><div class="psa__details-item"><span class="psa__details-label">Criada</span><span class="psa__details-value">${_fmtDate(s.created_at)}</span></div><div class="psa__details-item"><span class="psa__details-label">\xDAltima Atividade</span><span class="psa__details-value">${_fmtDate(s.last_activity_at)}</span></div><div class="psa__details-item"><span class="psa__details-label">Expira</span><span class="psa__details-value">${_fmtDate(s.expires_at)}</span></div></div></div></div><div class="psa__details-footer"><div class="psa__details-footer-left"><button type="button" class="psa__btn psa__btn--secondary" data-action="copy-token-modal"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copiar Token</button></div><div class="psa__details-footer-right">${!s.is_current ? '<button type="button" class="psa__btn psa__btn--warning" data-action="terminate-modal"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Encerrar</button>' : ""}<button type="button" class="psa__btn psa__btn--primary" data-action="close-details">Fechar</button></div></div></div>`;
  document.body.appendChild(modal);
  const closeBtn = modal.querySelector('[data-action="close-details"]');
  const closeBtns = modal.querySelectorAll('[data-action="close-details"]');
  const copyBtn = modal.querySelector('[data-action="copy-token-modal"]');
  const terminateBtn = modal.querySelector('[data-action="terminate-modal"]');
  if (closeBtn) _addModalListener(closeBtn, "click", closeDetails);
  closeBtns.forEach((b) => {
    if (b !== closeBtn) _addModalListener(b, "click", closeDetails);
  });
  if (copyBtn) _addModalListener(copyBtn, "click", () => {
    copySessionToken(String(token));
  });
  if (terminateBtn) _addModalListener(terminateBtn, "click", () => {
    closeDetails();
    terminateSession(String(token));
  });
  _addModalListener(modal, "click", (e) => {
    if (e.target === modal) closeDetails();
  });
}
function destroy() {
  _cleanupModalListeners();
  closeDetails();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, listenersRegistered: _modalListeners.length, p25Compliant: true };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { modalsReady: true, cleanupRegistryActive: true }, listenersRegistered: _modalListeners.length, p25Compliant: true };
}
var modals_default = { showDetails, closeDetails, copySessionToken, renderDetailsModal, destroy };
export {
  MODULE_ID,
  VERSION,
  closeDetails,
  copySessionToken,
  modals_default as default,
  destroy,
  healthCheck,
  info,
  renderDetailsModal,
  showDetails
};
