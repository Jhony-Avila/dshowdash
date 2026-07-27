import { ICONS } from "./constants.js";
function updateFooter(ctx) {
  const footer = ctx._state.refs.footer;
  if (!footer) return;
  const displayData = ctx._state.getDisplayData();
  if (ctx._state.scrollMode === "virtual") {
    footer.innerHTML = `<div class="p05-virtual-info"><span>${displayData.length} registros</span><span class="p05-scroll-mode-label">Virtual Scroll</span></div>`;
  } else if (ctx._state.scrollMode === "infinite") {
    footer.innerHTML = `<div class="p05-infinite-info">${displayData.length} registros carregados${ctx._state.infiniteHasMore ? "" : " (todos)"}</div>`;
  } else {
    const totalPages = ctx._state.getTotalPages();
    footer.innerHTML = renderPagination(ctx._state.page, totalPages, displayData.length);
  }
}
function renderPagination(page, total, count) {
  if (total <= 1) {
    return `<div class="p05-pagination"><span class="p05-pagination-info">${count} registros</span></div>`;
  }
  const pages = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(total, page + 2); i++) {
    pages.push(i);
  }
  return `
    <nav class="p05-pagination">
      <span class="p05-pagination-info">${count} registros</span>
      <div class="p05-pagination-controls">
        <button class="p05-btn-page" data-action="page" data-page="1" ${page === 1 ? "disabled" : ""}>Primeira</button>
        <button class="p05-btn-page" data-action="page" data-page="${page - 1}" ${page === 1 ? "disabled" : ""}>${ICONS.chevronLeft}</button>
        ${pages.map((p) => `<button class="p05-btn-page ${p === page ? "p05-active" : ""}" data-action="page" data-page="${p}">${p}</button>`).join("")}
        <button class="p05-btn-page" data-action="page" data-page="${page + 1}" ${page === total ? "disabled" : ""}>${ICONS.chevronRight}</button>
        <button class="p05-btn-page" data-action="page" data-page="${total}" ${page === total ? "disabled" : ""}>\xDAltima</button>
      </div>
    </nav>
  `;
}
var render_footer_default = { updateFooter, renderPagination };
const MODULE_ID = "panel-05:table:render-footer";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { renderFooterReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  render_footer_default as default,
  healthCheck,
  info,
  renderPagination,
  updateFooter
};
