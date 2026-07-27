const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-management/ui/templates/skeleton";
function renderSkeleton(container) {
  container.innerHTML = `<div class="panel-user-management"><div class="panel-header"><div class="panel-title-group"><h2><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Gest\xE3o de Usu\xE1rios</h2><span class="panel-subtitle">Administra\xE7\xE3o de contas e permiss\xF5es</span></div><div class="panel-header-actions"><button class="btn-icon" data-action="refresh" title="Atualizar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button></div></div><div class="panel-toolbar"><div class="search-group"><input type="text" placeholder="Buscar por nome, email ou identificador..." class="search-input" data-field="search"></div><div class="filter-group"><select data-field="status" class="filter-select"><option value="">Status</option><option value="active">Ativo</option><option value="disabled">Inativo</option><option value="pending">Pendente</option></select><select data-field="role" class="filter-select"><option value="">Role</option></select><button data-action="search" class="btn-search">Buscar</button></div></div><div class="panel-content"><div class="users-grid">${Array(8).fill('<div class="skeleton-card"><div class="skeleton-line skeleton-avatar"></div><div style="flex:1"><div class="skeleton-line" style="width:70%;height:14px;margin-bottom:6px"></div><div class="skeleton-line" style="width:90%;height:10px"></div></div></div>').join("")}</div></div><div class="panel-details" style="display:none;"></div></div>`;
}
var skeleton_default = { renderSkeleton };
export {
  MODULE_ID,
  VERSION,
  skeleton_default as default,
  renderSkeleton
};
