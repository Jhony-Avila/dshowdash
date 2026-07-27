// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.ui.event-handlers
// PURPOSE: DOM event handlers for accordion view interactions
// ───────────────────────────────────────────────────────────────
// @contract CREATE_EVENT_HANDLERS - createEventHandlers(deps) factory
// @contract SETUP - setup(abortController) attaches listeners
// @contract HANDLE_CLICK - handleClick(e) processes click events
// @contract HANDLE_KEYDOWN - handleKeydown(e) processes keyboard events
// @contract NAVIGATE_FOCUS - navigateFocus(direction) moves focus
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: ACCORDION_INTENTS from /core/runtime/events/index.js
// IMPORTS: MODULE_ID from ./constants.js
// PROVIDES: createEventHandlers, healthCheck, info, VERSION, MODULE_ID
// @changelog v2.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.1.0-UNIFIED-TRIGGERS: Initial unified triggers version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ACCORDION_INTENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { MODULE_ID as VIEW_MODULE_ID } from './constants.js';

export const VERSION = '2.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accordion.ui.event-handlers';

export function createEventHandlers(deps: { container: HTMLElement; eventBus: { emit?: (event: string, data: unknown) => void } | null; findItem: (itemId: string) => unknown; metrics: Record<string, number> }) {
  const { container, eventBus, findItem, metrics } = deps;

  function emitIntent(intent: string, payload: Record<string, unknown>) {
    if (!eventBus?.emit) return;
    eventBus.emit(intent, {
      source: VIEW_MODULE_ID,
      ...payload,
      timestamp: Date.now()
    });
  }

  function handleClick(e: Event) {
    const target = (e.target as HTMLElement)?.closest('[data-action]') as HTMLElement | null;
    if (!target) return;

    if (target.classList.contains('uarps-hidden') || target.classList.contains('uarps-disabled')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const action = target.dataset.action;
    metrics.clicks++;

    if (action === 'toggle-section') {
      e.preventDefault();
      const sectionId = target.dataset.sectionId;
      emitIntent(ACCORDION_INTENTS.TOGGLE_SECTION, { sectionId });
    }

    if (action === 'select-item') {
      e.preventDefault();
      const itemId = target.dataset.itemId;
      const itemType = target.dataset.itemType;
      const sectionId = target.dataset.sectionId;
      // @ts-expect-error strict migration — TS2345
      const item = findItem(itemId);
      emitIntent(ACCORDION_INTENTS.SELECT_ITEM, { itemId, itemType, sectionId, item });
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    const target = (e.target as HTMLElement)?.closest('[data-action]') as HTMLElement | null;
    if (!target) return;

    if (target.classList.contains('uarps-hidden') || target.classList.contains('uarps-disabled')) {
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      target.click();
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      navigateFocus(e.key === 'ArrowDown' ? 1 : -1);
    }
  }

  function navigateFocus(direction: number) {
    const focusableItems = container.querySelectorAll(
      '.dsd-sidebar__group-button:not([disabled]):not(.uarps-hidden):not(.uarps-disabled), .dsd-sidebar__link:not([aria-disabled="true"]):not(.uarps-hidden):not(.uarps-disabled)'
    );
    // @ts-expect-error strict migration — TS2345
    const currentIndex = Array.from(focusableItems).indexOf(document.activeElement);
    const nextIndex = currentIndex + direction;

    if (nextIndex >= 0 && nextIndex < focusableItems.length) {
      (focusableItems[nextIndex] as HTMLElement).focus();
    }
  }

  function setup(abortController: AbortController) {
    if (!container || !abortController) return;

    const signal = abortController.signal;

    container.addEventListener('click', handleClick, { signal });
    container.addEventListener('keydown', handleKeydown, { signal });
  }

  return {
    setup,
    handleClick,
    handleKeydown,
    navigateFocus
  };
}

export function healthCheck() {
  const checks = {
    factoryAvailable: typeof createEventHandlers === 'function'
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    handlers: ['setup', 'handleClick', 'handleKeydown', 'navigateFocus'],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

export default {
  createEventHandlers,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
