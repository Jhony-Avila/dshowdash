const SVGS = {
  calendar: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  calendarDays: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/></svg>',
  calendarRange: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M17 14h-6"/><path d="M13 18H7"/></svg>',
  download: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  trendingUp: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  barChart: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
  target: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>'
};
function renderStructure() {
  return `
    <div class="p09-dashboard p09-animate" style="display:flex;flex-direction:column;gap:14px;padding:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div class="p09-tabs" style="display:flex;gap:6px;">
          <button data-tab="today_vs_yesterday" class="p09-tab p09-tab-active" style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:#6366f1;border:none;border-radius:6px;color:#fff;font-size:11px;cursor:pointer;transition:all 0.2s;font-weight:500;">${SVGS.calendar} Hoje vs Ontem</button>
          <button data-tab="this_week_vs_last_week" class="p09-tab" style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:#16161f;border:1px solid #2a2a3a;border-radius:6px;color:#a0a0b0;font-size:11px;cursor:pointer;transition:all 0.2s;">${SVGS.calendarDays} Semana</button>
          <button data-tab="this_month_vs_last_month" class="p09-tab" style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:#16161f;border:1px solid #2a2a3a;border-radius:6px;color:#a0a0b0;font-size:11px;cursor:pointer;transition:all 0.2s;">${SVGS.calendarRange} M\xEAs</button>
        </div>
        <div style="display:flex;gap:6px;">
          <button data-export="csv" class="p09-btn" style="padding:6px 12px;background:#16161f;border:1px solid #2a2a3a;border-radius:6px;color:#a0a0b0;font-size:10px;cursor:pointer;display:flex;align-items:center;gap:4px;">${SVGS.download} CSV</button>
          <button data-export="json" class="p09-btn" style="padding:6px 12px;background:#16161f;border:1px solid #2a2a3a;border-radius:6px;color:#a0a0b0;font-size:10px;cursor:pointer;display:flex;align-items:center;gap:4px;">${SVGS.download} JSON</button>
        </div>
      </div>
      <div class="p09-summary" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
        <div class="p09-card" style="background:#16161f;border:1px solid #2a2a3a;border-radius:8px;padding:14px;transition:all 0.2s;">
          <div style="display:flex;justify-content:space-between;align-items:start;">
            <div>
              <span style="font-size:10px;color:#606070;text-transform:uppercase;">Taxa de Sucesso</span>
              <div style="display:flex;align-items:baseline;gap:6px;margin-top:4px;">
                <span data-success-rate style="font-size:28px;font-weight:700;color:#22c55e;">--%</span>
                <span data-success-change style="font-size:11px;color:#22c55e;"></span>
              </div>
            </div>
            <div data-donut style="width:50px;height:50px;"></div>
          </div>
          <div data-sparkline-success style="height:24px;margin-top:8px;"></div>
        </div>
        <div data-summary-cards style="display:contents;"></div>
      </div>
      <div class="p09-card" style="background:#16161f;border:1px solid #2a2a3a;border-radius:8px;padding:16px;transition:all 0.2s;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <span style="font-size:12px;font-weight:600;color:#f0f0f5;display:flex;align-items:center;gap:6px;">${SVGS.trendingUp} Tend\xEAncia dos \xDAltimos 7 Dias</span>
          <div style="display:flex;gap:12px;font-size:10px;">
            <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:3px;background:#6366f1;border-radius:2px;"></span> Execu\xE7\xF5es</span>
            <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:3px;background:#22c55e;border-radius:2px;"></span> Sucessos</span>
            <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:3px;background:#ef4444;border-radius:2px;"></span> Falhas</span>
          </div>
        </div>
        <div data-line-chart style="height:120px;position:relative;"></div>
      </div>
      <div data-comparison class="p09-comparison" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;"></div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;">
        <div class="p09-card" style="background:#16161f;border:1px solid #2a2a3a;border-radius:8px;padding:16px;transition:all 0.2s;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:12px;font-weight:600;color:#f0f0f5;display:flex;align-items:center;gap:6px;">${SVGS.barChart} Comparativo</span>
            <div style="display:flex;gap:10px;font-size:10px;">
              <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;background:#6366f1;border-radius:2px;"></span> Atual</span>
              <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;background:#3a3a4a;border-radius:2px;"></span> Anterior</span>
            </div>
          </div>
          <div data-bar-chart style="height:100px;"></div>
        </div>
        <div class="p09-card" style="background:#16161f;border:1px solid #2a2a3a;border-radius:8px;padding:16px;transition:all 0.2s;">
          <div style="margin-bottom:12px;"><span style="font-size:12px;font-weight:600;color:#f0f0f5;display:flex;align-items:center;gap:6px;">${SVGS.target} Distribui\xE7\xE3o de Status</span></div>
          <div data-status-dist style="display:flex;flex-direction:column;gap:8px;"></div>
        </div>
      </div>
      <div data-alerts style="display:flex;gap:10px;"></div>
      <div class="p09-tooltip" data-tooltip></div>
    </div>
  `;
}
var structure_default = { renderStructure };
const MODULE_ID = "panels-ui-render-structure";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true } };
}
export {
  MODULE_ID,
  VERSION,
  structure_default as default,
  healthCheck,
  info,
  renderStructure
};
