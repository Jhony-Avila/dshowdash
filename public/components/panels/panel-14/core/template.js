import { PAINEL_ID } from "./constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-14/core/template";
function renderStructure(container) {
  container.innerHTML = `
    <div class="p14-wrapper" role="region" aria-label="Top Erros">
      <header class="p14-header">
        <div class="p14-identity">
          <div class="p14-identity-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
          <h2 class="p14-title">Top Erros</h2>
        </div>
        <div class="p14-actions">
          <div class="p14-auto-refresh"><button class="p14-auto-toggle active" data-action="toggle-auto-refresh" type="button"></button><span class="p14-countdown active" data-countdown>30</span></div>
          <div class="p14-actions-cluster"><button class="p14-action-btn p14-action-btn--refresh" data-action="refresh" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button></div>
          <span class="p14-timestamp" data-last-update><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>--:--:--</span></span>
        </div>
      </header>
      <main id="${PAINEL_ID}-content" class="p14-content" aria-busy="true"></main>
      <footer class="p14-footer"><div class="p14-footer-left"><span class="p14-footer-info">Top Erros</span></div><div class="p14-footer-right"><span class="p14-footer-info" data-refresh-interval>Auto-refresh: 60min</span></div></footer>
    </div>
  `;
}
function updateRefreshBtn(container, text, loading) {
  const btn = container?.querySelector('[data-action="refresh"]');
  if (!btn) return;
  if (loading) {
    btn.classList.add("p14-action-btn--loading");
    btn.setAttribute("disabled", "true");
  } else {
    btn.classList.remove("p14-action-btn--loading");
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
