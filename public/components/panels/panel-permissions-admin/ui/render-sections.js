import { Templates } from "./templates.js";
const MODULE_ID = "panel-permissions-admin.ui.render-sections";
const VERSION = "9.3.0-P2-ENTERPRISE";
function renderSection(container, { title, content, collapsible = false, expanded = true }) {
  const html = `
        <div class="permissions-section ${collapsible ? "collapsible" : ""} ${expanded ? "expanded" : ""}">
            <div class="section-header">
                <h4 class="section-title">${title}</h4>
                ${collapsible ? '<button class="btn-toggle"><i class="fas fa-chevron-down"></i></button>' : ""}
            </div>
            <div class="section-content">${content}</div>
        </div>
    `;
  if (container instanceof HTMLElement) {
    container.innerHTML = html;
    if (collapsible) {
      container.querySelector(".btn-toggle")?.addEventListener("click", toggleSection);
    }
  }
  return html;
}
function toggleSection(e) {
  const section = e.target.closest(".permissions-section");
  section?.classList.toggle("expanded");
}
function renderUsers(elements, store) {
  if (!elements || !elements.userGrid) return;
  const state = store.getState();
  const users = state.users || [];
  const selectedUser = state.selectedUser;
  const selectedId = selectedUser?.id || null;
  const html = users.map((u) => Templates.userCard(u, u.id === selectedId)).join("");
  elements.userGrid.innerHTML = html || '<div class="uarps-empty">Nenhum usu\xE1rio encontrado</div>';
}
function highlightSelectedUser(elements, store) {
  if (!elements || !elements.userGrid) return;
  const state = store.getState();
  const selectedUser = state.selectedUser;
  const selectedId = selectedUser?.id || null;
  const cards = elements.userGrid.querySelectorAll("[data-user-id]");
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    card.classList.toggle("uarps-user--selected", card.dataset.userId === String(selectedId));
  }
}
function renderUserFocus(elements, store) {
  if (!elements || !elements.userFocus) return;
  const state = store.getState();
  const user = state.selectedUser;
  const T = Templates;
  if (!user) {
    elements.userFocus.innerHTML = T.userFocusEmpty();
    return;
  }
  const perms = { triggers: state.triggers || [], regions: state.regions || [] };
  elements.userFocus.innerHTML = T.userFocus(user, perms);
}
function renderMatrix(elements, store) {
  if (!elements || !elements.matrix) return;
  const state = store.getState();
  const triggers = state.triggers || [];
  const user = state.selectedUser;
  const T = Templates;
  if (!user || !triggers.length) {
    elements.matrix.innerHTML = T.matrixEmpty ? T.matrixEmpty() : '<div class="uarps-matrix__empty">Selecione um usu\xE1rio</div>';
    return;
  }
  const regions = state.regions || [];
  elements.matrix.innerHTML = T.regionMatrix ? T.regionMatrix(triggers, regions, user) : "";
}
function renderStats(elements, store) {
  if (!elements || !elements.stats) return;
  const state = store.getState();
  const T = Templates;
  const selectedUser = state.selectedUser;
  const data = {
    totalUsers: (state.users || []).length,
    totalTriggers: (state.triggers || []).length,
    totalRegions: (state.regions || []).length,
    selectedTriggers: 0,
    selectedRegions: 0
  };
  if (selectedUser) {
    data.selectedTriggers = (selectedUser.triggers || []).length;
    data.selectedRegions = (selectedUser.regions || []).length;
  }
  elements.stats.innerHTML = T.stats(data);
}
function renderLoadingState(container, store) {
  if (!container) return;
  const state = store.getState();
  const loading = state.loading;
  const overlay = container.querySelector(".uarps-loading-overlay");
  if (loading) {
    if (!overlay) {
      const el = document.createElement("div");
      el.className = "uarps-loading-overlay";
      el.innerHTML = '<div class="uarps-spinner"></div>';
      container.appendChild(el);
    }
  } else if (overlay) {
    overlay.remove();
  }
}
var render_sections_default = { renderSection, renderUsers, highlightSelectedUser, renderUserFocus, renderMatrix, renderStats, renderLoadingState };
export {
  MODULE_ID,
  VERSION,
  render_sections_default as default,
  highlightSelectedUser,
  renderLoadingState,
  renderMatrix,
  renderSection,
  renderStats,
  renderUserFocus,
  renderUsers
};
