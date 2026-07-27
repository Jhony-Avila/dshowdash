import { AVAILABLE_LOTTIES, ASSIGNABLE_COMPONENTS } from "../core/lifecycle.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-lotties-management/ui";
const ui = {
  renderSkeleton(container) {
    container.innerHTML = '<div class="lotties-panel" data-panel="panel-lotties-management"><div class="lotties-panel__skeleton"><div class="skeleton-header"></div><div class="skeleton-grid"><div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div></div></div></div>';
  },
  render(container, state) {
    const lotties = Object.entries(AVAILABLE_LOTTIES);
    const components = ASSIGNABLE_COMPONENTS;
    const _lotties = AVAILABLE_LOTTIES;
    container.innerHTML = `<div class="lotties-panel" data-panel="panel-lotties-management"><header class="lotties-panel__header"><div class="lotties-panel__title"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg><h1>Gerenciamento de Lotties</h1></div><div class="lotties-panel__stats"><span class="stat"><strong>${lotties.length}</strong> animacoes</span><span class="stat"><strong>${components.length}</strong> componentes</span></div></header><div class="lotties-panel__content"><section class="lotties-section"><h2 class="section-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg> Animacoes Disponiveis</h2><div class="lotties-grid">${lotties.map((arr) => ui._renderLottieCard(arr[0], arr[1], state)).join("")}</div></section><section class="components-section"><h2 class="section-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> Componentes para Atribuicao</h2><div class="components-list">${components.map((comp) => ui._renderComponentRow(comp, state)).join("")}</div></section></div><div class="lotties-panel__preview ${state.previewActive ? "active" : ""}" data-preview-modal><div class="preview-backdrop" data-close-preview></div><div class="preview-content"><header class="preview-header"><h3>Preview: ${state.previewLottie ? _lotties[state.previewLottie]?.name || "" : ""}</h3><button class="preview-close" data-close-preview aria-label="Fechar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></header><div class="preview-animation" data-preview-container></div><footer class="preview-footer"><p>${state.previewLottie ? _lotties[state.previewLottie]?.description || "" : ""}</p></footer></div></div></div>`;
  },
  _renderLottieCard(id, lottie, state) {
    const isSelected = state.selectedLottie === id;
    const isAssigned = Object.values(state.assignments || {}).includes(id);
    return `<div class="lottie-card ${isSelected ? "selected" : ""} ${isAssigned ? "assigned" : ""}" data-lottie-id="${id}"><div class="lottie-card__preview" data-lottie-preview="${id}"><div class="lottie-card__animation" data-animation-container="${id}"></div><div class="lottie-card__overlay"><button class="btn-preview" data-action="preview" data-lottie="${id}" title="Preview"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></button></div></div><div class="lottie-card__info"><h3 class="lottie-card__name">${lottie.name}</h3><p class="lottie-card__file">${lottie.file}</p><p class="lottie-card__desc">${lottie.description}</p></div><div class="lottie-card__actions"><button class="btn-select ${isSelected ? "active" : ""}" data-action="select" data-lottie="${id}">${isSelected ? "Selecionado" : "Selecionar"}</button>${isAssigned ? '<span class="badge-assigned">Em uso</span>' : ""}</div></div>`;
  },
  _renderComponentRow(comp, state) {
    const _lotties = AVAILABLE_LOTTIES;
    const currentLottie = state.assignments?.[comp.id] || comp.current;
    const lottieName = currentLottie ? _lotties[currentLottie]?.name || "Nenhum" : "Nenhum";
    const isSelected = state.selectedComponent === comp.id;
    const options = Object.entries(AVAILABLE_LOTTIES).map((arr) => `<option value="${arr[0]}"${currentLottie === arr[0] ? " selected" : ""}>${arr[1].name}</option>`).join("");
    return `<div class="component-row ${isSelected ? "selected" : ""} ${currentLottie ? "has-lottie" : ""}" data-component-id="${comp.id}"><div class="component-row__info"><h4 class="component-row__name">${comp.name}</h4><code class="component-row__slot">${comp.slot}</code></div><div class="component-row__current"><span class="current-label">Atual:</span><span class="current-value ${currentLottie ? "active" : "empty"}">${lottieName}</span></div><div class="component-row__actions"><select class="lottie-select" data-action="assign" data-component="${comp.id}"><option value="">-- Selecionar Lottie --</option>${options}</select>${currentLottie ? `<button class="btn-remove" data-action="unassign" data-component="${comp.id}" title="Remover"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>` : ""}</div></div>`;
  }
};
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var renderer_default = { ui, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  renderer_default as default,
  healthCheck,
  info,
  ui
};
