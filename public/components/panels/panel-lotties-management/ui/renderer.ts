// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-lotties-management/ui
// PURPOSE: Renderização declarativa a partir do ESTADO (nunca de listas fixas): estados carregando / vazio /
//          erro / pronto, cards das animações do catálogo canônico, linhas de atribuição por componente e
//          modal de preview. HTML escapado. Sem listeners (ui/events.js cuida disso).
// IMPORTS: (nenhum)
// PROVIDES: ui.renderSkeleton(), ui.render(), healthCheck(), info(), VERSION, MODULE_ID
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '10.0.0';
export const MODULE_ID = 'panel-lotties-management/ui';

export interface LottieItem { id: string; file: string; name: string; url: string; disponivel: boolean | null }
export interface ComponentSlot { id: string; name: string; slot: string; current: string | null }
export interface PanelState {
  lotties: LottieItem[];
  components: ComponentSlot[];
  assignments: Record<string, string>;
  selectedLottie: string | null;
  selectedComponent: string | null;
  previewActive: boolean;
  previewLottie: string | null;
  loading: boolean;
  error: string | null;
  catalogo: 'carregando' | 'pronto' | 'vazio' | 'erro';
  catalogoOrigem: string | null;
  lastUpdate: number | null;
}

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const ICON_PLAY = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
const ICON_CLOSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
const ICON_TITLE = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>';

function renderHeader(state: PanelState) {
  return `<header class="lotties-panel__header"><div class="lotties-panel__title">${ICON_TITLE}<h1>Gestão de Lotties</h1></div><div class="lotties-panel__stats"><span class="stat"><strong>${state.lotties.length}</strong> animações</span><span class="stat"><strong>${state.components.length}</strong> componentes</span>${state.catalogoOrigem ? `<span class="stat lotties-panel__origin" title="Catálogo lido do módulo canônico de animações">fonte: <code>${esc(state.catalogoOrigem)}</code></span>` : ''}</div></header>`;
}
function renderState(kind: 'carregando' | 'vazio' | 'erro', message?: string | null) {
  if (kind === 'carregando') return '<div class="lotties-panel__state is-loading" role="status" aria-live="polite" data-state-block="carregando"><div class="skeleton-grid"><div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div></div><p>Carregando catálogo de animações…</p></div>';
  if (kind === 'vazio') return '<div class="lotties-panel__state is-empty" data-state-block="vazio"><h3>Nenhuma animação no catálogo</h3><p>O módulo canônico <code>/assets/animacoes/index.js</code> não expôs animações.</p><button type="button" class="btn-reload" data-action="recarregar">Recarregar catálogo</button></div>';
  return `<div class="lotties-panel__state is-error" role="alert" data-state-block="erro"><h3>Não foi possível carregar o catálogo</h3><p>${esc(message || 'Falha ao ler o módulo canônico de animações.')}</p><button type="button" class="btn-reload" data-action="recarregar">Tentar novamente</button></div>`;
}
function renderLottieCard(item: LottieItem, state: PanelState) {
  const isSelected = state.selectedLottie === item.id;
  const isAssigned = Object.values(state.assignments || {}).includes(item.id);
  const ausente = item.disponivel === false;
  return `<div class="lottie-card${isSelected ? ' selected' : ''}${isAssigned ? ' assigned' : ''}${ausente ? ' is-missing' : ''}" data-lottie-id="${esc(item.id)}"><div class="lottie-card__preview" data-lottie-preview="${esc(item.id)}"><div class="lottie-card__animation" data-animation-container="${esc(item.id)}"></div><div class="lottie-card__overlay"><button type="button" class="btn-preview" data-action="preview" data-lottie="${esc(item.id)}" title="Preview" aria-label="Preview de ${esc(item.name)}"${ausente ? ' disabled' : ''}>${ICON_PLAY}</button></div></div><div class="lottie-card__info"><h3 class="lottie-card__name">${esc(item.name)}</h3><p class="lottie-card__file"><code>${esc(item.url)}</code></p>${ausente ? '<p class="lottie-card__desc badge-missing">Arquivo ausente na origem</p>' : ''}</div><div class="lottie-card__actions"><button type="button" class="btn-select${isSelected ? ' active' : ''}" data-action="select" data-lottie="${esc(item.id)}">${isSelected ? 'Selecionado' : 'Selecionar'}</button>${isAssigned ? '<span class="badge-assigned">Em uso</span>' : ''}</div></div>`;
}
function renderComponentRow(comp: ComponentSlot, state: PanelState) {
  const byId = new Map(state.lotties.map((l) => [l.id, l]));
  const currentLottie = state.assignments?.[comp.id] || comp.current;
  const lottieName = currentLottie ? (byId.get(currentLottie)?.name || 'Nenhum') : 'Nenhum';
  const isSelected = state.selectedComponent === comp.id;
  const options = state.lotties.map((l) => `<option value="${esc(l.id)}"${currentLottie === l.id ? ' selected' : ''}>${esc(l.name)}</option>`).join('');
  return `<div class="component-row${isSelected ? ' selected' : ''}${currentLottie ? ' has-lottie' : ''}" data-component-id="${esc(comp.id)}"><div class="component-row__info"><h4 class="component-row__name">${esc(comp.name)}</h4><code class="component-row__slot">${esc(comp.slot)}</code></div><div class="component-row__current"><span class="current-label">Atual:</span><span class="current-value ${currentLottie ? 'active' : 'empty'}">${esc(lottieName)}</span></div><div class="component-row__actions"><label class="sr-only" for="lottie-select-${esc(comp.id)}">Animação para ${esc(comp.name)}</label><select id="lottie-select-${esc(comp.id)}" class="lottie-select" data-action="assign" data-component="${esc(comp.id)}"><option value="">-- Selecionar Lottie --</option>${options}</select>${currentLottie ? `<button type="button" class="btn-remove" data-action="unassign" data-component="${esc(comp.id)}" title="Remover" aria-label="Remover animação de ${esc(comp.name)}">${ICON_CLOSE}</button>` : ''}</div></div>`;
}
function renderPreview(state: PanelState) {
  const item = state.previewLottie ? state.lotties.find((l) => l.id === state.previewLottie) : null;
  return `<div class="lotties-panel__preview${state.previewActive ? ' active' : ''}" data-preview-modal role="dialog" aria-modal="true" aria-label="Preview da animação"${state.previewActive ? '' : ' hidden'}><div class="preview-backdrop" data-close-preview></div><div class="preview-content"><header class="preview-header"><h3>Preview: ${esc(item ? item.name : '')}</h3><button type="button" class="preview-close" data-close-preview aria-label="Fechar">${ICON_CLOSE}</button></header><div class="preview-animation" data-preview-container></div><footer class="preview-footer"><code>${esc(item ? item.url : '')}</code></footer></div></div>`;
}

export const ui = {
  renderSkeleton(container: HTMLElement) {
    container.innerHTML = `<div class="lotties-panel" data-panel="panel-lotties-management" data-state="carregando"><div class="lotties-panel__skeleton"><div class="skeleton-header"></div>${renderState('carregando')}</div></div>`;
  },
  render(container: HTMLElement, state: PanelState) {
    let body: string;
    if (state.catalogo === 'carregando') body = renderState('carregando');
    else if (state.catalogo === 'erro') body = renderState('erro', state.error);
    else if (state.catalogo === 'vazio' || state.lotties.length === 0) body = renderState('vazio');
    else body = `<div class="lotties-panel__content"><section class="lotties-section" aria-labelledby="lotties-sec-anim"><h2 class="section-title" id="lotties-sec-anim">Animações disponíveis</h2><div class="lotties-grid">${state.lotties.map((it) => renderLottieCard(it, state)).join('')}</div></section><section class="components-section" aria-labelledby="lotties-sec-comp"><h2 class="section-title" id="lotties-sec-comp">Componentes para atribuição</h2><div class="components-list">${state.components.map((c) => renderComponentRow(c, state)).join('')}</div></section></div>`;
    container.innerHTML = `<div class="lotties-panel" data-panel="panel-lotties-management" data-state="${esc(state.catalogo)}">${renderHeader(state)}${body}${renderPreview(state)}</div>`;
  }
};

export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { ui, healthCheck, info, VERSION, MODULE_ID };
