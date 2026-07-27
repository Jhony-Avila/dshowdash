const MODULE_ID = "panel-user-management.ui.template";
const VERSION = "9.3.0-P2-ENTERPRISE";
import { renderUserCard } from "./templates/card.js";
import { renderSkeleton as _renderSkeletonFull } from "./templates/skeleton.js";
import { renderEditModal } from "./templates/modal.js";
function renderSkeleton() {
  const div = document.createElement("div");
  _renderSkeletonFull(div);
  return div.innerHTML;
}
function renderAuthBlocked() {
  return '<div class="panel-user-management"><div class="panel-empty-state auth-blocked"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><h3>Acesso Restrito</h3><p>Faca login para gerenciar usuarios</p><button class="btn-primary" data-action="login">Fazer Login</button></div></div>';
}
function renderError(message) {
  return `<div class="panel-user-management"><div class="panel-empty-state error-state"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div><h3>Erro ao Carregar</h3><p>${message || "Erro desconhecido"}</p><button class="btn-primary" data-action="retry">Tentar Novamente</button></div></div>`;
}
function renderUserList(users, options) {
  const pagination = options.pagination || {};
  const search = options.search || "";
  const loading = options.loading || false;
  let html = `<div class="panel-user-management"><div class="panel-header"><div class="panel-title-group"><h2><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Gestao de Usuarios</h2><span class="panel-subtitle">${users ? users.length : 0} usuarios</span></div><div class="panel-header-actions"><button class="btn-icon" data-action="refresh" title="Atualizar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button><button class="btn-primary btn-sm" data-action="create-user">+ Novo</button></div></div><div class="panel-toolbar"><div class="search-group"><input type="text" placeholder="Buscar por nome, email..." class="search-input" data-filter="search" value="${search || ""}"></div></div><div class="panel-content"><div class="users-grid">`;
  if (users && users.length > 0) {
    for (let i = 0; i < users.length; i++) {
      html += renderUserCard(users[i]);
    }
  } else {
    html += '<div class="panel-empty-state"><p>Nenhum usuario encontrado</p></div>';
  }
  html += "</div></div>";
  const paginationObj = pagination;
  if (Number(paginationObj.total) > 0) {
    html += renderPagination(paginationObj);
  }
  html += "</div>";
  return html;
}
function renderUserDetail(user, state) {
  const div = document.createElement("div");
  renderEditModal(div, user, state.cachedAvatars || [], state.avatarSelectorOpen || false);
  return div.innerHTML;
}
function renderPagination(pagination) {
  const offset = Number(pagination.offset) || 0;
  const limit = Number(pagination.limit) || 20;
  const total = Number(pagination.total) || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return "";
  let html = '<div class="panel-pagination">';
  if (currentPage > 1) {
    html += `<button class="btn-page" data-action="page" data-page="${currentPage - 1}">Anterior</button>`;
  }
  html += `<span class="page-info">Pagina ${currentPage} de ${totalPages}</span>`;
  if (currentPage < totalPages) {
    html += `<button class="btn-page" data-action="page" data-page="${currentPage + 1}">Proxima</button>`;
  }
  html += "</div>";
  return html;
}
var template_default = { renderSkeleton, renderAuthBlocked, renderError, renderUserList, renderUserDetail, renderPagination };
export {
  MODULE_ID,
  VERSION,
  template_default as default,
  renderAuthBlocked,
  renderError,
  renderPagination,
  renderSkeleton,
  renderUserDetail,
  renderUserList
};
