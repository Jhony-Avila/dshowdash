import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { escapeHtml } from "../../security/escape-html.js";
const VERSION = "10.5.0-MIGRATION-PHASE9";
const MODULE_ID = "panel-nav-admin.ui.views.trends-view";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[TrendsView]";
  if (level === "error") logger.error?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const CSS = {
  container: "pna-trends-container",
  header: "pna-trends-header",
  chart: "pna-trends-chart",
  bar: "pna-trends-bar",
  barFill: "pna-trends-bar-fill",
  barLabel: "pna-trends-bar-label",
  legend: "pna-trends-legend",
  summary: "pna-trends-summary",
  periodSelector: "pna-trends-period"
};
const PERIODS = Object.freeze({
  WEEK: "week",
  MONTH: "month",
  QUARTER: "quarter"
});
function computeTrends(activities, options = {}) {
  const { period = PERIODS.WEEK, periodCount = 8 } = options;
  if (!activities || activities.length === 0) {
    return { periods: [], summary: { total: 0, added: 0, updated: 0, deleted: 0 } };
  }
  const now = Date.now();
  const periodMs = _getPeriodMs(period);
  const buckets = [];
  for (let i = 0; i < Number(periodCount); i++) {
    const end = now - i * periodMs;
    const start = end - periodMs;
    buckets.unshift({
      start,
      end,
      label: _formatPeriodLabel(new Date(start), period),
      added: 0,
      updated: 0,
      deleted: 0,
      total: 0
    });
  }
  for (const activity of activities) {
    const ts = Number(activity.timestamp) || 0;
    for (const bucket of buckets) {
      if (ts >= bucket.start && ts < bucket.end) {
        const action = String(activity.action || "").toLowerCase();
        if (action.includes("create") || action.includes("add")) bucket.added++;
        else if (action.includes("update") || action.includes("edit") || action.includes("reorder")) bucket.updated++;
        else if (action.includes("delete") || action.includes("remove")) bucket.deleted++;
        bucket.total++;
        break;
      }
    }
  }
  const summary = buckets.reduce((acc, b) => {
    acc.total += b.total;
    acc.added += b.added;
    acc.updated += b.updated;
    acc.deleted += b.deleted;
    return acc;
  }, { total: 0, added: 0, updated: 0, deleted: 0 });
  return { periods: buckets, summary };
}
function _getPeriodMs(period) {
  switch (period) {
    case PERIODS.WEEK:
      return 7 * 24 * 60 * 60 * 1e3;
    case PERIODS.MONTH:
      return 30 * 24 * 60 * 60 * 1e3;
    case PERIODS.QUARTER:
      return 90 * 24 * 60 * 60 * 1e3;
    default:
      return 7 * 24 * 60 * 60 * 1e3;
  }
}
function _formatPeriodLabel(date, period) {
  const d = date;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  if (period === PERIODS.WEEK) return `${dd}/${mm}`;
  if (period === PERIODS.MONTH) return `${mm}/${d.getFullYear()}`;
  return `Q${Math.ceil((d.getMonth() + 1) / 3)}/${d.getFullYear()}`;
}
function TrendsView(container, options = {}) {
  const { defaultPeriod = PERIODS.WEEK } = options;
  let _currentPeriod = defaultPeriod;
  let _lastData = null;
  function render(activities, renderOptions = {}) {
    if (!container) return;
    _lastData = activities;
    const period = renderOptions.period || _currentPeriod;
    const { periods, summary } = computeTrends(activities, { period });
    const maxTotal = Math.max(...periods.map((p) => p.total), 1);
    container.innerHTML = `
      <div class="${CSS.container}">
        <div class="${CSS.header}">
          <h3>Tend\xEAncias de Altera\xE7\xF5es</h3>
          <select class="${CSS.periodSelector}" data-action="change-period">
            <option value="week" ${period === "week" ? "selected" : ""}>Semanal</option>
            <option value="month" ${period === "month" ? "selected" : ""}>Mensal</option>
            <option value="quarter" ${period === "quarter" ? "selected" : ""}>Trimestral</option>
          </select>
        </div>
        <div class="${CSS.summary}">
          <span>Total: <strong>${summary.total}</strong></span>
          <span style="color:var(--color-success, #4caf50)">+${summary.added} adicionados</span>
          <span style="color:var(--color-info, #2196f3)">${summary.updated} atualizados</span>
          <span style="color:var(--color-error, #f44336)">-${summary.deleted} removidos</span>
        </div>
        <div class="${CSS.chart}">
          ${periods.map((p) => {
      const pct = p.total / maxTotal * 100;
      const addPct = p.total > 0 ? p.added / p.total * pct : 0;
      const updPct = p.total > 0 ? p.updated / p.total * pct : 0;
      const delPct = p.total > 0 ? p.deleted / p.total * pct : 0;
      return `
              <div class="${CSS.bar}" title="${escapeHtml(p.label)}: +${p.added} ~${p.updated} -${p.deleted}">
                <div class="${CSS.barLabel}">${escapeHtml(p.label)}</div>
                <div class="${CSS.barFill}" style="width:${pct}%">
                  <div style="width:${addPct > 0 ? addPct / pct * 100 : 0}%;background:var(--color-success, #4caf50);height:100%;display:inline-block"></div>
                  <div style="width:${updPct > 0 ? updPct / pct * 100 : 0}%;background:var(--color-info, #2196f3);height:100%;display:inline-block"></div>
                  <div style="width:${delPct > 0 ? delPct / pct * 100 : 0}%;background:var(--color-error, #f44336);height:100%;display:inline-block"></div>
                </div>
                <span style="font-size:0.75em;opacity:0.7">${p.total}</span>
              </div>
            `;
    }).join("")}
        </div>
        <div class="${CSS.legend}">
          <span style="color:var(--color-success, #4caf50)">&#9632; Adicionados</span>
          <span style="color:var(--color-info, #2196f3)">&#9632; Atualizados</span>
          <span style="color:var(--color-error, #f44336)">&#9632; Removidos</span>
        </div>
      </div>
    `;
    const selector = container.querySelector(`.${CSS.periodSelector}`);
    if (selector) {
      selector.addEventListener("change", (e) => {
        _currentPeriod = e.target.value;
        if (_lastData) render(_lastData, { period: _currentPeriod });
      });
    }
    _log("info", `Trends rendered: ${periods.length} periods, period=${period}`);
  }
  function clear() {
    if (container) container.innerHTML = "";
    _lastData = null;
  }
  return { render, clear };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, periods: Object.values(PERIODS) };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var trends_view_default = { TrendsView, computeTrends, PERIODS, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  PERIODS,
  TrendsView,
  VERSION,
  computeTrends,
  trends_view_default as default,
  healthCheck,
  info,
  injectPorts
};
