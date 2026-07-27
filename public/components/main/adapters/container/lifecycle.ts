// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-UNIFIED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-lifecycle
// PURPOSE: Container Lifecycle - Ciclo de Vida dos Containers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONTAINER_EVENTS from /core/runtime/events/catalog/container.events.js
//   STATE, DOCK_SLOTS, LAYOUT_MODE, ENTERPRISE_DEFAULTS from ./constants.js
//   ensureDockSlots, getSlotElement from ./dom-factory.js
//   getContainers, getContainerApis, getPolicy, getActiveId, checkBudget, increme...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createLifecycleManager() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CONTAINER_EVENTS } from '/core/runtime/events/catalog/container.events.js';
import { STATE, DOCK_SLOTS, LAYOUT_MODE, ENTERPRISE_DEFAULTS } from './constants.js';
import { ensureDockSlots, getSlotElement } from './dom-factory.js';
import { getContainers, getContainerApis, getPolicy, getActiveId, checkBudget, incrementGenerationToken, incrementCreated, incrementDestroyed, incrementTitleUpdates, incrementRollbacks, teardownListeners, setSlotsCreated, setActiveId } from './internal-state.js';

declare const createContainerMain: (el: HTMLElement, opts: Record<string, unknown>) => any;
declare const features: Record<string, unknown>;
export const VERSION = '8.0.0-UNIFIED';
export const MODULE_ID = 'container-lifecycle';

interface LifecycleDeps {
  domAdapter: { selectMainContainer(): HTMLElement | null; [k: string]: unknown };
  eventsPort: { emit(event: string, data: Record<string, unknown>): void; [k: string]: unknown };
  stateMachine: { transition(id: string, state: string, reason: string): boolean; [k: string]: unknown };
  transactions: { begin(): string; commit(): boolean; rollback(reason: string): boolean; [k: string]: unknown };
  stateActions: { activate(id: string): boolean; [k: string]: unknown };
  onLayoutRequested: ((layout: string) => void) | null;
}

export function createLifecycleManager(deps: Record<string, unknown> = {}) {
  const { domAdapter, eventsPort, stateMachine, transactions, stateActions, onLayoutRequested } = deps as unknown as LifecycleDeps;
  const _containers = getContainers();
  const _containerApis = getContainerApis();

  function _emit(event: string, data: Record<string, unknown> = {}) { eventsPort?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() }); }

  return {
    getOrCreate(options: Record<string, unknown> = {}) {
      const { id, title, dockSpec = { region: 'main', slot: DOCK_SLOTS.PRIMARY }, layoutPolicy = { mode: LAYOUT_MODE.INHERIT }, features: featureOpts = {} } = options as { id: string; title?: string; dockSpec?: Record<string, string>; layoutPolicy?: Record<string, string>; features?: Record<string, unknown>; [k: string]: unknown };
      if (!id) throw new Error('Container ID required');
      const budgetCheck = checkBudget('create');
      if (!budgetCheck.ok) throw new Error(budgetCheck.reason);
      if (_containers.has(id)) { if (title) this.updateTitle(id, title); stateActions?.activate(id); return _containers.get(id); }

      transactions.begin();
      try {
        const host = domAdapter?.selectMainContainer?.();
        if (!host) throw new Error('Host container not found');
        ensureDockSlots(host);
        setSlotsCreated(true);
        const slotEl = getSlotElement(host as HTMLElement, dockSpec.slot || DOCK_SLOTS.PRIMARY);
        const creationToken = incrementGenerationToken();

        const wrapperEl = document.createElement('div');
        wrapperEl.className = 'dsd-container-wrapper';
        wrapperEl.setAttribute('data-container-id', id);
        wrapperEl.setAttribute('data-dock-slot', dockSpec.slot || DOCK_SLOTS.PRIMARY);
        wrapperEl.setAttribute('data-dock-region', dockSpec.region || 'main');
        wrapperEl.setAttribute('data-layout-mode', layoutPolicy.mode || LAYOUT_MODE.INHERIT);
        if (layoutPolicy.layout) wrapperEl.setAttribute('data-layout', layoutPolicy.layout);
        slotEl.appendChild(wrapperEl);

        const containerOptions = {
          ...ENTERPRISE_DEFAULTS, ...(featureOpts as Record<string, unknown>), id, title: title || 'Container',
          onClose: () => this.destroy(id),
          onCollapse: () => _emit(CONTAINER_EVENTS.COLLAPSED, { id }),
          onExpand: () => _emit(CONTAINER_EVENTS.EXPANDED, { id }),
          onFullscreen: (fs: boolean) => _emit(CONTAINER_EVENTS.FULLSCREEN, { id, fullscreen: fs }),
          onReady: () => _emit(CONTAINER_EVENTS.READY, { id }),
          onError: (err: unknown) => _emit(CONTAINER_EVENTS.ERROR, { id, error: err })
        };

        const containerApi = createContainerMain(wrapperEl, containerOptions);
        containerApi.mount();
        const rootEl = containerApi.getElement();
        const contentEl = containerApi.getContent();

        const instance = { id, rootEl, contentEl, wrapperEl, options: containerOptions, state: STATE.CREATING, active: false, createdAt: Date.now(), lastActivatedAt: null as number | null, lastTransition: null as Record<string, unknown> | null, dockSpec: { ...dockSpec }, layoutPolicy: { ...layoutPolicy }, generationToken: creationToken, api: containerApi };

        _containers.set(id, instance);
        _containerApis.set(id, containerApi);
        stateMachine.transition(id, STATE.READY, 'created');
        _emit(CONTAINER_EVENTS.CREATED, { id, variant: (options as Record<string, unknown>).variant || 'default', policy: getPolicy(), dockSpec, layoutPolicy, features: Object.keys(featureOpts) });
        incrementCreated();
        stateActions?.activate(id);
        transactions.commit();
        return instance;
      } catch (error) { transactions.rollback((error as Error).message); incrementRollbacks(); throw error; }
    },

    get(id: string) { return _containers.get(id) || null; },
    getContentEl(id: string) { return _containers.get(id)?.contentEl || null; },
    getApi(id: string) { return _containerApis.get(id) || null; },

    updateTitle(id: string, title: string) {
      const instance = _containers.get(id);
      if (!instance) return false;
      const api = _containerApis.get(id);
      if (api) { api.setTitle(title); } else { const titleEl = instance.rootEl.querySelector('.dsd-container__title'); if (titleEl && title) titleEl.textContent = title; }
      if (instance.options) instance.options.title = title;
      incrementTitleUpdates();
      _emit(CONTAINER_EVENTS.TITLE_UPDATED, { id, title });
      return true;
    },

    destroy(id: string) {
      const instance = _containers.get(id);
      if (!instance) return false;
      transactions.begin();
      try {
        stateMachine.transition(id, STATE.DESTROYING, 'destroy called');
        teardownListeners(id);
        const api = _containerApis.get(id);
        if (api) { api.unmount(); }
        instance.wrapperEl?.remove?.();
        instance.rootEl?.remove?.();
        stateMachine.transition(id, STATE.DESTROYED, 'destroyed');
        _containers.delete(id);
        _containerApis.delete(id);
        if (getActiveId() === id) setActiveId(null);
        _emit(CONTAINER_EVENTS.DESTROYED, { id });
        incrementDestroyed();
        transactions.commit();
        return true;
      } catch (error) { transactions.rollback((error as Error).message); incrementRollbacks(); return false; }
    },

    destroyAll() { const ids = Array.from(_containers.keys()); ids.forEach((id: string) => this.destroy(id)); setActiveId(null); }
  };
}

export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID }; }
export default { createLifecycleManager, healthCheck, VERSION, MODULE_ID };
