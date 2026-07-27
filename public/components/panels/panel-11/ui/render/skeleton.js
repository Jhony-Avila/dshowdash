function renderSkeleton() {
  return `
    <div class="p11-wrapper" role="region" aria-label="Resumo Geral">
      <header class="p11-header p11-skeleton-header">
        <div class="p11-skeleton-title">
          <div class="p11-skeleton p11-skeleton-icon"></div>
          <div class="p11-skeleton p11-skeleton-text-lg"></div>
        </div>
        <div class="p11-skeleton-actions">
          <div class="p11-skeleton p11-skeleton-btn"></div>
          <div class="p11-skeleton p11-skeleton-btn"></div>
        </div>
      </header>
      <div class="p11-skeleton-kpis">
        ${[1, 2, 3, 4].map(() => `
          <div class="p11-skeleton-kpi">
            <div class="p11-skeleton p11-skeleton-kpi-label"></div>
            <div class="p11-skeleton p11-skeleton-kpi-value"></div>
            <div class="p11-skeleton p11-skeleton-kpi-footer"></div>
          </div>
        `).join("")}
      </div>
      <div class="p11-skeleton-chart">
        <div class="p11-skeleton p11-skeleton-chart-title"></div>
        <div class="p11-skeleton p11-skeleton-chart-body"></div>
      </div>
      <div class="p11-skeleton-grid">
        ${[1, 2, 3].map(() => `
          <div class="p11-skeleton-grid-card">
            <div class="p11-skeleton p11-skeleton-grid-title"></div>
            <div class="p11-skeleton p11-skeleton-grid-body"></div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}
var skeleton_default = { renderSkeleton };
const MODULE_ID = "panels-ui-render-skeleton";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { skeletonReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  skeleton_default as default,
  healthCheck,
  info,
  renderSkeleton
};
