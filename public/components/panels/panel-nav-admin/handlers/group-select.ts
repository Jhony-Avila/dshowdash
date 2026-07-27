// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-CUSTOM-SELECT)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin-handlers-group-select
// PURPOSE: Inline group selector via CustomSelect for items table
// ───────────────────────────────────────────────────────────────
// IMPORTS: openCustomSelect, closeCustomSelect from ui/custom-select
//
// PROVIDES:
//   createGroupSelectHandlers() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// LISTENS (eventos via event-setup):
//   'click' on .pna-col-group
//
// EMITS:
//   CustomEvent 'navigation:items:changed'
//
// @changelog
//   2.0.0-CUSTOM-SELECT: Migrated from native <select> to CustomSelect popover.
//   1.1.0-FETCH-TIMEOUT: Added 5s timeout to fetchSections.
//   1.0.0-GROUP-SELECT: Initial — Inline group dropdown on click.
// ═══════════════════════════════════════════════════════════════
'use strict';

import { openCustomSelect, closeCustomSelect } from '../ui/custom-select.js';

export var MODULE_ID = 'panel-nav-admin-handlers-group-select';
export var VERSION = '2.0.0-CUSTOM-SELECT';

var _cachedSections: Record<string, unknown>[] | null = null;
var _fetchInFlight = false;
var _isOpen = false;

var _FETCH_TIMEOUT_MS = 5000;

export function createGroupSelectHandlers(deps: Record<string, unknown>) {
    var navAdapter = deps.navAdapter as {
        fetchSections: (opts: Record<string, unknown>) => Promise<Record<string, unknown>>;
        updateItem: (id: string, updates: Record<string, unknown>, opts: Record<string, unknown>) => Promise<Record<string, unknown>>;
    };
    var showToast = deps.showToast as (msg: string, type: string) => void;
    var loadData = deps.loadData as () => void;

    function handleGroupClick(e: Event) {
        var groupCol = (e.target as HTMLElement).closest('.pna-col-group') as HTMLElement | null;
        if (!groupCol) return;

        // Don't open if already open
        if (_isOpen) return;

        var row = groupCol.closest('[data-item-id]') as HTMLElement | null;
        if (!row) return;

        var itemId = row.dataset.itemId;
        var sourceTable = row.dataset.sourceTable;
        var sourceId = row.dataset.sourceId;
        var section = row.dataset.section;

        if (!sourceTable || !sourceId) {
            showToast('Item sem source_table/source_id — não editável', 'warning');
            return;
        }

        // Prevent duplicate fetches while one is in-flight
        if (_fetchInFlight) return;

        // Get current value from the badge element
        var badgeEl = groupCol.querySelector('.pna-badge-group') as HTMLElement | null;
        var currentValue = badgeEl ? (badgeEl.getAttribute('title') || '').trim() : '';

        // Show loading state
        groupCol.classList.add('pna-group-loading');

        // Fetch sections then open dropdown — with timeout
        _fetchInFlight = true;
        _getSectionsWithTimeout(navAdapter).then(function(sections) {
            _fetchInFlight = false;
            groupCol!.classList.remove('pna-group-loading');

            var anchorEl = badgeEl || groupCol!;
            _isOpen = true;

            // Build options from sections
            var groupOptions: { value: string; label: string; description?: string }[] = [
                { value: '', label: 'Sem grupo', description: 'Item avulso' }
            ];
            for (var i = 0; i < sections.length; i++) {
                var s = sections[i];
                var sKey = (s.key || s.group_key || s.item_key || '') as string;
                var sLabel = (s.label || s.displayLabel || sKey) as string;
                var sCtx = (s.context || s.display_context || '') as string;
                groupOptions.push({
                    value: sKey,
                    label: sLabel,
                    description: sCtx ? sCtx : undefined
                });
            }

            openCustomSelect({
                anchor: anchorEl,
                options: groupOptions,
                value: currentValue,
                searchable: true,
                searchPlaceholder: 'Buscar grupo...',
                width: 220,
                onSelect: function(newValue) {
                    _isOpen = false;
                    if (newValue === currentValue) return;

                    // Find the label for the selected group
                    var newLabel = newValue ? newValue : '-';
                    if (_cachedSections && newValue) {
                        for (var j = 0; j < _cachedSections.length; j++) {
                            var sec = _cachedSections[j];
                            var secKey = (sec.key || sec.group_key || sec.item_key || '') as string;
                            if (secKey === newValue) {
                                newLabel = (sec.label || sec.displayLabel || secKey) as string;
                                break;
                            }
                        }
                    }

                    // Update badge immediately
                    if (badgeEl) {
                        badgeEl.textContent = newLabel;
                        badgeEl.setAttribute('title', newValue);
                    }

                    // PATCH via API
                    var updates: Record<string, unknown> = {
                        sourceTable: sourceTable,
                        sourceId: sourceId,
                        parentKey: newValue || null
                    };

                    navAdapter.updateItem(itemId as string, updates, {}).then(function(result) {
                        if (result.success) {
                            showToast('Grupo atualizado: ' + (newLabel || 'Sem grupo'), 'success');
                            window.dispatchEvent(new CustomEvent('navigation:items:changed', {
                                detail: {
                                    source: 'panel-nav-admin',
                                    action: 'group-change',
                                    itemId: itemId,
                                    newGroup: newValue,
                                    timestamp: Date.now()
                                }
                            }));
                            loadData();
                        } else {
                            showToast('Erro ao salvar: ' + (result.error || 'desconhecido'), 'error');
                            if (badgeEl) {
                                badgeEl.textContent = currentValue || '-';
                                badgeEl.setAttribute('title', currentValue);
                            }
                        }
                    }).catch(function(err: Error) {
                        showToast('Erro: ' + err.message, 'error');
                        if (badgeEl) {
                            badgeEl.textContent = currentValue || '-';
                            badgeEl.setAttribute('title', currentValue);
                        }
                    });
                },
                onClose: function() {
                    _isOpen = false;
                }
            });
        }).catch(function(err) {
            _fetchInFlight = false;
            groupCol!.classList.remove('pna-group-loading');
            showToast('Erro ao carregar grupos: ' + err.message, 'error');
        });
    }

    // Fetch with timeout wrapper
    function _getSectionsWithTimeout(adapter: typeof navAdapter): Promise<Record<string, unknown>[]> {
        if (_cachedSections) return Promise.resolve(_cachedSections);

        return new Promise(function(resolve, reject) {
            var timedOut = false;
            var timer = setTimeout(function() {
                timedOut = true;
                reject(new Error('Timeout: API não respondeu em ' + (_FETCH_TIMEOUT_MS / 1000) + 's'));
            }, _FETCH_TIMEOUT_MS);

            _getSections(adapter).then(function(sections) {
                if (!timedOut) {
                    clearTimeout(timer);
                    resolve(sections);
                }
            }).catch(function(err) {
                if (!timedOut) {
                    clearTimeout(timer);
                    reject(err);
                }
            });
        });
    }

    function _getSections(adapter: typeof navAdapter) {
        if (_cachedSections) return Promise.resolve(_cachedSections);
        return adapter.fetchSections({}).then(function(result) {
            var data = result as unknown;
            if (Array.isArray(data)) {
                _cachedSections = data;
                return _cachedSections;
            }
            var flat: Record<string, unknown>[] = [];
            if (data && typeof data === 'object') {
                var keys = Object.keys(data as Record<string, unknown>);
                for (var k = 0; k < keys.length; k++) {
                    var arr = (data as Record<string, unknown[]>)[keys[k]];
                    if (Array.isArray(arr)) {
                        for (var j = 0; j < arr.length; j++) {
                            flat.push(arr[j] as Record<string, unknown>);
                        }
                    }
                }
            }
            _cachedSections = flat;
            return _cachedSections;
        });
    }

    function clearSectionsCache() {
        _cachedSections = null;
    }

    return {
        handleGroupClick: handleGroupClick,
        clearSectionsCache: clearSectionsCache
    };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
