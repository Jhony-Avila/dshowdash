// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.9.0-ABSOLUTE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: adapters-factory
// PURPOSE: Initializer - Adapters Factory
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createRouterAdapter from /components/main/adapters/RouterAdapter.js
//   createAuthAdapter from /components/main/adapters/AuthAdapter.js
//   createStateAdapter from /components/main/adapters/StateAdapter.js
//   createPanelLoaderAdapter from /components/main/adapters/PanelLoaderAdapter.js
//   createTelemetryAdapter from /components/main/adapters/TelemetryAdapter.js
//   createDOMAdapter from /components/main/adapters/DOMAdapter.js
//   createEventBusAdapter from /components/main/adapters/EventBusAdapter.js
//   createUIAdapter from /components/main/adapters/UIAdapter.js
//   createContainerAdapter from /components/main/adapters/container/adapter.js
//   createTimerAdapter from /components/main/adapters/TimerAdapter.js
//   createGlobalsAdapter from /components/main/adapters/GlobalsAdapter.js
//   createCanvasBasic from /components/main/ui/canvas-basic.js
//   LAYOUT_EVENTS from /core/runtime/events/catalog/layout.events.js
//
// PROVIDES:
//   createAdapters() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   LAYOUT_EVENTS.APPLIED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import type { MainState } from '../../../types.js';
import { createRouterAdapter } from '/components/main/adapters/RouterAdapter.js';
import { createAuthAdapter } from '/components/main/adapters/AuthAdapter.js';
import { createStateAdapter } from '/components/main/adapters/StateAdapter.js';
import { createPanelLoaderAdapter } from '/components/main/adapters/PanelLoaderAdapter.js';
import { createTelemetryAdapter } from '/components/main/adapters/TelemetryAdapter.js';
import { createDOMAdapter } from '/components/main/adapters/DOMAdapter.js';
import { createEventBusAdapter } from '/components/main/adapters/EventBusAdapter.js';
import { createUIAdapter } from '/components/main/adapters/UIAdapter.js';
import { createContainerAdapter } from '/components/main/adapters/container/adapter.js';
import { createTimerAdapter } from '/components/main/adapters/TimerAdapter.js';
import { createGlobalsAdapter } from '/components/main/adapters/GlobalsAdapter.js';

import { createCanvasBasic } from '/components/main/ui/canvas-basic.js';

import { LAYOUT_EVENTS } from '/core/runtime/events/catalog/layout.events.js';

export const VERSION = '5.8.0-P2-ENTERPRISE';
export const MODULE_ID = 'main.core.initializer.core.adapters-factory';

// ============================================================================
// ADAPTERS FACTORY
// ============================================================================

/**
 * Cria todos os adapters necessários
 * @param {Object} externalDeps - Dependências externas
 * @param {Object} state - Estado do inicializador
 * @returns {Object} { adapters, eventBusAdapter, containerAdapter, containerPort }
 */
export function createAdapters(externalDeps: Record<string, unknown>, state: MainState) {

  // @ts-expect-error TS migration - TS2554
  const eventBusAdapter = createEventBusAdapter(externalDeps.eventBus, { source: 'main' });
  const uiAdapter = createUIAdapter({ document: externalDeps.document });
  const routerAdapter = createRouterAdapter({ 
    router: externalDeps.router, 
    eventBus: externalDeps.eventBus 
  });
  const authAdapter = createAuthAdapter({ eventBus: externalDeps.eventBus });
  const stateAdapter = createStateAdapter({ globalState: externalDeps.globalState });
  const telemetryAdapter = createTelemetryAdapter({ 
    telemetry: externalDeps.telemetryCore, 
    eventBus: externalDeps.eventBus 
  });
  const domAdapter = createDOMAdapter({ document: externalDeps.document });
  const panelLoaderAdapter = createPanelLoaderAdapter({});

  // @ts-expect-error TS migration - TS2554
  const canvasBasic = createCanvasBasic();
  const timerAdapter = createTimerAdapter();
  const globalsAdapter = createGlobalsAdapter();
  
  const onLayoutRequested = (layout: unknown) => {
    if (state.engine) {
      const layoutController = state.engine.getLayoutController 
        ? state.engine.getLayoutController() 
        : null;
      if (layoutController && typeof (layoutController as Record<string, unknown>).applyLayout === 'function') {
        ((layoutController as Record<string, unknown>).applyLayout as (l: unknown) => void)(layout);
        if (eventBusAdapter && eventBusAdapter.emit) {
          eventBusAdapter.emit(LAYOUT_EVENTS.APPLIED, { 
            layout, 
            source: 'container-policy' 
          });
        }
      }
    }
  };
  
  const containerAdapter = createContainerAdapter({
    domAdapter,
    uiAdapter,
    eventsPort: eventBusAdapter,
    telemetryPort: telemetryAdapter,
    onLayoutRequested
  });
  
  const adapters = {
    router: routerAdapter,
    auth: authAdapter,
    state: stateAdapter,
    panelLoader: panelLoaderAdapter,
    telemetry: telemetryAdapter,
    dom: domAdapter,
    canvas: canvasBasic,
    eventBus: eventBusAdapter,
    ui: uiAdapter,
    container: containerAdapter,
    timer: timerAdapter,
    globals: globalsAdapter
  };
  
  return {
    adapters,
    eventBusAdapter,
    containerAdapter
  };
}

export default {
  createAdapters
};
