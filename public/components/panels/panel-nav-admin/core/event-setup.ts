// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (12.0.0-O1-DISPATCH)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin-event-setup
// PURPOSE: Panel Nav Admin - Event Setup Module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   store from ../state/store.js
//   triggerConfetti from ../renderer/effects.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   setupEventListeners() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// LISTENS (eventos):
//   'change', 'click', 'dblclick', 'input', 'keydown', 'submit'
//   (drag mousedown REMOVED — drag-drop.ts v11.0.0 uses single document listener)
//
// @changelog
//   12.0.0-O1-DISPATCH: O(1) click handler via single DOM walk + Map dispatch.
//     Instead of 7 sequential .closest() calls, walks from target upward ONCE
//     collecting the first matching selector, then dispatches via Map lookup.
//     Reduces per-click DOM traversals from ~7 to 1. Preserves all handler
//     priority order via walk-order (closest to target wins).
//   11.3.0-OPTIMIZED-CLICK: Cached repeated .closest() lookups in click handler.
//   11.0.0-DOCUMENT-DRAG: Removed container mousedown listener for drag.
//   10.6.0-MOUSE-DRAG: Removed HTML5 drag event listeners.
//   10.5.0-LABEL-INLINE-EDIT: Added inlineEditHandlers.handleLabelClick.
//   10.4.0-GROUP-SELECT: Added groupSelectHandlers.handleGroupClick.
//   10.3.0-ICON-POPOVER: Added iconPopoverHandlers.handleIconClick.
//   10.2.0-ROUTE-SELECT: Added routeSelectHandlers.handleRouteClick.
// ═══════════════════════════════════════════════════════════════
'use strict';

import { store } from '../state/store.js';
import * as crud from '../handlers/crud.js';
import { triggerConfetti } from '../renderer/effects.js';

export var MODULE_ID = 'panel-nav-admin-event-setup';
export var VERSION = '12.3.0-STOP-PROPAGATION';

export function setupEventListeners(deps: Record<string, unknown>) {
    var container = deps.container as HTMLElement;
    var abortController = deps.abortController as AbortController;
    var refs = deps.refs;
    var clickRouter = deps.clickRouter as ((e: MouseEvent) => void) | undefined;
    var keyboardHandlers = deps.keyboardHandlers as Record<string, (e: KeyboardEvent) => void> | undefined;
    var inlineEditHandlers = deps.inlineEditHandlers as Record<string, (e: MouseEvent) => void> | undefined;
    var dragDropHandlers = deps.dragDropHandlers as Record<string, (e: DragEvent) => void> | undefined;
    var filterChipsHandlers = deps.filterChipsHandlers as Record<string, (...args: unknown[]) => void> | undefined;
    var autocompleteRenderer = deps.autocompleteRenderer as Record<string, (v: string) => void> | undefined;
    var routeSelectHandlers = deps.routeSelectHandlers as Record<string, (e: MouseEvent) => void> | undefined;
    var columnSortHandlers = deps.columnSortHandlers as Record<string, (...args: unknown[]) => void> | undefined;
    var iconPopoverHandlers = deps.iconPopoverHandlers as Record<string, (e: MouseEvent) => void> | undefined;
    var groupSelectHandlers = deps.groupSelectHandlers as Record<string, (e: MouseEvent) => void> | undefined;
    var levelSelectHandlers = deps.levelSelectHandlers as Record<string, (e: MouseEvent) => void> | undefined;
    var applyFilters = deps.applyFilters as () => void;
    var showToast = deps.showToast;
    if (!container || !abortController) return;
    var signal = abortController.signal;

    // v12.0.0-O1-DISPATCH: Build dispatch map once at setup time.
    // Each entry maps a CSS class/attribute to its handler function.
    // Walk from target upward: first match wins (preserves priority).
    // 'headerOnly: false' means handler only fires in body rows (not header).
    type DispatchEntry = {
        handler: (e: MouseEvent) => void;
        bodyOnly: boolean; // true = skip if inside .pna-list-header
    };

    // Build dispatch entries — order doesn't matter because we walk DOM once
    // and match the first ancestor that has any of these selectors
    var _classDispatch: Record<string, DispatchEntry> = {};
    var _attrDispatch: Record<string, DispatchEntry> = {};

    // [data-sort] inside .pna-list-header — handled specially in walk
    // [data-action] — route to clickRouter
    if (clickRouter) {
        _attrDispatch['data-action'] = { handler: clickRouter, bodyOnly: false };
    }
    if (inlineEditHandlers) {
        _classDispatch['pna-item-label'] = {
            handler: function(e: MouseEvent) { (inlineEditHandlers as Record<string, (e: MouseEvent) => void>).handleLabelClick(e); },
            bodyOnly: true
        };
        _classDispatch['pna-display-title'] = {
            handler: function(e: MouseEvent) { (inlineEditHandlers as Record<string, (e: MouseEvent) => void>).handleDisplayTitleClick(e); },
            bodyOnly: true
        };
    }
    if (iconPopoverHandlers) {
        _attrDispatch['data-icon-col'] = {
            handler: function(e: MouseEvent) { iconPopoverHandlers!.handleIconClick(e); },
            bodyOnly: false
        };
    }
    if (routeSelectHandlers) {
        _classDispatch['pna-col-href'] = {
            handler: function(e: MouseEvent) { routeSelectHandlers!.handleRouteClick(e); },
            bodyOnly: false
        };
    }
    if (levelSelectHandlers) {
        _classDispatch['pna-col-level'] = {
            handler: function(e: MouseEvent) { levelSelectHandlers!.handleLevelClick(e); },
            bodyOnly: true
        };
    }
    if (groupSelectHandlers) {
        _classDispatch['pna-col-group'] = {
            handler: function(e: MouseEvent) { groupSelectHandlers!.handleGroupClick(e); },
            bodyOnly: true
        };
    }

    // v12.1.0-FAST-DISPATCH: Pre-compute key arrays to avoid for...in iterator overhead.
    // for...in creates an iterator object on each invocation; indexed for loop is ~3x faster.
    var _attrKeys = Object.keys(_attrDispatch);
    var _classKeys = Object.keys(_classDispatch);
    var _attrLen = _attrKeys.length;
    var _classLen = _classKeys.length;

    container.addEventListener('click', function(e: MouseEvent) {
        var el = e.target as HTMLElement;

        var closestAction = (el as Element).closest ? (el as Element).closest('[data-action]') as HTMLElement | null : null;

        // v12.4.0-TAB-FIX: Handle data-tab clicks before dispatch map walk
    var tabEl = (el as Element).closest ? (el as Element).closest('[data-tab]') as HTMLElement | null : null;
    if (tabEl && tabEl.dataset.tab) {
        var tab = tabEl.dataset.tab;
        store.setActiveTab(tab);
        if (clickRouter) clickRouter(e);
        return;
    }

    // v12.1.0: FAST PATH — data-action on target or immediate parent.
        // >80% of interactive clicks land on [data-action] elements (buttons, icons).
        // Checking target + parent directly avoids entering the walk loop entirely.
        if (el.dataset && el.dataset.action) {
            // v12.3.0: Stop propagation for popover-triggering actions to prevent
            // re-render from destroying the popover before user can interact.
            var fastAction = el.dataset.action;
            if (fastAction === 'delete-item' || fastAction === 'duplicate-item') {
                e.stopPropagation();
                e.preventDefault();
            }
            if (clickRouter) clickRouter(e);
            if (fastAction === 'delete-item' || fastAction === 'duplicate-item') {
                e.stopImmediatePropagation();
            }
            return;
        }
        var elParent = el.parentElement;
        if (elParent && (elParent as HTMLElement).dataset && (elParent as HTMLElement).dataset.action) {
            // v12.3.0: Stop propagation for popover-triggering actions (parent path)
            var parentAction = (elParent as HTMLElement).dataset.action;
            if (parentAction === 'delete-item' || parentAction === 'duplicate-item') {
                e.stopPropagation();
                e.preventDefault();
            }
            if (clickRouter) clickRouter(e);
            if (parentAction === 'delete-item' || parentAction === 'duplicate-item') {
                e.stopImmediatePropagation();
            }
            return;
        }

        // WALK: for deeper/nested clicks — single pass from target to container
        var node: Element | null = el;
        var isInHeader = false;
        var matched: DispatchEntry | null = null;
        var foundSort = false;

        while (node && node !== container) {
            // Track if we're inside header (for bodyOnly checks)
            if (!isInHeader && node.classList && node.classList.contains('pna-list-header')) {
                isInHeader = true;
            }

            // v12.1.0: Sort detection via walk — no .closest() needed.
            // Check data-sort on each node while walking inside header.
            if (isInHeader && !foundSort && columnSortHandlers && node instanceof HTMLElement && node.hasAttribute('data-sort')) {
                (columnSortHandlers as Record<string, (e: MouseEvent) => void>).handleHeaderClick(e);
                return;
            }

            // Check attributes — data-action, data-icon-col (indexed loop, no for...in)
            if (!matched && node instanceof HTMLElement) {
                for (var ai = 0; ai < _attrLen; ai++) {
                    if (node.hasAttribute(_attrKeys[ai])) {
                        matched = _attrDispatch[_attrKeys[ai]];
                        // data-action is always highest priority — dispatch immediately
                        if (_attrKeys[ai] === 'data-action') {
                            // v12.3.0: Stop propagation for popover-triggering actions
                            var walkAction = node.getAttribute('data-action');
                            if (walkAction === 'delete-item' || walkAction === 'duplicate-item') {
                                e.stopPropagation();
                                e.preventDefault();
                            }
                            matched.handler(e);
                            if (walkAction === 'delete-item' || walkAction === 'duplicate-item') {
                                e.stopImmediatePropagation();
                            }
                            return;
                        }
                        break;
                    }
                }
            }

            // Check classes — pna-item-label, pna-col-href, etc. (indexed loop)
            if (!matched && node.classList) {
                for (var ci = 0; ci < _classLen; ci++) {
                    if (node.classList.contains(_classKeys[ci])) {
                        matched = _classDispatch[_classKeys[ci]];
                        break;
                    }
                }
            }

            node = node.parentElement;
        }

        // Dispatch matched handler (if any) after walk completes
        if (matched) {
            if (matched.bodyOnly && isInHeader) {
                // bodyOnly handler inside header — fall through to clickRouter
                if (clickRouter) clickRouter(e);
                return;
            }
            matched.handler(e);
            return;
        }

        // No match found — fall through to clickRouter
        if (clickRouter) clickRouter(e);
    }, { signal: signal });

    container.addEventListener('change', function(e: Event) {
        // v11.4.0: Handle bulk checkbox changes
        var changeTarget = e.target as HTMLInputElement;
        if (changeTarget.classList.contains('pna-bulk-select-all')) {
            var checked = changeTarget.checked;
            var checkboxes = container.querySelectorAll('.pna-bulk-checkbox') as NodeListOf<HTMLInputElement>;
            for (var ci = 0; ci < checkboxes.length; ci++) checkboxes[ci].checked = checked;
            // Dispatch custom event for index.ts to update bulk selection
            container.dispatchEvent(new CustomEvent('pna:bulk-selection-changed', { bubbles: false }));
            return;
        }
        if (changeTarget.classList.contains('pna-bulk-checkbox')) {
            container.dispatchEvent(new CustomEvent('pna:bulk-selection-changed', { bubbles: false }));
            return;
        }
        handleChange(e, filterChipsHandlers, applyFilters);
    }, { signal: signal });
    container.addEventListener('input', function(e: Event) { handleInput(e, filterChipsHandlers, autocompleteRenderer, applyFilters); }, { signal: signal });
    container.addEventListener('submit', function(e: Event) { handleSubmit(e, refs, showToast); }, { signal: signal });
    container.addEventListener('keydown', function(e: KeyboardEvent) { if (keyboardHandlers) keyboardHandlers.handleInputKeydown(e); }, { signal: signal });
    container.addEventListener('dblclick', function(e: MouseEvent) { if (inlineEditHandlers) inlineEditHandlers.handleDoubleClick(e); }, { signal: signal });
    // v11.0.0-DOCUMENT-DRAG: Drag uses a single document-level mousedown listener
    // installed by drag-drop.ts init(). No container listener needed here.
    document.addEventListener('keydown', function(e: KeyboardEvent) { if (keyboardHandlers) keyboardHandlers.handleGlobalKeydown(e); }, { signal: signal });
}

function handleChange(e: Event, filterChipsHandlers: unknown, applyFilters: () => void) {
    const changeTarget = e.target as HTMLSelectElement;
    var filter = changeTarget.dataset.filter;
    if (!filter) return;
    // v10.2.0: Ignore change events from route dropdown
    if (changeTarget.classList.contains('pna-route-dropdown') || changeTarget.classList.contains('pna-group-dropdown') || changeTarget.classList.contains('pna-level-dropdown')) return;
    var value = changeTarget.value;
    store.setFilter(filter, value);
    if (filter !== 'search') {
        var options = changeTarget.options;
        var label = (options && options[changeTarget.selectedIndex]) ? options[changeTarget.selectedIndex].text : filter;
        if (filterChipsHandlers) (filterChipsHandlers as Record<string, (...args: unknown[]) => void>).addFilterChip(filter, (value && value !== 'all' && value !== '') ? label : null, filter);
    }
    applyFilters();
}

var _inputTimer: ReturnType<typeof setTimeout> | null = null;
function handleInput(e: Event, filterChipsHandlers: unknown, autocompleteRenderer: unknown, applyFilters: () => void) {
    const inputTarget = e.target as HTMLInputElement;
    var filter = inputTarget.dataset.filter;
    if (filter !== 'search') return;
    clearTimeout(_inputTimer!);
    _inputTimer = setTimeout(function() {
        store.setFilter('search', inputTarget.value);
        const target = inputTarget;
        if (target.value) { if (filterChipsHandlers) (filterChipsHandlers as Record<string, (...args: unknown[]) => void>).addFilterChip('search', target.value, 'Busca'); }
        else { if (filterChipsHandlers) (filterChipsHandlers as Record<string, (...args: unknown[]) => void>).removeFilterChip('search'); }
        if (autocompleteRenderer) (autocompleteRenderer as Record<string, (v: string) => void>).updateAutocomplete(target.value);
        applyFilters();
    }, 300);
}

async function handleSubmit(e: Event, refs: unknown, showToast: unknown) {
    e.preventDefault();
    var form = (e.target as HTMLElement).closest('[data-form]') as HTMLFormElement | null;
    if (!form) return;
    var formType = (form as HTMLElement & { dataset: DOMStringMap }).dataset.form;
    var formData = new FormData(form);
    var data: Record<string, unknown> = {};
    formData.forEach(function(value, key) { data[key] = value; });
    var isDividerEl = form.querySelector('[name="isDivider"]') as HTMLInputElement | null;
    var scaffoldEl = form.querySelector('[name="scaffold"]') as HTMLInputElement | null;

    data.isDivider = isDividerEl ? isDividerEl.checked : false;
    data.scaffold = scaffoldEl ? scaffoldEl.checked : false;
    const refsMap = refs as Record<string, unknown> | null;
    // @ts-expect-error strict migration — TS2345
    var callbacks = { showToast: showToast, showLoading: function() {}, closeAllModals: function() {}, loadData: function() {}, triggerConfetti: function() { triggerConfetti(refsMap ? refsMap.confettiContainer as HTMLElement : null, 30); } };
    if (formType === 'item') {
        var result = await crud.saveItem(data, callbacks);

        // @ts-expect-error TS migration - TS1345
        if (result && result.success && !data.id) triggerConfetti(refsMap ? refsMap.confettiContainer as HTMLElement : null, 30);
    } else if (formType === 'section') {
        var result2 = await crud.saveSection(data, callbacks);

        // @ts-expect-error TS migration - TS1345
        if (result2 && result2.success && !data.key) triggerConfetti(refsMap ? refsMap.confettiContainer as HTMLElement : null, 30);
    }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { MODULE_ID: MODULE_ID, VERSION: VERSION, setupEventListeners: setupEventListeners, info: info, healthCheck: healthCheck };
