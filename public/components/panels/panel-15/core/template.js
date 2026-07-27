import { PAINEL_ID } from "./constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-15/core/template";
function renderStructure(container) {
  container.innerHTML = `
    <div class="p15-wrapper" role="region" aria-label="Overview M\xE9tricas">
      <header class="p15-header">
        <div class="p15-identity">
          <div class="p15-identity-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"/>
              <path d="M18 17V9"/>
              <path d="M13 17V5"/>
              <path d="M8 17v-3"/>
            </svg>
          </div>
          <h2 class="p15-title">Overview M\xE9tricas</h2>
        </div>
        <div class="p15-actions">
          <div class="p15-auto-refresh" data-tooltip="Auto-refresh">
            <button class="p15-auto-toggle active" data-action="toggle-auto-refresh" type="button" aria-label="Toggle auto-refresh"></button>
            <span class="p15-countdown active" data-countdown>30</span>
          </div>
          <div class="p15-actions-cluster">
            <button class="p15-action-btn p15-action-btn--refresh" data-action="refresh" data-tooltip="Atualizar" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </button>
            <button class="p15-action-btn p15-action-btn--print" data-action="print" data-tooltip="Imprimir" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
            </button>
          </div>
          <span class="p15-timestamp" data-last-update data-tooltip="\xDAltima atualiza\xE7\xE3o">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span>--:--:--</span>
          </span>
        </div>
      </header>
      <main id="${PAINEL_ID}-content" class="p15-content" aria-busy="true"></main>
      <footer class="p15-footer">
        <div class="p15-footer-left">
          <span class="p15-footer-info">Dashboard Estrat\xE9gico</span>
        </div>
        <div class="p15-footer-right">
          <span class="p15-footer-info" data-refresh-interval>Auto-refresh: 30s</span>
        </div>
      </footer>
    </div>
  `;
}
function updateRefreshBtn(container, text, loading) {
  const btn = container?.querySelector('[data-action="refresh"]');
  if (!btn) return;
  if (loading) {
    btn.classList.add("p15-action-btn--loading");
    btn.setAttribute("disabled", "true");
  } else {
    btn.classList.remove("p15-action-btn--loading");
    btn.removeAttribute("disabled");
  }
}
function updateTimestamp(container, timestamp) {
  const el = container?.querySelector("[data-last-update] span");
  if (!el || !timestamp) return;
  const time = new Date(timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  el.textContent = time;
}
function updateCountdown(container, seconds) {
  if (!container) return;
  const el = container.querySelector("[data-countdown]");
  if (el) el.textContent = String(seconds);
}
function setAutoRefreshState(container, active) {
  if (!container) return;
  const toggle = container.querySelector('[data-action="toggle-auto-refresh"]');
  const countdown = container.querySelector("[data-countdown]");
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
