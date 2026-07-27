import { MODULE_ID, VERSION, ICONS } from "../core/constants.js";
import { renderIdentitySection } from "./template-identity.js";
import { renderInterfaceSection } from "./template-interface.js";
import { renderPersistenceSection } from "./template-persistence.js";
import { renderHistorySection } from "./template-history.js";
import { renderModals } from "./template-modals.js";
const LOCAL_MODULE_ID = "panel-user-preferences:templates";
const LOCAL_VERSION = "9.3.0-P2-ENTERPRISE";
function _s(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function _getInitials(user) {
  if (!user || !user.name && !user.email) return "?";
  const name = user.name || user.email || "";
  const parts = name.split(/[\s@]+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}
function render(data) {
  const user = data.user;
  const preferences = data.preferences;
  const layouts = data.layouts;
  const savedViews = data.savedViews;
  const history = data.history;
  const isDirty = data.isDirty;
  const isSaving = data.isSaving;
  const isCompact = data.isCompact;
  const statusClass = isSaving ? "saving" : isDirty ? "pending" : "synced";
  const statusText = isSaving ? "Salvando..." : isDirty ? "Pendente" : "Sincronizado";
  const statusIcon = isSaving ? ICONS.loader : isDirty ? ICONS.clock : ICONS.checkCircle;
  return `<div class="pup-panel ${isCompact ? "compact" : ""}" data-module="${MODULE_ID}" data-version="${VERSION}"><header class="pup-hdr ${isDirty ? "dirty" : ""} ${isSaving ? "saving" : ""}"><div class="pup-hdr-left"><div class="pup-hdr-icon">${ICONS.settings}</div><h1 class="pup-hdr-title">Prefer\xEAncias</h1></div><div class="pup-hdr-center"><div class="pup-hdr-meta">${ICONS.keyboard}<span>Ctrl+S salvar</span></div><div class="pup-hdr-sep"></div><div class="pup-hdr-meta">${ICONS.undo}<span>Ctrl+Z desfazer</span></div></div><div class="pup-hdr-right"><button type="button" class="pup-compact-toggle ${isCompact ? "active" : ""}" data-action="toggle-compact" aria-label="Modo compacto" aria-pressed="${isCompact}">${isCompact ? ICONS.maximize : ICONS.minimize}</button><div class="pup-status ${statusClass}">${statusIcon}<span>${statusText}</span></div><div class="pup-save-bar ${isDirty ? "visible" : ""}"><button type="button" class="pup-btn-save" data-action="save-all" ${isSaving ? "disabled" : ""}>${isSaving ? ICONS.loader : ICONS.save}<span>Salvar</span></button><button type="button" class="pup-btn-discard" data-action="discard-changes">${ICONS.x}<span>Descartar</span></button></div></div></header><div class="pup-shortcuts"><div class="pup-shortcut"><kbd>Ctrl</kbd>+<kbd>S</kbd> Salvar</div><div class="pup-shortcut"><kbd>Ctrl</kbd>+<kbd>Z</kbd> Desfazer</div><div class="pup-shortcut"><kbd>Esc</kbd> Cancelar</div></div><div class="pup-scroll">${renderIdentitySection(user)}${renderInterfaceSection(preferences)}${renderPersistenceSection(layouts, savedViews)}${renderHistorySection(history)}</div>${renderModals()}<div class="pup-live-region" role="status" aria-live="polite" aria-atomic="true"></div></div>`;
}
function renderSkeleton() {
  return `<div class="pup-panel" data-module="${MODULE_ID}" aria-busy="true"><header class="pup-hdr"><div class="pup-hdr-left"><div class="pup-hdr-icon">${ICONS.settings}</div><h1 class="pup-hdr-title">Prefer\xEAncias</h1></div><div class="pup-hdr-right"><div class="pup-status synced">${ICONS.loader}<span>Carregando...</span></div></div></header><div class="pup-scroll"><div class="pup-skel-row"><div class="pup-skel pup-skel-avatar"></div><div style="flex:1"><div class="pup-skel pup-skel-text lg"></div><div class="pup-skel pup-skel-text md"></div></div></div><div class="pup-skel pup-skel-card" style="margin-top:16px"></div><div class="pup-skel pup-skel-card"></div><div class="pup-skel pup-skel-card"></div></div></div>`;
}
function info() {
  return { moduleId: LOCAL_MODULE_ID, version: LOCAL_VERSION, p25Compliant: true };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: LOCAL_MODULE_ID, version: LOCAL_VERSION, checks: { templatesReady: true }, p25Compliant: true };
}
var templates_default = { render, renderSkeleton, _s, _getInitials, info, healthCheck };
export {
  _getInitials,
  _s,
  templates_default as default,
  healthCheck,
  info,
  render,
  renderSkeleton
};
