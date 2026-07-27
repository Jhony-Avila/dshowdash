import { PAINEL_ID } from "./constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-18/core/template";
function renderStructure(container) {
  container.innerHTML = `
    <div class="p18-wrapper" role="region" aria-label="KPIs Taxa de Sucesso">
      <header class="p18-header">
        <div class="p18-identity">
          <div class="p18-identity-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></div>
          <h2 class="p18-title">KPIs Taxa de Sucesso</h2>
        </div>
        <div class="p18-actions">
          <div class="p18-auto-refresh"><button class="p18-auto-toggle active" data-action="toggle-auto-refresh" type="button"></button><span class="p18-countdown active" data-countdown>60</span></div>
          <div class="p18-actions-cluster"><button class="p18-action-btn p18-action-btn--refresh" data-action="refresh" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button></div>
          <span class="p18-timestamp" data-last-update><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>--:--:--</span></span>
        </div>
      </header>
      <main id="${PAINEL_ID}-content" class="p18-content" aria-busy="true"></main>
      <footer class="p18-footer"><div class="p18-footer-left"><span class="p18-footer-info">KPIs Taxa de Sucesso (30 dias)</span></div><div class="p18-footer-right"><span class="p18-footer-info" data-refresh-interval>Auto-refresh: 1min</span></div></footer>
    </div>
  `;
}
function updateRefreshBtn(container, text, loading) {
  const btn = container?.querySelector('[data-action="refresh"]');
  if (!btn) return;
  if (loading) {
    btn.classList.add("p18-action-btn--loading");
    btn.setAttribute("disabled", "true");
  } else {
    btn.classList.remove("p18-action-btn--loading");
    btn.removeAttribute("disabled");
  }
}
function updateTimestamp(container, timestamp) {
  const el = container?.querySelector("[data-last-update] span");
  if (!el || !timestamp) return;
  el.textContent = new Date(timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function updateCountdown(container, seconds) {
  const el = container?.querySelector("[data-countdown]");
  if (el) el.textContent = String(seconds);
}
function setAutoRefreshState(container, active) {
  const toggle = container?.querySelector('[data-action="toggle-auto-refresh"]');
  const countdown = container?.querySelector("[data-countdown]");
  if (toggle) toggle.classList.toggle("active", active);
  if (countdown) countdown.classList.toggle("active", active);
}
function updateStatusBadges(container, stats) {
}
function updateFooterStats(container, stats) {
}
function updateFilterCount(container, visible, total) {
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var template_default = { renderStructure, updateRefreshBtn, updateTimestamp, updateCountdown, setAutoRefreshState, updateStatusBadges, updateFooterStats, updateFilterCount, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  template_default as default,
  healthCheck,
  info,
  renderStructure,
  setAutoRefreshState,
  updateCountdown,
  updateFilterCount,
  updateFooterStats,
  updateRefreshBtn,
  updateStatusBadges,
  updateTimestamp
};
