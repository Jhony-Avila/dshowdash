/* ═══════════════════════════════════════════════════════════════
 * DEPENDENCY CONTRACT — panel-criacao-botoes/index.ts
 * @version 1.3.0
 * MODULE: panel-criacao-botoes
 * PURPOSE: Visão especializada da sidebar — criação/edição de botões
 *          (ui_nav_items). Escrita única via adapter compartilhado.
 *
 * IMPORTS (INTERNAL):
 *   ./core/constants.js     → { PANEL_ID, MODULE_ID, VERSION, CSS_PREFIX }
 *   ./core/config.js        → { CONFIG }
 *   ./state/store.js        → { store }
 *   ./handlers/data.js      → { loadData, loadRealPanels }   (lazy adapter)
 *   ./handlers/events.js    → { setupEvents }
 *   ./ui/list/group-list.js → { renderGroupList }
 *   ./ui/form/button-form.js→ { renderForm }
 *   ./render/skeleton.js    → { renderSkeleton }
 *   ./render/empty-state.js → { renderEmptyState, renderErrorState }
 *   ./init/lifecycle.js     → { loadCSS, healthCheck, info }
 *   ./telemetry/tracker.js  → { trackMount, trackUnmount }
 *
 * EXPORTS (PUBLIC API):
 *   mount(root, config) → Promise<boolean>
 *   unmount, destroy, dispose, injectPorts, getPorts
 *   healthCheck, info, getVersion, getStatus, VERSION, MODULE_ID
 *   default: { ...todos }
 *
 * NOTA DE ETAPA: Etapas 1-6 prontas — listar, criar, editar, ativar/
 *   desativar (updateItem; sem delete, PNR) e preview. Falta go-live
 *   (Etapa 7: registro em panel_registry + UPDATE ui_nav_items id=186).
 * ═══════════════════════════════════════════════════════════════ */
'use strict';

import { PANEL_ID, MODULE_ID, VERSION, CSS_PREFIX } from './core/constants.js';
import { CONFIG } from './core/config.js';
import { store } from './state/store.js';
import { loadData, loadRealPanels } from './handlers/data.js';
import { setupEvents } from './handlers/events.js';
import { renderGroupList } from './ui/list/group-list.js';
import { renderForm } from './ui/form/button-form.js';
import { renderSkeleton } from './render/skeleton.js';
import { renderEmptyState, renderErrorState } from './render/empty-state.js';
import { loadCSS, healthCheck as buildHealthCheck, info as buildInfo } from './init/lifecycle.js';
import { trackMount, trackUnmount } from './telemetry/tracker.js';

import type { MountConfig, PanelPorts, PanelCriacaoState } from './core/types.js';

// ─── Estado de instância ───
let _container: HTMLElement | null = null;
let _ports: PanelPorts = {};
let _mounted = false;
let _unsubscribe: (() => void) | null = null;
let _cleanupEvents: (() => void) | null = null;

export const injectPorts = (p: PanelPorts): PanelPorts => {
  _ports = { ..._ports, ...(p || {}) };
  return _ports;
};
export const getPorts = (): PanelPorts => _ports;

function _escape(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _renderBody(state: PanelCriacaoState): string {
  if (state.mode === 'create' || state.mode === 'edit') {
    return renderForm({
      mode: state.mode,
      groups: state.groups,
      realPanels: state.realPanels,
      icons: state.icons,
      editing: state.editing,
    });
  }
  if (state.loading) return renderSkeleton();
  if (state.error) return renderErrorState(state.error);
  const totalItems = state.groups.reduce((n, g) => n + g.items.length, 0);
  if (totalItems === 0) return renderEmptyState();
  return renderGroupList(state.groups);
}

function _renderToolbar(state: PanelCriacaoState): string {
  if (state.mode === 'create' || state.mode === 'edit') return '';
  return `<button type="button" class="${CSS_PREFIX}-btn ${CSS_PREFIX}-btn--primary" data-action="new">${_escape(CONFIG.labels.new)}</button>`;
}

function _renderShell(): string {
  return `
    <div class="${CSS_PREFIX}" data-panel="${PANEL_ID}">
      <header class="${CSS_PREFIX}-header">
        <div>
          <h2 class="${CSS_PREFIX}-header__title">${_escape(CONFIG.title)}</h2>
          <p class="${CSS_PREFIX}-header__subtitle">${_escape(CONFIG.subtitle)}</p>
        </div>
        <div class="${CSS_PREFIX}-header__actions" data-role="toolbar"></div>
      </header>
      <div class="${CSS_PREFIX}-body" data-role="body"></div>
    </div>`;
}

function _paint(state: PanelCriacaoState): void {
  if (!_container) return;
  const body = _container.querySelector<HTMLElement>(`.${CSS_PREFIX}-body`);
  if (body) body.innerHTML = _renderBody(state);
  const toolbar = _container.querySelector<HTMLElement>(`.${CSS_PREFIX}-header__actions`);
  if (toolbar) toolbar.innerHTML = _renderToolbar(state);
}

export const mount = (root: HTMLElement, config: MountConfig = {}): Promise<boolean> => {
  loadCSS();
  injectPorts((config.ports as PanelPorts) || {});
  _container = root;
  root.innerHTML = _renderShell();

  _unsubscribe = store.subscribe(_paint);
  _cleanupEvents = setupEvents(root);

  store.setLoading(true);
  _paint(store.getState());

  _mounted = true;
  trackMount();

  // Cargas assíncronas (lazy-importam o adapter compartilhado p/ nav).
  void loadData();
  void loadRealPanels();

  return Promise.resolve(true);
};

export const unmount = (): void => {
  trackUnmount();
  if (_cleanupEvents) {
    _cleanupEvents();
    _cleanupEvents = null;
  }
  if (_unsubscribe) {
    _unsubscribe();
    _unsubscribe = null;
  }
  if (_container) _container.innerHTML = '';
  _container = null;
  _mounted = false;
  store.reset();
};

export const destroy = (): void => unmount();
export const dispose = (): void => unmount();

export const getVersion = (): string => VERSION;
export const getStatus = (): { mounted: boolean; version: string; moduleId: string } => ({
  mounted: _mounted,
  version: VERSION,
  moduleId: MODULE_ID,
});

export const healthCheck = buildHealthCheck;
export const info = buildInfo;

export { VERSION, MODULE_ID };

export default {
  mount,
  unmount,
  destroy,
  dispose,
  injectPorts,
  getPorts,
  healthCheck,
  info,
  getVersion,
  getStatus,
  VERSION,
  MODULE_ID,
};
