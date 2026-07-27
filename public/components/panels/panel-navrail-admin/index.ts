/* ═══════════════════════════════════════════════════════════════
 * DEPENDENCY CONTRACT — panel-navrail-admin/index.js
 * @version 9.3.0-P2-ENTERPRISE
 * @batch Batch Z (Contract #217 of 217)
 *
 * IMPORTS (EXTERNAL):
 *   /core/runtime/ports-profiles.js → { createPanelPorts }
 *   ./core/lifecycle.js             → { PanelLifecycle }
 *   ./core/navrail-adapter.js       → { NavRailAdapter }
 *   ./state/store.js                → { PanelStore }
 *   ./telemetry/tracker.js          → { PanelTracker }
 *   ./ui/renderer.js                → { PanelRenderer }
 *   ./handlers/crud.js              → * as CrudHandlers (openItemForm, confirmDelete, toggleItem, saveItem)
 *   ./handlers/ui-actions.js        → * as UIActions (showLoading, showToast, closeAllModals)
 *   ./handlers/drag-drop.js         → * as DragDrop (init, refresh, destroy)
 *   ./handlers/preview.js           → * as Preview (init, update, toggleExpand)
 *   ./handlers/sync.js              → * as Sync (initSync, triggerSync, refreshLiveNavRail, destroy)
 *
 * EXPORTS (PUBLIC API):
 *   getVersion(), injectPorts(), getPorts()
 *   PanelNavRailAdmin (class), VERSION, MODULE_ID
 *   default: singleton instance (mount, unmount, init, healthCheck, info)
 *
 * GLOBALS:
 *   (window as any).PanelNavRailAdmin (singleton instance)
 *
 * BROWSER APIs:
 *   document.querySelector, AbortController, Promise.all
 *   addEventListener (click, input, change, submit with signal)
 *
 * PATTERNS:
 *   PortsFactory (createPanelPorts), ES6 Class (PanelNavRailAdminClass)
 *   Singleton instance exported as default
 *   CRUD operations (create, edit, delete, toggle)
 *   Drag-and-drop reordering, live preview, sync with NavRail
 *   Filter pipeline (search, group, status), state subscription
 *   Callback injection pattern for handler communication
 * ═══════════════════════════════════════════════════════════════ */
// Panel NavRail Admin - Enterprise
// @version 9.3.0-P2-ENTERPRISE
// @changelog v8.8.0-ENTERPRISE - ES6 class conversion
// @changelog v8.6.0-P25 - Added getVersion() for enterprise compliance
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { PanelLifecycle as _PanelLifecycle } from './core/lifecycle.js';
import { NavRailAdapter as _NavRailAdapter } from './core/navrail-adapter.js';
import { PanelStore as _PanelStore } from './state/store.js';
import { PanelTracker as _PanelTracker } from './telemetry/tracker.js';
import { PanelRenderer as _PanelRenderer } from './ui/renderer.js';
const PanelLifecycle = _PanelLifecycle as any;
const NavRailAdapter = _NavRailAdapter as any;
const PanelStore = _PanelStore as any;
const PanelTracker = _PanelTracker as any;
const PanelRenderer = _PanelRenderer as any;
import * as _CrudHandlers from './handlers/crud.js';
import * as _UIActions from './handlers/ui-actions.js';
import * as _DragDrop from './handlers/drag-drop.js';
import * as _Preview from './handlers/preview.js';
import * as _Sync from './handlers/sync.js';
import { createInlineEditHandlers as _createInlineEditHandlers } from './handlers/inline-edit.js';
const CrudHandlers = _CrudHandlers as any;
const UIActions = _UIActions as any;
const DragDrop = _DragDrop as any;
const Preview = _Preview as any;
const Sync = _Sync as any;
const createInlineEditHandlers = _createInlineEditHandlers as any;

const MODULE_ID = 'panel-navrail-admin';
const VERSION = '12.0.0-GROUP-DRAG-SEARCH';
export const getVersion = () => VERSION;

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const _isAuthenticated = () => { const auth = _getPort('auth'); return auth?.isAuthenticated?.() ?? false; };
const _isDocumentVisible = () => typeof document !== 'undefined' && !document.hidden;
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn.apply(logger, [`[${MODULE_ID}]`, ...args]); };

class PanelNavRailAdminClass {
  [key: string]: any;
  constructor() {
    this._container = null;
    this._initialized = false;
    this._subscriptions = [];
    this._abortController = null;
    this._inlineEditHandlers = null;
    _initPorts();
  }

  async init(container: HTMLElement | string) {
    if (this._initialized) return this;
    try {
      PanelLifecycle.setState('initializing');
      PanelTracker.init();
      this._container = typeof container === 'string' ? (hasDocument ? document.querySelector(container) : null) : container;
      if (!this._container) throw new Error('Container not found');
      this._abortController = new AbortController();
      await this._loadData();
      this._render();
      this._setupHandlers();
      Sync.initSync(() => { this._loadData(); });
      PanelLifecycle.setState('ready');
      PanelTracker.ready();
      this._initialized = true;
      _log('info', `v${VERSION} initialized`);
      return this;
    } catch (error: any) {
      PanelLifecycle.setState('error', error);
      PanelTracker.error(error);
      _log('error', 'Init failed:', error?.message);
      throw error;
    }
  }

  async _loadData() {
    UIActions.showLoading(this._container, true);
    try {
      const [groups, items] = await Promise.all([NavRailAdapter.getGroups(), NavRailAdapter.getItems()]);
      PanelStore.setState({ groups: groups || [], items: items || [], loading: false, error: null });
      PanelTracker.dataLoaded(groups?.length, items?.length);
    } catch (error: any) {
      PanelStore.setState({ error: error.message, loading: false });
      UIActions.showToast(this._container, 'Erro ao carregar dados', 'error');
    } finally {
      UIActions.showLoading(this._container, false);
    }
  }

  _render() {
    const state = PanelStore.getState();
    const html = PanelRenderer.render(state);
    this._container.innerHTML = html;
    DragDrop.init(this._container, this._callbacks());
    Preview.init(this._container, state);
    this._subscriptions.push(PanelStore.subscribe((newState: Record<string, unknown>) => this._onStateChange(newState)));
  }

  _onStateChange(state: Record<string, unknown>) {
    // v11.4.0: Keep groups reference updated for inline edit
    if (typeof window !== 'undefined') (window as any).__pnraGroups = state.groups || [];
    const cardsContainer = this._container.querySelector('[data-slot="cards"]');
    if (cardsContainer) {
      cardsContainer.innerHTML = PanelRenderer.renderCards(state);
      DragDrop.refresh(this._container, this._callbacks());
    }
    PanelRenderer.updateStats(this._container, state);
    Preview.update(this._container, state);
  }

  _setupHandlers() {
    const container = this._container;
    const callbacks = this._callbacks();
    const signal = this._abortController?.signal;

    // v11.4.0: Initialize inline edit handlers
    this._inlineEditHandlers = createInlineEditHandlers({
        container: container,
        showToast: callbacks.showToast,
        loadData: callbacks.loadData
    });

    // Store groups in window for renderer access
    const state = PanelStore.getState();
    if (typeof window !== 'undefined') (window as any).__pnraGroups = state.groups || [];

    const inlineEdit = this._inlineEditHandlers;

    container.addEventListener('click', (e: Event) => {
      const el = e.target as HTMLElement;

      // v11.4.0: Check for inline edit targets first (before data-action)
      if (inlineEdit) {
          if (el.closest('.pna-card__label.pnra-editable')) { inlineEdit.handleLabelClick(e as MouseEvent); return; }
          if (el.closest('.pna-card__icon.pnra-editable')) { inlineEdit.handleIconClick(e as MouseEvent); return; }
          if (el.closest('.pna-card__group.pnra-editable')) { inlineEdit.handleGroupClick(e as MouseEvent); return; }
          if (el.closest('.pna-card__level.pnra-editable')) { inlineEdit.handleLevelClick(e as MouseEvent); return; }
          if (el.closest('.pna-card__route.pnra-editable')) { inlineEdit.handleRouteClick(e as MouseEvent); return; }
      }

      const target = (el as Element).closest<HTMLElement>('[data-action]');
      if (!target) return;
      const action = target.dataset.action;
      const id = target.dataset.id || target.dataset.itemId;
      switch (action) {
        case 'create': CrudHandlers.openItemForm(container, null, callbacks); break;
        case 'edit': CrudHandlers.openItemForm(container, id, callbacks); break;
        case 'delete': CrudHandlers.confirmDelete(container, id, callbacks); break;
        case 'toggle': CrudHandlers.toggleItem(id, callbacks); break;
        case 'sync': Sync.triggerSync('manual'); Sync.refreshLiveNavRail(); break;
        case 'refresh': this._loadData(); break;
        case 'close-modal': UIActions.closeAllModals(container); break;
        case 'expand-preview': Preview.toggleExpand(container); break;
      }
    }, { signal });
    container.addEventListener('input', (e: Event) => { if ((e.target as Element).matches('[data-filter="search"]')) this._applyFiltersWithExpand(); }, { signal });
    container.addEventListener('change', (e: Event) => { if ((e.target as Element).matches('[data-filter]')) this._applyFilters(); }, { signal });
    container.addEventListener('submit', (e: Event) => { if ((e.target as Element).matches('[data-form="item"]')) { e.preventDefault(); CrudHandlers.saveItem(container, callbacks); } }, { signal });

    // v12.0.0: Group drag-drop reorder (MELHORIA 3)
    this._setupGroupDrag(container, signal);
  }

  _callbacks() {
    return {
      showToast: (msg: string, type: string) => UIActions.showToast(this._container, msg, type),
      showLoading: (show: boolean) => UIActions.showLoading(this._container, show),
      closeAllModals: () => UIActions.closeAllModals(this._container),
      loadData: () => this._loadData(),
      triggerSync: () => { Sync.triggerSync('update'); Preview.update(this._container, PanelStore.getState()); }
    };
  }

  _applyFilters() {
    const search = this._container.querySelector('[data-filter="search"]')?.value?.toLowerCase() || '';
    const group = this._container.querySelector('[data-filter="group"]')?.value || '';
    const status = this._container.querySelector('[data-filter="status"]')?.value || '';
    const state = PanelStore.getState();
    let filtered = state.items.slice();
    if (search) filtered = filtered.filter((item: Record<string, unknown>) => (item.label as string)?.toLowerCase().includes(search) || (item.id as string)?.toLowerCase().includes(search));
    if (group) filtered = filtered.filter((item: Record<string, unknown>) => item.group === group);
    if (status === 'active') filtered = filtered.filter((item: Record<string, unknown>) => (item._raw as Record<string, unknown>)?.is_active === 1);
    else if (status === 'inactive') filtered = filtered.filter((item: Record<string, unknown>) => (item._raw as Record<string, unknown>)?.is_active === 0);
    PanelStore.setState({ filteredItems: filtered });
  }

  // v12.0.0: MELHORIA 3 — Group drag-drop reorder
  _setupGroupDrag(container: HTMLElement, signal: AbortSignal | undefined) {
    var _draggedGroup: HTMLElement | null = null;

    container.addEventListener('dragstart', (e: DragEvent) => {
      var sep = (e.target as HTMLElement).closest('.pnra-group-separator[data-group-drag="true"]') as HTMLElement | null;
      if (!sep) return;
      _draggedGroup = sep;
      sep.style.opacity = '0.5';
      e.dataTransfer!.effectAllowed = 'move';
      e.dataTransfer!.setData('text/plain', sep.dataset.groupKey || '');
    }, { signal });

    container.addEventListener('dragover', (e: DragEvent) => {
      if (!_draggedGroup) return;
      var sep = (e.target as HTMLElement).closest('.pnra-group-separator[data-group-drag="true"]') as HTMLElement | null;
      if (sep && sep !== _draggedGroup) {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'move';
        sep.style.background = 'rgba(255,255,255,0.06)';
      }
    }, { signal });

    container.addEventListener('dragleave', (e: DragEvent) => {
      if (!_draggedGroup) return;
      var sep = (e.target as HTMLElement).closest('.pnra-group-separator[data-group-drag="true"]') as HTMLElement | null;
      if (sep) sep.style.background = '';
    }, { signal });

    container.addEventListener('drop', async (e: DragEvent) => {
      if (!_draggedGroup) return;
      e.preventDefault();
      var targetSep = (e.target as HTMLElement).closest('.pnra-group-separator[data-group-drag="true"]') as HTMLElement | null;
      if (!targetSep || targetSep === _draggedGroup) {
        if (_draggedGroup) _draggedGroup.style.opacity = '';
        _draggedGroup = null;
        return;
      }
      targetSep.style.background = '';
      _draggedGroup.style.opacity = '';

      // Collect all group separators in DOM order to determine new order
      var allSeps = Array.from(container.querySelectorAll('.pnra-group-separator[data-group-drag="true"]'));
      var fromIdx = allSeps.indexOf(_draggedGroup);
      var toIdx = allSeps.indexOf(targetSep);

      if (fromIdx === -1 || toIdx === -1) { _draggedGroup = null; return; }

      // Build new order array
      var groupKeys = allSeps.map(s => (s as HTMLElement).dataset.groupKey || '');
      var moved = groupKeys.splice(fromIdx, 1)[0];
      groupKeys.splice(toIdx, 0, moved);

      // console.log('[GroupDrag NavRail] reorder:', groupKeys); // removed 2026-04-30 (debug temporário)

      // PATCH each group with new order_index
      var callbacks = this._callbacks();
      try {
        var state = PanelStore.getState();
        var groups = (state.groups || []) as Record<string, unknown>[];
        var patchPromises: Promise<unknown>[] = [];
        for (var gi = 0; gi < groupKeys.length; gi++) {
          var gk = groupKeys[gi];
          var grp = groups.find(function(g: Record<string, unknown>) {
            return String((g._raw as any)?.group_key || (g._raw as any)?.id || g.id) === gk;
          });
          if (grp && grp._raw) {
            var raw = grp._raw as Record<string, unknown>;
            // PATCH /sections endpoint for group order update
            patchPromises.push(
              fetch('/api/admin/navigation/sections', {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  source_table: String(raw.source_table || 'navrail_groups'),
                  source_id: Number(raw.source_id || raw.id),
                  order_index: gi + 1
                })
              }).then(function(r) { return r.json(); })
            );
          }
        }
        await Promise.all(patchPromises);
        callbacks.showToast('Ordem dos grupos atualizada!', 'success');
        await this._loadData();
      } catch (err: any) {
        callbacks.showToast('Erro ao reordenar grupos: ' + err.message, 'error');
        console.error('[GroupDrag NavRail] error:', err);
      }

      _draggedGroup = null;
    }, { signal });

    container.addEventListener('dragend', () => {
      if (_draggedGroup) _draggedGroup.style.opacity = '';
      _draggedGroup = null;
      container.querySelectorAll('.pnra-group-separator').forEach(s => { (s as HTMLElement).style.background = ''; });
    }, { signal });
  }

  // v12.0.0: MELHORIA 6 — Search expands collapsed groups
  _applyFiltersWithExpand() {
    var search = (this._container.querySelector('[data-filter="search"]') as HTMLInputElement)?.value?.toLowerCase() || '';
    this._applyFilters();

    // When search is active, expand all group separators so results are visible
    if (search) {
      var collapsedGroups = this._container.querySelectorAll('.pnra-group-separator.pnra-collapsed');
      collapsedGroups.forEach(function(sep: Element) {
        sep.classList.remove('pnra-collapsed');
        // Show all cards in this group
        var groupKey = (sep as HTMLElement).dataset.groupKey;
        if (groupKey) {
          var cards = document.querySelectorAll('[data-group="' + groupKey + '"]');
          cards.forEach(function(c: Element) { (c as HTMLElement).style.display = ''; });
        }
      });
    }
  }

  mount(container: HTMLElement | string) { return this.init(container); }

  unmount() {
    if (this._abortController) { this._abortController.abort(); this._abortController = null; }
    this._subscriptions.forEach((unsub: (() => void) | null) => { if (unsub) unsub(); });
    this._subscriptions = [];
    DragDrop.destroy();
    Sync.destroy();
    if (this._container) this._container.innerHTML = '';
    this._initialized = false;
    PanelLifecycle.setState('unmounted');
  }

  healthCheck() {
    const ps = Ports.snapshot();
    const logger = _getPort('logger');
    const checks = { initialized: this._initialized, containerValid: !!this._container, abortControllerActive: !!this._abortController && !this._abortController.signal.aborted, portsInitialized: ps._initialized, loggerReady: !!logger };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed >= 4 ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/5`, checks, version: VERSION, moduleId: MODULE_ID, p22Compliant: true, timestamp: Date.now() };
  }

  info() {
    const ps = Ports.snapshot();
    return { moduleId: MODULE_ID, version: VERSION, initialized: this._initialized, portsInitialized: ps._initialized, container: this._container?.id || null, p22Compliant: true, timestamp: Date.now() };
  }
}

const instance = new PanelNavRailAdminClass();

export const mount = (container: HTMLElement | string) => { if (!_isAuthenticated()) { return { success: false, moduleId: MODULE_ID, error: "not-authenticated" }; } return instance?.mount(container); };
export const unmount = () => instance?.unmount();
export const destroy = () => unmount();
export const healthCheck = () => { const hc: Record<string, unknown> = instance?.healthCheck() ?? { status: 'UNHEALTHY', mounted: false, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; hc.isDocumentVisible = _isDocumentVisible(); return hc; };
export default instance;
export { PanelNavRailAdminClass as PanelNavRailAdmin, VERSION, MODULE_ID };
if (hasWindow && !isStrict()) (window as any).PanelNavRailAdmin = instance;
