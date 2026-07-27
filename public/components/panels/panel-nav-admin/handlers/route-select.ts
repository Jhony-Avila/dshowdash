// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ROUTE-INPUT)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin-handlers-route-select
// PURPOSE: Inline route/panel input editor for items table
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none — deps injected via createRouteSelectHandlers)
//
// PROVIDES:
//   createRouteSelectHandlers() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// LISTENS (eventos via event-setup):
//   'click' on .pna-col-href
//
// @changelog
//   2.0.0-ROUTE-INPUT: MAJOR — Replaced <select> dropdown with <input> text field.
//     Click on route cell opens editable text input with current value.
//     Enter or blur saves via PATCH (href or panelId). Escape cancels.
//     Optimistic DOM update, revert on error.
//   10.2.0-ROUTE-SELECT: Initial — Inline route dropdown on click.
// ═══════════════════════════════════════════════════════════════
'use strict';

export var MODULE_ID = 'panel-nav-admin-handlers-route-select';
export var VERSION = '2.0.0-ROUTE-INPUT';

type ActiveEdit = { input: HTMLInputElement; hrefCol: HTMLElement; codeEl: HTMLElement | null; meta: Record<string, unknown>; originalValue: string };
var _activeEdit: ActiveEdit | null = null;

export function createRouteSelectHandlers(deps: Record<string, unknown>) {
    var navAdapter = deps.navAdapter as { updateItem: (id: string, updates: Record<string, unknown>, opts: Record<string, unknown>) => Promise<Record<string, unknown>> };
    var showToast = deps.showToast as (msg: string, type: string) => void;
    var loadData = deps.loadData as () => void;

    function handleRouteClick(e: Event) {
        var hrefCol = (e.target as HTMLElement).closest('.pna-col-href') as HTMLElement | null;
        if (!hrefCol) return;

        // Don't open if already editing
        if (hrefCol.querySelector('.pna-route-input')) return;

        var row = hrefCol.closest('[data-item-id]') as HTMLElement | null;
        if (!row) return;

        var itemId = row.dataset.itemId;
        var sourceTable = row.dataset.sourceTable;
        var sourceId = row.dataset.sourceId;

        if (!sourceTable || !sourceId) {
            showToast('Item sem source_table/source_id — não editável', 'warning');
            return;
        }

        // Close any existing edit first
        _closeActiveEdit(false);

        // Get current value from the code element
        var codeEl = hrefCol.querySelector('.pna-item-href') as HTMLElement | null;
        var currentValue = codeEl ? (codeEl.textContent || '').trim() : '';
        if (currentValue === '-') currentValue = '';

        _openInput(hrefCol, currentValue, {
            itemId: itemId,
            sourceTable: sourceTable,
            sourceId: sourceId,
            codeEl: codeEl
        });
    }

    function _openInput(hrefCol: HTMLElement, currentValue: string, meta: Record<string, unknown>) {
        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'pna-route-input';
        input.value = currentValue;
        input.placeholder = 'ex: #/dashboard ou panel-xyz';

        // Hide the code element, insert input
        if (meta.codeEl) (meta.codeEl as HTMLElement).style.display = 'none';
        hrefCol.appendChild(input);

        _activeEdit = {
            input: input,
            hrefCol: hrefCol,
            codeEl: meta.codeEl as HTMLElement | null,
            meta: meta,
            originalValue: currentValue
        };

        // Focus and select
        input.focus();
        input.select();

        var _saved = false;

        function _finishEdit(save: boolean) {
            if (_saved) return;
            _saved = true;
            var newValue = input.value.trim();

            if (!save || newValue === currentValue) {
                _closeActiveEdit(false);
                return;
            }

            // Save the new value
            _saveRoute(newValue);
        }

        // Event handlers
        input.addEventListener('keydown', function(ev) {
            if (ev.key === 'Enter') {
                ev.preventDefault();
                _finishEdit(true);
            } else if (ev.key === 'Escape') {
                ev.preventDefault();
                ev.stopPropagation();
                _finishEdit(false);
            }
        });

        input.addEventListener('blur', function() {
            _finishEdit(true);
        });
    }

    function _saveRoute(newValue: string) {
        if (!_activeEdit) return;
        var meta = _activeEdit.meta;
        var originalValue = _activeEdit.originalValue;

        // v11.3.0: Validate route format before save
        if (newValue && newValue.indexOf('#') !== 0 && newValue.indexOf('/') !== 0 && newValue.indexOf('panel-') !== 0) {
            showToast('Rota deve começar com #, / ou panel-', 'error');
            _closeActiveEdit(true);
            return;
        }

        // Determine if it's a route_path or panel_id
        var isRoute = newValue.indexOf('#/') === 0 || newValue.indexOf('/') === 0;
        var updates: Record<string, unknown> = {
            sourceTable: meta.sourceTable,
            sourceId: meta.sourceId
        };

        if (isRoute) {
            updates.href = newValue;
        } else {
            updates.panelId = newValue;
        }

        // Show new value optimistically
        if (_activeEdit.codeEl) {
            _activeEdit.codeEl.textContent = newValue || '-';
        }
        _closeActiveEdit(false);

        // PATCH via API
        navAdapter.updateItem(meta.itemId as string, updates, {}).then(function(result) {
            if (result.success) {
                showToast('Rota atualizada: ' + newValue, 'success');
                loadData();
            } else {
                showToast('Erro ao salvar: ' + (result.error || 'desconhecido'), 'error');
                // Revert display
                if (meta.codeEl) (meta.codeEl as HTMLElement).textContent = originalValue || '-';
            }
        }).catch(function(err: Error) {
            showToast('Erro: ' + err.message, 'error');
            if (meta.codeEl) (meta.codeEl as HTMLElement).textContent = originalValue || '-';
        });
    }

    function _closeActiveEdit(revert: boolean) {
        if (!_activeEdit) return;
        var ed = _activeEdit;
        _activeEdit = null;
        if (ed.codeEl) ed.codeEl.style.display = '';
        if (ed.input && ed.input.parentNode) {
            ed.input.parentNode.removeChild(ed.input);
        }
    }

    function clearRoutesCache() {
        // No cache in input mode, kept for backward compatibility
    }

    return {
        handleRouteClick: handleRouteClick,
        clearRoutesCache: clearRoutesCache
    };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
