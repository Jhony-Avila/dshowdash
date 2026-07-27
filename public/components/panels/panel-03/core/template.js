import { PAINEL_ID } from "./constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-03/core/template";
function renderStructure(container) {
  container.innerHTML = `
    <div class="p03-wrapper" role="region" aria-label="Execu\xE7\xF5es por Hora">
      <header class="p03-header">
        <div class="p03-identity">
          <div class="p03-identity-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg></div>
          <h2 class="p03-title">Execu\xE7\xF5es por Hora</h2>
        </div>
        <div class="p03-actions">
          <div class="p03-auto-refresh"><button class="p03-auto-toggle active" data-action="toggle-auto-refresh" type="button"></button><span class="p03-countdown active" data-countdown>30</span></div>
          <div class="p03-actions-cluster"><button class="p03-action-btn p03-action-btn--refresh" data-action="refresh" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button></div>
          <span class="p03-timestamp" data-last-update><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>--:--:--</span></span>
        </div>
      </header>
      <main id="${PAINEL_ID}-content" class="p03-content" aria-busy="true"></main>
      <footer class="p03-footer"><div class="p03-footer-left"><span class="p03-footer-info">Execu\xE7\xF5es por Hora</span></div><div class="p03-footer-right"><span class="p03-footer-info" data-refresh-interval>Auto-refresh: 5min</span></div></footer>
    </div>
  `;
}
function updateRefreshBtn(container, text, loading) {
  const btn = container?.querySelector('[data-action="refresh"]');
  if (!btn) return;
  if (loading) {
    btn.classList.add("p03-action-btn--loading");
    btn.setAttribute("disabled", "true");
  } else {
    btn.classList.remove("p03-action-btn--loading");
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
