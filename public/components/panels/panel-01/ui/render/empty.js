const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/render/empty";
function renderEmpty(message = "Nenhuma requisi\xE7\xE3o encontrada") {
  return `
    <div class="p01-empty-state">
      <div class="p01-empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <path d="M14 2v6h6"/>
          <path d="M12 18v-6M9 15h6"/>
        </svg>
      </div>
      <h3 class="p01-empty-title">${message}</h3>
      <p class="p01-empty-text">Tente ajustar os filtros ou realizar uma nova busca.</p>
    </div>
  `;
}
function renderNoResults(query) {
  return `
    <div class="p01-empty-state p01-empty-state--search">
      <div class="p01-empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
          <path d="M8 8l6 6M14 8l-6 6"/>
        </svg>
      </div>
      <h3 class="p01-empty-title">Nenhum resultado para "${query}"</h3>
      <p class="p01-empty-text">Verifique a ortografia ou tente termos diferentes.</p>
    </div>
  `;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var empty_default = { renderEmpty, renderNoResults };
export {
  MODULE_ID,
  VERSION,
  empty_default as default,
  healthCheck,
  info,
  renderEmpty,
  renderNoResults
};
