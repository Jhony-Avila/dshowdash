import { PAINEL_ID } from "./constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-02/core/template";
function renderStructure(container) {
  container.innerHTML = `    <div class="p02-wrapper" role="region" aria-label="Monitoramento de Jobs">      <header class="p02-header">        <div class="p02-identity">          <div class="p02-identity-icon">            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>              <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>              <path d="M9 12l2 2 4-4"/>            </svg>          </div>          <h2 class="p02-title">Monitoramento de Jobs</h2>        </div>        <div class="p02-health-summary" data-status-badges>          <span class="p02-health-item p02-health-item--ok" data-badge="ok" data-tooltip="Jobs saud\xE1veis">            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>            <span class="p02-health-count">--</span>            <span>OK</span>          </span>          <span class="p02-health-item p02-health-item--warning" data-badge="warning" data-tooltip="Jobs fora do SLA">            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>            <span class="p02-health-count">--</span>            <span>Aten\xE7\xE3o</span>          </span>          <span class="p02-health-item p02-health-item--critical" data-badge="error" data-tooltip="Jobs em estado cr\xEDtico">            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>            <span class="p02-health-count">--</span>            <span>Cr\xEDticos</span>          </span>          <span class="p02-health-item p02-health-item--active" data-badge="running" data-tooltip="Executando agora">            <span class="p02-health-dot"></span>            <span class="p02-health-count" data-running-count>0</span>            <span>Ativos</span>          </span>        </div>        <div class="p02-actions">          <div class="p02-auto-refresh" data-tooltip="Auto-refresh">            <button class="p02-auto-toggle active" data-action="toggle-auto-refresh" type="button" aria-label="Toggle auto-refresh"></button>            <span class="p02-countdown active" data-countdown>30</span>          </div>          <div class="p02-actions-cluster">            <button class="p02-action-btn p02-action-btn--refresh" data-action="refresh" data-tooltip="Atualizar" type="button">              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>            </button>            <button class="p02-action-btn p02-action-btn--export" data-action="export" data-tooltip="Exportar CSV" type="button">              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>            </button>            <button class="p02-action-btn p02-action-btn--print" data-action="print" data-tooltip="Imprimir" type="button">              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>            </button>            <button class="p02-action-btn p02-action-btn--share" data-action="share" data-tooltip="Compartilhar" type="button">              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>            </button>          </div>          <span class="p02-timestamp" data-last-update data-tooltip="\xDAltima atualiza\xE7\xE3o">            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>            <span>--:--:--</span>          </span>        </div>      </header>      <div class="p02-filters" data-filters>        <div class="p02-filter-chips">          <div class="p02-filter-chip" data-filter-chip="type">            <svg class="p02-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>            <select data-filter="type"><option value="">Tipo</option><option value="api">API</option><option value="python">Python</option><option value="php">PHP</option><option value="shell">Shell</option></select>            <svg class="p02-chip-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>          </div>          <div class="p02-filter-chip" data-filter-chip="status">            <svg class="p02-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>            <select data-filter="status"><option value="">Status</option><option value="active">Ativo</option><option value="inactive">Inativo</option><option value="error">Com Erro</option></select>            <svg class="p02-chip-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>          </div>          <div class="p02-filter-chip" data-filter-chip="rate">            <svg class="p02-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>            <select data-filter="rate"><option value="">Sucesso</option><option value="high">\u2265 95%</option><option value="medium">80-94%</option><option value="low">&lt; 80%</option></select>            <svg class="p02-chip-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>          </div>        </div>        <div class="p02-search">          <svg class="p02-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>          <input type="text" class="p02-search-input" data-filter="search" placeholder="Buscar por nome, tipo ou erro..." autocomplete="off">          <span class="p02-search-shortcut">/</span>        </div>        <button class="p02-filter-clear" data-action="clear-filters" type="button">          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>          Limpar        </button>        <div class="p02-filter-spacer"></div>        <div class="p02-grid-controls">          <div class="p02-density-cluster" data-tooltip="Densidade">            <button class="p02-density-btn" data-density="compact" type="button" aria-label="Compacto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>            <button class="p02-density-btn active" data-density="normal" type="button" aria-label="Normal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="5" x2="21" y2="5"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="19" x2="21" y2="19"/></svg></button>            <button class="p02-density-btn" data-density="comfortable" type="button" aria-label="Confort\xE1vel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="4" x2="21" y2="4"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="20" x2="21" y2="20"/></svg></button>          </div>          <select class="p02-group-select" data-action="group-by" data-tooltip="Agrupar"><option value="">Sem grupo</option><option value="job_type">Por Tipo</option><option value="health_status">Por Status</option></select>          <div class="p02-control-cluster">            <div class="p02-columns-dropdown">              <button class="p02-control-btn" data-action="toggle-columns" type="button" data-tooltip="Colunas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></button>              <div class="p02-columns-menu" data-dropdown="columns"><div class="p02-columns-menu-header">Colunas Vis\xEDveis</div></div>            </div>            <button class="p02-control-btn" data-action="toggle-inline-filters" type="button" data-tooltip="Filtros na tabela"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg></button>          </div>        </div>        <span class="p02-filter-counter" data-filter-count><strong data-visible-count>--</strong> de <strong data-total-count>--</strong></span>      </div>      <main id="${PAINEL_ID}-content" class="p02-content" aria-busy="true"></main>      <footer class="p02-footer">        <div class="p02-footer-left">          <span class="p02-footer-stat" data-stat="total"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>Total: <strong>--</strong></span>          <span class="p02-footer-stat" data-stat="active"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Ativos: <strong>--</strong></span>          <span class="p02-footer-stat" data-stat="inactive"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Inativos: <strong>--</strong></span>        </div>        <div class="p02-footer-right"><span class="p02-footer-info" data-refresh-interval>Auto-refresh: 30s</span></div>      </footer>    </div>  `;
}
function updateRefreshBtn(container, text, loading) {
  const btn = container ? container.querySelector('[data-action="refresh"]') : null;
  if (!btn) return;
  if (loading) {
    btn.classList.add("p02-action-btn--loading");
    btn.setAttribute("disabled", "true");
  } else {
    btn.classList.remove("p02-action-btn--loading");
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
  const badges = container.querySelector("[data-status-badges]");
  if (!badges) return;
  const okBadge = badges.querySelector('[data-badge="ok"] .p02-health-count');
  const warnBadge = badges.querySelector('[data-badge="warning"] .p02-health-count');
  const errBadge = badges.querySelector('[data-badge="error"] .p02-health-count');
  if (okBadge) okBadge.textContent = stats.ok !== void 0 ? String(stats.ok) : "0";
  if (warnBadge) warnBadge.textContent = stats.warning !== void 0 ? String(stats.warning) : "0";
  if (errBadge) errBadge.textContent = stats.error !== void 0 ? String(stats.error) : "0";
}
function updateFooterStats(container, stats) {
  if (!container || !stats) return;
  const total = container.querySelector('[data-stat="total"] strong');
  const active = container.querySelector('[data-stat="active"] strong');
  const inactive = container.querySelector('[data-stat="inactive"] strong');
  if (total) total.textContent = stats.total !== void 0 ? String(stats.total) : "--";
  if (active) active.textContent = stats.active !== void 0 ? String(stats.active) : "--";
  if (inactive) inactive.textContent = stats.inactive !== void 0 ? String(stats.inactive) : "--";
}
function updateFilterCount(container, visible, total) {
  if (!container) return;
  const visibleEl = container.querySelector("[data-visible-count]");
  const totalEl = container.querySelector("[data-total-count]");
  if (visibleEl) visibleEl.textContent = visible !== void 0 ? String(visible) : "--";
  if (totalEl) totalEl.textContent = total !== void 0 ? String(total) : "--";
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
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { renderStructureReady: typeof renderStructure === "function", updateFunctionsReady: typeof updateRefreshBtn === "function" && typeof updateTimestamp === "function" } };
}
var template_default = { renderStructure, updateRefreshBtn, updateTimestamp, updateStatusBadges, updateFooterStats, updateFilterCount, updateCountdown, setAutoRefreshState, info, healthCheck };
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
