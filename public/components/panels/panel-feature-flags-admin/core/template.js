import { PANEL_ID } from "./constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-feature-flags-admin/core/template";
function renderStructure(container) {
  container.innerHTML = `<div class="pfa-wrapper" role="region" aria-label="Gerenciamento de Feature Flags"><header class="pfa-header"><div class="pfa-identity"><div class="pfa-identity-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg></div><h2 class="pfa-title">Feature Flags</h2></div><div class="pfa-health-summary" data-status-badges><span class="pfa-health-item pfa-health-item--total" data-badge="total"><span class="pfa-health-count" data-total-count>--</span><span>Total</span></span><span class="pfa-health-item pfa-health-item--active" data-badge="active"><span class="pfa-health-count" data-active-count>--</span><span>Ativos</span></span></div><div class="pfa-actions"><div class="pfa-auto-refresh" data-tooltip="Auto-refresh"><button class="pfa-auto-toggle active" data-action="toggle-auto-refresh" type="button" aria-label="Toggle auto-refresh"></button><span class="pfa-countdown active" data-countdown>30</span></div><button class="pfa-action-btn pfa-action-btn--refresh" data-action="refresh" data-tooltip="Atualizar" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button><span class="pfa-timestamp" data-last-update><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>--:--:--</span></span></div></header><div class="pfa-toolbar"><div class="pfa-search"><svg class="pfa-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" class="pfa-search-input" data-filter="search" placeholder="Buscar flags..." autocomplete="off"></div><button class="pfa-btn pfa-btn--primary" data-action="create" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Novo Flag</button></div><main id="${PANEL_ID}-content" class="pfa-content" aria-busy="true"></main><footer class="pfa-footer"><div class="pfa-footer-left"><span class="pfa-footer-stat" data-stat="environments">Ambientes: <strong>--</strong></span></div><div class="pfa-footer-right"><span class="pfa-footer-info" data-refresh-interval>Auto-refresh: 30s</span></div></footer></div>`;
}
function updateRefreshBtn(container, text, loading) {
  const btn = container ? container.querySelector('[data-action="refresh"]') : null;
  if (!btn) return;
  if (loading) {
    btn.classList.add("pfa-action-btn--loading");
    btn.setAttribute("disabled", "true");
  } else {
    btn.classList.remove("pfa-action-btn--loading");
    btn.removeAttribute("disabled");
  }
}
function updateTimestamp(container, timestamp) {
  const el = container ? container.querySelector("[data-last-update] span") : null;
  if (!el || !timestamp) return;
  const time = new Date(timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  el.textContent = time;
}
function updateStatusBadges(container, stats) {
  if (!container || !stats) return;
  const totalEl = container.querySelector("[data-total-count]");
  const activeEl = container.querySelector("[data-active-count]");
  if (totalEl) totalEl.textContent = String(stats.total !== void 0 ? stats.total : 0);
  if (activeEl) activeEl.textContent = String(stats.active !== void 0 ? stats.active : 0);
}
function updateCountdown(container, seconds) {
  const el = container ? container.querySelector("[data-countdown]") : null;
  if (el) el.textContent = String(seconds);
}
function setAutoRefreshState(container, active) {
  const toggle = container ? container.querySelector('[data-action="toggle-auto-refresh"]') : null;
  const countdown = container ? container.querySelector("[data-countdown]") : null;
  if (toggle) toggle.classList.toggle("active", active);
  if (countdown) countdown.classList.toggle("active", active);
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { templateReady: true }, p25Compliant: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true };
}
var template_default = { renderStructure, updateRefreshBtn, updateTimestamp, updateStatusBadges, updateCountdown, setAutoRefreshState, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  template_default as default,
  healthCheck,
  info,
  renderStructure,
  setAutoRefreshState,
  updateCountdown,
  updateRefreshBtn,
  updateStatusBadges,
  updateTimestamp
};
