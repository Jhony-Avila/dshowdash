const MODULE_ID = "panel-16.ui.render.controls";
const VERSION = "9.3.0-P2-ENTERPRISE";
function renderControls(container, options = {}) {
  const { onRefresh, onExport, onFilter } = options;
  const html = `
        <div class="panel-controls">
            <button class="btn btn-sm btn-refresh" title="Atualizar">
                <i class="fas fa-sync-alt"></i>
            </button>
            <button class="btn btn-sm btn-export" title="Exportar">
                <i class="fas fa-download"></i>
            </button>
            <button class="btn btn-sm btn-filter" title="Filtrar">
                <i class="fas fa-filter"></i>
            </button>
        </div>
    `;
  container.innerHTML = html;
  if (onRefresh) container.querySelector(".btn-refresh")?.addEventListener("click", onRefresh);
  if (onExport) container.querySelector(".btn-export")?.addEventListener("click", onExport);
  if (onFilter) container.querySelector(".btn-filter")?.addEventListener("click", onFilter);
}
var controls_default = { renderControls };
export {
  MODULE_ID,
  VERSION,
  controls_default as default,
  renderControls
};
