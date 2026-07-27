// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.3.0-MIGRATION-PHASE7)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.events.event-bindings
// PURPOSE: Event Bindings — Bindings declarativos para ações na listagem
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   isEnabled from ../config/feature-flags.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   EventBindings — Factory function
//   DEFAULT_BINDINGS — Default binding definitions
//   info(), healthCheck()
//
// @origin Adapted from panel-01 table event bindings for nav-admin domain
// @changelog
//   10.3.0-MIGRATION-PHASE7: Initial creation — FASE 7 D.3
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isEnabled } from '../config/feature-flags.js';

export const VERSION = '10.3.0-MIGRATION-PHASE7';
export const MODULE_ID = 'panel-nav-admin.events.event-bindings';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[EventBindings]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * Default declarative bindings for nav-admin list items.
 * Each binding maps a data-action attribute to a handler key.
 * @type {Array<Object>}
 */
export const DEFAULT_BINDINGS = Object.freeze([
  { action: 'edit-item', event: 'click', selector: '[data-action="edit-item"]', handler: 'onEditItem', featureFlag: null },
  { action: 'delete-item', event: 'click', selector: '[data-action="delete-item"]', handler: 'onDeleteItem', featureFlag: null },
  { action: 'duplicate-item', event: 'click', selector: '[data-action="duplicate-item"]', handler: 'onDuplicateItem', featureFlag: 'duplicateItem' },
  { action: 'toggle-active', event: 'click', selector: '[data-action="toggle-active"]', handler: 'onToggleActive', featureFlag: null },
  { action: 'move-to-section', event: 'click', selector: '[data-action="move-to-section"]', handler: 'onMoveToSection', featureFlag: null },
  { action: 'bulk-select', event: 'change', selector: '[data-action="bulk-select"]', handler: 'onBulkSelect', featureFlag: 'bulkOperations' },
  { action: 'bulk-select-all', event: 'change', selector: '[data-action="bulk-select-all"]', handler: 'onBulkSelectAll', featureFlag: 'bulkOperations' },
  { action: 'export', event: 'click', selector: '[data-action="export"]', handler: 'onExport', featureFlag: null },
  { action: 'import', event: 'click', selector: '[data-action="import"]', handler: 'onImport', featureFlag: null },
  { action: 'change-view', event: 'click', selector: '[data-action="change-view"]', handler: 'onChangeView', featureFlag: null },
  { action: 'change-density', event: 'click', selector: '[data-action="change-density"]', handler: 'onChangeDensity', featureFlag: null },
  { action: 'save-view', event: 'click', selector: '[data-action="save-view"]', handler: 'onSaveView', featureFlag: 'savedViews' },
  { action: 'open-drawer', event: 'click', selector: '[data-action="open-drawer"]', handler: 'onOpenDrawer', featureFlag: 'drawer' },
  { action: 'sort-column', event: 'click', selector: '[data-action="sort-column"]', handler: 'onSortColumn', featureFlag: null },
  { action: 'resize-column', event: 'mousedown', selector: '[data-action="resize-column"]', handler: 'onResizeColumn', featureFlag: null }
]);

/**
 * Factory: creates an EventBindings manager.
 * Declaratively binds actions to handlers using event delegation.
 *
 * @param {HTMLElement} container — Root container element
 * @param {Object} handlers — Map of handler name → function
 * @param {Object} [options]
 * @param {Array} [options.bindings] — Custom binding definitions
 * @param {AbortController} [options.abortController] — For cleanup
 * @returns {Object} EventBindings instance
 */
export function EventBindings(container: HTMLElement, handlers: Record<string, (e: Event, target: HTMLElement) => void>, options: Record<string, unknown> = {}) {
  const bindings = (options.bindings as typeof DEFAULT_BINDINGS | undefined) || DEFAULT_BINDINGS;
  const abortController = options.abortController as AbortController | undefined;

  const _activeBindings: { eventType: string; listener: (e: Event) => void }[] = [];
  let _bound = false;

  /**
   * Bind all event listeners using event delegation.
   */
  function bind() {
    if (_bound || !container) return;

    const signal = abortController?.signal;
    const groupedByEvent: Record<string, typeof DEFAULT_BINDINGS[number][]> = {};

    for (const binding of bindings) {
      // Skip if feature flag is disabled
      if (binding.featureFlag && !isEnabled(binding.featureFlag)) continue;
      // Skip if handler not provided
      if (!handlers[binding.handler]) continue;

      if (!groupedByEvent[binding.event]) {
        groupedByEvent[binding.event] = [];
      }
      groupedByEvent[binding.event].push(binding);
    }

    for (const [eventType, eventBindings] of Object.entries(groupedByEvent)) {
      const listener = (e: Event) => {
        for (const binding of eventBindings) {
          const target = (e.target as HTMLElement).closest(binding.selector) as HTMLElement | null;
          if (target) {
            try {
              handlers[binding.handler](e, target);
            } catch (err) {
              _log('error', `Handler "${binding.handler}" failed:`, err);
            }
            break;
          }
        }
      };

      const opts = signal ? { signal } : {};
      container.addEventListener(eventType, listener, opts);
      _activeBindings.push({ eventType, listener });
    }

    _bound = true;
    _log('debug', `Bound ${_activeBindings.length} event groups`);
  }

  /**
   * Unbind all event listeners.
   */
  function unbind() {
    if (!_bound || !container) return;

    for (const { eventType, listener } of _activeBindings) {
      container.removeEventListener(eventType, listener);
    }

    _activeBindings.length = 0;
    _bound = false;
    _log('debug', 'All bindings removed');
  }

  /**
   * Rebind: unbind then bind again (useful after DOM changes).
   */
  function rebind() {
    unbind();
    bind();
  }

  /**
   * Check if bindings are active.
   * @returns {boolean}
   */
  function isBound() {
    return _bound;
  }

  /**
   * Get binding count.
   * @returns {number}
   */
  function getBindingCount() {
    return _activeBindings.length;
  }

  return { bind, unbind, rebind, isBound, getBindingCount };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, defaultBindingsCount: DEFAULT_BINDINGS.length };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { EventBindings, DEFAULT_BINDINGS, injectPorts, info, healthCheck, VERSION, MODULE_ID };
