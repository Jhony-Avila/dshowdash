// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: lifecycle-api
// PURPOSE: Lifecycle API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createContainerDOM from ../dom/index.js
//   initializeComponents, destroyComponents, LIFECYCLE_HOOKS from ../components/i...
//   getEventBus from ../../core/event-bridge.js
//
// PROVIDES:
//   createLifecycleAPI() — exported function
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
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'main.ui.container-main.container-factory.api.lifecycle-api';

import { createContainerDOM } from '../dom/index.js';
import { initializeComponents, destroyComponents, LIFECYCLE_HOOKS } from '../components/index.js';
import { getEventBus } from '../../core/event-bridge.js';

export function createLifecycleAPI(context: Record<string, unknown>) {
  const containerId = context.containerId as string;
  const options = context.options as Record<string, unknown>;
  const state = context.state as Record<string, unknown>;
  const refs = context.refs as Record<string, unknown>;
  const setComponents = context.setComponents as (c: unknown) => void;
  const getComponents = context.getComponents as () => Record<string, Record<string, (...args: unknown[]) => unknown>>;

  return {
    mount() {
      if (state.mounted) return this;

      const container = createContainerDOM(containerId as string, options as Record<string, unknown>);
      refs.container = container;
      refs.contentEl = container.querySelector('.dsd-container__content');

      if (refs.target) {
        (refs.target as HTMLElement).appendChild(container);
      }

      let eventBus = null;
      try { eventBus = getEventBus({}); } catch (e) { eventBus = null; }
      refs.eventBus = eventBus;

      const components = initializeComponents(container, options as Record<string, unknown>, state, eventBus);
      setComponents(components);

      state.mounted = true;
      container.setAttribute('data-state', 'ready');

      (components.eventHooks as Record<string, (...args: unknown[]) => unknown> | undefined)?.emit?.(LIFECYCLE_HOOKS.MOUNTED, { container });
      (options as Record<string, (...args: unknown[]) => unknown>).onReady?.(this);

      return this;
    },

    unmount() {
      if (!state.mounted) return this;

      const components = getComponents();
      (components.eventHooks as Record<string, (...args: unknown[]) => unknown> | undefined)?.emit?.(LIFECYCLE_HOOKS.BEFORE_UNMOUNT, { container: refs.container });

      destroyComponents(components as Record<string, unknown>);
      (refs.container as HTMLElement | null)?.remove();

      state.mounted = false;
      setComponents({});

      return this;
    }
  };
}

export default { createLifecycleAPI };
