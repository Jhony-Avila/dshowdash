function renderEmpty() {
  return `
    <div class="p19-empty-state" role="status">
      <svg class="p19-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="2"/>
      </svg>
      <h3 class="p19-empty-title">Nenhum dado encontrado</h3>
      <p class="p19-empty-description">Nao ha dados correspondentes aos filtros.</p>
    </div>
  `;
}
var empty_default = { renderEmpty };
const MODULE_ID = "panel-19/ui/render/empty";
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
  empty_default as default,
  healthCheck,
  info,
  renderEmpty
};
