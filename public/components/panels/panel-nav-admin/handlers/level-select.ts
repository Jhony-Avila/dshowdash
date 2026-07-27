// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-LEVEL-BADGE-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin-handlers-level-select
// PURPOSE: Inline level selector via CustomSelect for items table
// ───────────────────────────────────────────────────────────────
// IMPORTS: openCustomSelect, closeCustomSelect from ui/custom-select
//
// PROVIDES:
//   createLevelSelectHandlers() — exported function
//   getLevelBadgeHTML(level) — exported utility (shared with renderer)
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// LISTENS (eventos via event-setup):
//   'click' on .pna-col-level
//
// EMITS:
//   CustomEvent 'navigation:items:changed'
//
// @changelog
//   2.1.0-LEVEL-BADGE-FIX: Fix — after save, badge now shows colored chip with
//     descriptive label instead of raw number. Added getLevelBadgeHTML() utility.
//     Fixed currentValue detection to read data-level attribute instead of parsing text.
//     Fixed CSS class swap (pna-level-N) on badge update.
//   2.0.0-LEVEL-SELECT: Migrated from native <select> to CustomSelect popover.
//   1.0.0-LEVEL-SELECT: Initial — Inline level dropdown on click.
// ═══════════════════════════════════════════════════════════════
'use strict';

import { openCustomSelect, closeCustomSelect } from '../ui/custom-select.js';

export var MODULE_ID = 'panel-nav-admin-handlers-level-select';
export var VERSION = '2.1.0-LEVEL-BADGE-FIX';

var LEVEL_OPTIONS = [
    { value: '0', label: 'Público',   color: '#9ca3af', description: 'Nível 0 — Público' },
    { value: '1', label: 'Usuário',   color: '#4ade80', description: 'Nível 1 — Usuário' },
    { value: '2', label: 'Moderador', color: '#60a5fa', description: 'Nível 2 — Moderador' },
    { value: '3', label: 'Admin',     color: '#ef4444', description: 'Nível 3 — Admin' }
];

var LEVEL_LABELS: Record<string, string> = { '0': 'Público', '1': 'Usuário', '2': 'Moderador', '3': 'Admin' };

var SHIELD_ICON = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';

/**
 * Returns the inner HTML for a level badge chip (icon + label).
 * Used by both the renderer (initial render) and this handler (after save).
 */
export function getLevelBadgeHTML(level: string | number): string {
    var lvl = String(level);
    var label = LEVEL_LABELS[lvl] || ('Nível ' + lvl);
    return SHIELD_ICON + ' ' + label;
}

/**
 * Applies level badge state to a badge element: innerHTML, data-level,
 * CSS classes (pna-level-N, pna-badge-admin).
 */
function _applyLevelBadge(badgeEl: HTMLElement, level: string): void {
    badgeEl.innerHTML = getLevelBadgeHTML(level);
    badgeEl.setAttribute('data-level', level);

    // Swap pna-level-N class
    var classes = badgeEl.className.split(' ');
    var filtered: string[] = [];
    for (var i = 0; i < classes.length; i++) {
        if (classes[i].indexOf('pna-level-') !== 0) {
            filtered.push(classes[i]);
        }
    }
    filtered.push('pna-level-' + level);
    badgeEl.className = filtered.join(' ');

    // Admin class
    var numVal = parseInt(level, 10);
    if (numVal >= 80) {
        badgeEl.classList.add('pna-badge-admin');
    } else {
        badgeEl.classList.remove('pna-badge-admin');
    }
}

var _isOpen = false;

export function createLevelSelectHandlers(deps: Record<string, unknown>) {
    var navAdapter = deps.navAdapter as {
        updateItem: (id: string, updates: Record<string, unknown>, opts: Record<string, unknown>) => Promise<Record<string, unknown>>;
    };
    var showToast = deps.showToast as (msg: string, type: string) => void;
    var loadData = deps.loadData as () => void;

    function handleLevelClick(e: Event) {
        var levelCol = (e.target as HTMLElement).closest('.pna-col-level') as HTMLElement | null;
        if (!levelCol) return;

        // Don't open if already open
        if (_isOpen) return;

        var row = levelCol.closest('[data-item-id]') as HTMLElement | null;
        if (!row) return;

        var itemId = row.dataset.itemId;
        var sourceTable = row.dataset.sourceTable;
        var sourceId = row.dataset.sourceId;

        if (!sourceTable || !sourceId) {
            showToast('Item sem source_table/source_id — não editável', 'warning');
            return;
        }

        // Get current value from the badge data-level attribute (reliable source)
        var badgeEl = levelCol.querySelector('.pna-badge-level') as HTMLElement | null;
        var currentValue = '0';
        if (badgeEl) {
            currentValue = badgeEl.getAttribute('data-level') || '0';
        }

        var anchorEl = badgeEl || levelCol;
        _isOpen = true;

        openCustomSelect({
            anchor: anchorEl,
            options: LEVEL_OPTIONS,
            value: currentValue,
            searchable: false,
            width: 180,
            onSelect: function(newValue) {
                _isOpen = false;
                if (newValue === currentValue) return;

                // Update badge immediately with colored chip
                if (badgeEl) {
                    _applyLevelBadge(badgeEl, newValue);
                }

                // Find the label for the selected level
                var levelLabel = LEVEL_LABELS[newValue] || newValue;

                // PATCH via API
                var updates: Record<string, unknown> = {
                    sourceTable: sourceTable,
                    sourceId: sourceId,
                    minLevel: parseInt(newValue, 10)
                };

                navAdapter.updateItem(itemId as string, updates, {}).then(function(result) {
                    if (result.success) {
                        showToast('Nível atualizado: ' + levelLabel, 'success');
                        window.dispatchEvent(new CustomEvent('navigation:items:changed', {
                            detail: {
                                source: 'panel-nav-admin',
                                action: 'level-change',
                                itemId: itemId,
                                newLevel: newValue,
                                timestamp: Date.now()
                            }
                        }));
                        loadData();
                    } else {
                        showToast('Erro ao salvar: ' + (result.error || 'desconhecido'), 'error');
                        // Rollback to previous level chip
                        if (badgeEl) {
                            _applyLevelBadge(badgeEl, currentValue);
                        }
                    }
                }).catch(function(err: Error) {
                    showToast('Erro: ' + err.message, 'error');
                    // Rollback to previous level chip
                    if (badgeEl) {
                        _applyLevelBadge(badgeEl, currentValue);
                    }
                });
            },
            onClose: function() {
                _isOpen = false;
            }
        });
    }

    return {
        handleLevelClick: handleLevelClick
    };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
