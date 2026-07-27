function renderSkeleton() {
  return `
    <div class="p14-skeleton" role="status" aria-label="Carregando">
      <div class="p14-skeleton-row"><div class="p14-skeleton-cell"></div><div class="p14-skeleton-cell"></div><div class="p14-skeleton-cell"></div><div class="p14-skeleton-cell"></div><div class="p14-skeleton-cell"></div><div class="p14-skeleton-cell"></div><div class="p14-skeleton-cell"></div></div>
      <div class="p14-skeleton-row"><div class="p14-skeleton-cell"></div><div class="p14-skeleton-cell"></div><div class="p14-skeleton-cell"></div><div class="p14-skeleton-cell"></div><div class="p14-skeleton-cell"></div><div class="p14-skeleton-cell"></div><div class="p14-skeleton-cell"></div></div>
      <div class="p14-skeleton-row"><div class="p14-skeleton-cell"></div><div class="p14-skeleton-cell"></div><div class="p14-skeleton-cell"></div><div class="p14-skeleton-cell"></div><div class="p14-skeleton-cell"></div><div class="p14-skeleton-cell"></div><div class="p14-skeleton-cell"></div></div>
    </div>
  `;
}
var skeleton_default = { renderSkeleton };
const MODULE_ID = "panel-14/ui/render/skeleton";
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
