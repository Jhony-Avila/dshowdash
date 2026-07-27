// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-DI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-core
// PURPOSE: container-main/core/container-core.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONTAINER_MAIN_EVENTS from ./constants.js
//   createStateProxy, createStateEmitter, getInitialState from ./state.js
//   initComponents, destroyComponents from ../init-components.js
//   buildContainerApi from ../api-builder.js
//   LIFECYCLE_HOOKS from ../components/event-hooks.js
//   VERSION, MODULE_ID from ./constants.js
//
// PROVIDES:
//   createContainerCore() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   CONTAINER_MAIN_EVENTS.READY
//   LIFECYCLE_HOOKS.MOUNTED
// LISTENS (eventos):
//   CONTAINER_MAIN_EVENTS.STATE_RESTORE
//   CONTAINER_MAIN_EVENTS.NAVIGATION_SYNC
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════

'use strict';

import { CONTAINER_MAIN_EVENTS } from './constants.js';
import { createStateProxy, createStateEmitter, getInitialState } from './state.js';
import { initComponents } from '../init-components.js';
import { destroyComponents } from '../container-factory/components/index.js';
import { buildContainerApi } from '../api-builder.js';
import { LIFECYCLE_HOOKS } from '../components/event-hooks.js';
import { VERSION, MODULE_ID } from './constants.js';

export function createContainerCore(config: Record<string, unknown>) {
    const { containerId, options, isAttachMode, eventBridge, labelResolver, eventBus, mode } = config as {
      containerId: string;
      options: Record<string, unknown> & { onReady?: (api: unknown) => void };
      isAttachMode: boolean;
      eventBridge: { subscribe: (event: string, handler: (data: Record<string, unknown>) => void) => () => void; emit: (event: string, data: Record<string, unknown>) => void };
      labelResolver: (panelId: string) => string;
      eventBus: Record<string, unknown> | null;
      mode: string;
    };

    let _cleanups: unknown[] = [];
    let _currentPanelId: unknown = null;
    let _components: Record<string, any> = {};
    let _container: HTMLElement | null = null;
    let _contentEl: HTMLElement | null = null;
    let _api: Record<string, unknown> | null = null;

    const _emitStateChanged = createStateEmitter(eventBridge, containerId);

    const _onStateChange = (prop: string, newVal: unknown, oldVal: unknown, cId: unknown) => {
        _emitStateChanged(_state);
    };

    let _state = createStateProxy(getInitialState(isAttachMode), containerId, _onStateChange);

    // Setup restore listener (P1)
    function _setupRestoreListener() {
        const cleanup = eventBridge.subscribe(CONTAINER_MAIN_EVENTS.STATE_RESTORE, (data: Record<string, unknown>) => {
            if (data && data.containerId === containerId && data.state) {
                _applyRestoredState(data.state as Record<string, unknown>);
            }
        });
        _cleanups.push(cleanup);
    }

    // Setup navigation sync listener (P3)
    function _setupNavigationSyncListener() {
        const cleanup = eventBridge.subscribe(CONTAINER_MAIN_EVENTS.NAVIGATION_SYNC, (data: Record<string, unknown>) => {
            if (data && data.panelId) {
                _onNavigationSync(data);
            }
        });
        _cleanups.push(cleanup);
    }

    // Handle navigation sync (P3)
    function _onNavigationSync(data: Record<string, unknown>) {
        const panelId = data.panelId as string;
        const route = data.route as string;
        _currentPanelId = panelId;
        const label = labelResolver(panelId);
        if (_api && typeof _api.setTitle === 'function') {
            (_api.setTitle as (label: string) => void)(label);
        }
        if (_components.breadcrumb && _components.breadcrumb.setItems) {
            const items = [{ id: 'home', label: 'Início', href: '#/', panelId: 'panel-cards' }];
            if (panelId !== 'panel-cards') {
                items.push({ id: panelId, label, href: route || `#/${panelId}`, panelId });
            }
            _components.breadcrumb.setItems(items);
        }
    }

    // P3.1: Resolve initial panel title on mount
    // Detects the active panel from the DOM and resolves its label
    // so the header shows the correct title instead of fallback "Principal"
    function _resolveInitialPanelTitle() {
        try {
            // Strategy 1: Check DOM for active panel
            const activePanelEl = _container?.querySelector('[data-panel-id]');
            const panelIdFromDom = activePanelEl?.getAttribute('data-panel-id');

            // Strategy 2: Check hash route
            const hash = typeof location !== 'undefined' ? location.hash : '';
            const panelIdFromHash = hash ? hash.replace('#/', '').split('/')[0] : null;

            // Use DOM panel first, then hash-derived
            const detectedPanelId = panelIdFromDom || panelIdFromHash || null;

            if (detectedPanelId && detectedPanelId !== _currentPanelId) {
                _onNavigationSync({
                    panelId: detectedPanelId,
                    route: hash || `#/${detectedPanelId}`
                });
            }
        } catch (e) {
            // Silent fail — title stays as fallback, no regression
        }
    }

    // Apply restored state (P1)
    function _applyRestoredState(restoredState: Record<string, unknown>) {
        if (restoredState.collapsed !== undefined && _state.collapsed !== restoredState.collapsed) {
            if (restoredState.collapsed) {
                (_api?.collapse as (() => void) | undefined)?.();
            } else {
                (_api?.expand as (() => void) | undefined)?.();
            }
        }
        if (restoredState.fullscreen !== undefined && _state.fullscreen !== restoredState.fullscreen) {
            (_api?.fullscreen as ((val: unknown) => void) | undefined)?.(restoredState.fullscreen);
        }
        if (restoredState.minimized !== undefined && _state.minimized !== restoredState.minimized) {
            _state.minimized = restoredState.minimized;
        }
    }

    // Cleanup handler for unmount
    function _handleUnmount() {
        _cleanups.forEach(fn => { try { (fn as () => void)(); } catch(e) {} });
        _cleanups = [];
        destroyComponents(_components);
    }

    // Post-mount setup (shared between create and attach)
    // P0.2 FIX: Pass eventBus to initComponents via context
    function _postMount(container: HTMLElement, contentEl: HTMLElement, mountMode: unknown) {
        _container = container;
        _contentEl = contentEl;
        
        // P0.2: Create context with eventBus for DI-STRICT components
        const initContext = {
            eventBus,
            storage: typeof localStorage !== 'undefined' ? localStorage : null
        };
        

        // @ts-expect-error TS migration - TS2554
        _components = initComponents(_container, options, _state, initContext);
        _state.mounted = true;
        _container.setAttribute('data-state', 'ready');
        _setupRestoreListener();
        _setupNavigationSyncListener();
        (_components.eventHooks as Record<string, unknown> | undefined)?.emit && (_components.eventHooks.emit as (event: string, data: Record<string, unknown>) => void)(LIFECYCLE_HOOKS.MOUNTED, { container: _container, mode: mountMode });
        options.onReady?.(_api);
        eventBridge.emit(CONTAINER_MAIN_EVENTS.READY, { containerId, mode: mountMode as string, diStrict: !!eventBus });

        // P3.1: Resolve initial panel title after mount is complete
        // Uses microtask to ensure API and components are fully wired before resolving
        Promise.resolve().then(() => {
            _resolveInitialPanelTitle();
        });
    }

    // Build API with all methods
    // P2.1: Pass mode and eventBus for audit()
    function _buildApi(extraMethods: Record<string, unknown> = {}) {
        const baseApi = buildContainerApi({
            // @ts-expect-error strict migration — TS2322
            container: _container,
            containerId,
            options,
            state: _state,
            components: _components,
            version: VERSION,
            moduleId: MODULE_ID,
            onUnmount: _handleUnmount,
            mode,
            eventBus
        });

        _api = {
            ...baseApi,
            getCurrentPanelId() { return _currentPanelId; },
            getContainer() { return _container; },
            getContentEl() { return _contentEl; },
            isAttachMode() { return _state.attachMode; },
            hasDIEventBus() { return !!eventBus; },
            ...extraMethods
        };

        return _api;
    }

    return {
        getState: () => _state,
        getComponents: () => _components,
        getContainer: () => _container,
        getContentEl: () => _contentEl,
        postMount: _postMount,
        buildApi: _buildApi,
        getApi: () => _api
    };
}
