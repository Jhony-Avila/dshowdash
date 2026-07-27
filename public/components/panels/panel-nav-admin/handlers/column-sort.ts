// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-MOUSE-DRAG)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin-handlers-column-sort
// PURPOSE: Column sorting (click header) + column reorder (mouse drag)
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none — deps injected via createColumnSortHandlers)
//
// PROVIDES:
//   createColumnSortHandlers() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// LISTENS (eventos via event-setup):
//   'click' on [data-sort]  — sort rows asc/desc
//   'mousedown/mousemove/mouseup' on [data-col] — reorder columns (mouse-based)
//
// @changelog
//   1.1.0-MOUSE-DRAG: Replaced HTML5 native drag with mousedown+mousemove+mouseup.
//     Native drag was unreliable in grid layouts due to container-level dragover
//     calling e.preventDefault() before checking drag source (row vs column).
//   1.0.0-MINI-DATAGRID: Initial — Sort by column + drag-reorder columns.
// ═══════════════════════════════════════════════════════════════
'use strict';

export var MODULE_ID = 'panel-nav-admin-handlers-column-sort';
export var VERSION = '2.0.0-GRID-12COL';

// v2.0.0-GRID-12COL: model ALL 12 columns of the real grid (was 8). The runtime table
// (renderer/items.ts + styles/_pna-base-list.css) is 12-column; the previous 8-column
// model rewrote grid-template-columns with only 8 tracks on reorder/resize, misaligning
// header vs cells. Keys/order/widths below mirror _pna-base-list.css exactly.
var SORT_FIELD_MAP: Record<string, string> = {
    'label': 'label',
    'status': 'isActive',
    'id': 'id',
    'href': 'displayHref',
    'context': 'section',
    'group': 'parentLabel',
    'level': 'minLevel'
};

var COL_WIDTHS: Record<string, string> = {
    'bulk': '36px',
    'order': '50px',
    'icon': '44px',
    'label': '1.4fr',
    'display-title': '1fr',
    'status': '72px',
    'id': '1.2fr',
    'href': '1fr',
    'context': '90px',
    'group': '110px',
    'level': '70px',
    'actions': '80px'
};

// Columns that must never be drag-reordered (structural: selection, order handle, actions).
var FIXED_COLS: Record<string, boolean> = { 'bulk': true, 'order': true, 'actions': true };

export function createColumnSortHandlers(deps: Record<string, unknown>) {
    var container = deps.container as HTMLElement;

    // ── Sort state ──
    var _sortState = { col: null as string | null, dir: 'asc' as string };

    // ── Column order state (12 columns — mirrors renderer/items.ts + _pna-base-list.css) ──
    var _colOrder = ['bulk', 'order', 'icon', 'label', 'display-title', 'status', 'id', 'href', 'context', 'group', 'level', 'actions'];

    // ── Mouse drag state ──
    var _draggingCol: string | null = null;
    var _dragGhost: HTMLElement | null = null;
    var _dragStartX = 0;
    var _dragStartY = 0;
    var _isDragging = false;
    var _currentHeader: HTMLElement | null = null;
    var _boundMouseMove: ((e: MouseEvent) => void) | null = null;
    var _boundMouseUp: ((e: MouseEvent) => void) | null = null;

    // Minimum pixels before drag starts (prevents accidental drags on sort clicks)
    var DRAG_THRESHOLD = 5;

    // ═══════════════════════════════════════════════════════════
    // FEATURE 1: Sort by column
    // ═══════════════════════════════════════════════════════════

    function handleHeaderClick(e: MouseEvent) {
        // If we just finished a drag, don't trigger sort
        if (_isDragging) return;

        var target = e.target as Element;
        var col = target.closest('[data-sort]') as HTMLElement | null;
        if (!col) return;

        var sortKey = col.dataset.sort as string;

        if (_sortState.col === sortKey) {
            _sortState.dir = _sortState.dir === 'asc' ? 'desc' : 'asc';
        } else {
            _sortState.col = sortKey;
            _sortState.dir = 'asc';
        }

        _updateSortIndicators(col.closest('.pna-list-header') as HTMLElement | null);
        _sortItems(sortKey, _sortState.dir);
    }

    function _sortItems(sortKey: string, dir: string) {
        var ul = container.querySelector('ul.pna-list[data-sortable="items"]') as HTMLElement | null;
        if (!ul) return;

        var items = Array.from(ul.querySelectorAll('li.pna-list-item'));

        items.sort(function(a, b) {
            var aVal = _getItemValue(a as HTMLElement, sortKey);
            var bVal = _getItemValue(b as HTMLElement, sortKey);

            if (sortKey === 'level') {
                return dir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
            }

            var cmp = String(aVal).localeCompare(String(bVal), 'pt-BR');
            return dir === 'asc' ? cmp : -cmp;
        });

        items.forEach(function(item) { ul!.appendChild(item); });

        items.forEach(function(item, idx) {
            var orderNum = item.querySelector('.pna-order-num');
            if (orderNum) orderNum.textContent = String(idx + 1);
        });
    }

    function _getItemValue(row: HTMLElement, sortKey: string): string | number {
        switch (sortKey) {
            case 'label': return (row.querySelector('.pna-item-label') as HTMLElement | null)?.textContent || '';
            case 'status': return (row.querySelector('.pna-badge-status') as HTMLElement | null)?.textContent || '';
            case 'id': return (row.querySelector('.pna-item-id') as HTMLElement | null)?.textContent || '';
            case 'href': return (row.querySelector('.pna-item-href') as HTMLElement | null)?.textContent || '';
            case 'context': return (row.querySelector('.pna-badge-context') as HTMLElement | null)?.textContent || '';
            case 'group': return (row.querySelector('.pna-badge-group') as HTMLElement | null)?.textContent || '';
            case 'level': return parseInt((row.querySelector('.pna-badge-level') as HTMLElement | null)?.textContent || '0') || 0;
            default: return '';
        }
    }

    function _updateSortIndicators(header: HTMLElement | null) {
        if (!header) return;

        header.querySelectorAll('[data-sort]').forEach(function(col) {
            col.classList.remove('pna-col-sort-asc', 'pna-col-sort-desc');
            var icon = col.querySelector('.pna-sort-icon');
            if (icon) icon.textContent = '';
        });

        var activeCol = header.querySelector('[data-sort="' + _sortState.col + '"]');
        if (activeCol) {
            var cls = _sortState.dir === 'asc' ? 'pna-col-sort-asc' : 'pna-col-sort-desc';
            activeCol.classList.add(cls);
            var icon = activeCol.querySelector('.pna-sort-icon');
            if (icon) icon.textContent = _sortState.dir === 'asc' ? ' \u25B2' : ' \u25BC';
        }
    }

    // ═══════════════════════════════════════════════════════════
    // FEATURE 2: Column reorder via mouse drag
    // ═══════════════════════════════════════════════════════════

    function setupColumnDrag(header: HTMLElement) {
        // v10.4.0: debug log removed
        _currentHeader = header;

        header.querySelectorAll('[data-col]').forEach(function(col) {
            var colEl = col as HTMLElement;
            if (FIXED_COLS[colEl.dataset.col || '']) return;

            // Remove native draggable — we use mouse events now
            colEl.removeAttribute('draggable');
            colEl.classList.add('pna-col-draggable');

            // Only add mousedown if not already attached (prevent duplicates)
            if (colEl.dataset.colDragBound) return;
            colEl.dataset.colDragBound = '1';

            colEl.addEventListener('mousedown', function(e: MouseEvent) {
                // Only left button
                if (e.button !== 0) return;
                // Don't start drag if clicking on sort icon or interactive element
                if ((e.target as Element).closest('.pna-sort-icon')) return;

                _draggingCol = colEl.dataset.col || null;
                _dragStartX = e.clientX;
                _dragStartY = e.clientY;
                _isDragging = false;

                _boundMouseMove = _handleMouseMove.bind(null, colEl);
                _boundMouseUp = _handleMouseUp.bind(null, colEl);

                document.addEventListener('mousemove', _boundMouseMove);
                document.addEventListener('mouseup', _boundMouseUp);

                // Prevent text selection during drag
                e.preventDefault();
            });
        });
    }

    function _handleMouseMove(sourceEl: HTMLElement, e: MouseEvent) {
        if (!_draggingCol || !_currentHeader) return;

        var dx = e.clientX - _dragStartX;
        var dy = e.clientY - _dragStartY;
        var dist = Math.sqrt(dx * dx + dy * dy);

        // Don't start actual drag until threshold is met
        if (!_isDragging && dist < DRAG_THRESHOLD) return;

        if (!_isDragging) {
            _isDragging = true;
            sourceEl.classList.add('pna-col-dragging');
            _createGhost(sourceEl, e);
            // drag started
        }

        // Move ghost
        if (_dragGhost) {
            _dragGhost.style.left = (e.clientX + 12) + 'px';
            _dragGhost.style.top = (e.clientY - 14) + 'px';
        }

        // Find drop target under cursor
        _currentHeader.querySelectorAll('.pna-col-drop-target').forEach(function(c) {
            c.classList.remove('pna-col-drop-target');
        });

        var targetCol = _getColumnAtPoint(e.clientX, e.clientY);
        if (targetCol && targetCol.dataset.col !== _draggingCol
            && !FIXED_COLS[targetCol.dataset.col || '']) {
            targetCol.classList.add('pna-col-drop-target');
        }
    }

    function _handleMouseUp(sourceEl: HTMLElement, e: MouseEvent) {
        // Cleanup document listeners
        if (_boundMouseMove) document.removeEventListener('mousemove', _boundMouseMove);
        if (_boundMouseUp) document.removeEventListener('mouseup', _boundMouseUp);
        _boundMouseMove = null;
        _boundMouseUp = null;

        // Remove ghost
        _removeGhost();

        // Remove visual classes
        sourceEl.classList.remove('pna-col-dragging');
        if (_currentHeader) {
            _currentHeader.querySelectorAll('.pna-col-drop-target').forEach(function(c) {
                c.classList.remove('pna-col-drop-target');
            });
        }

        if (_isDragging && _draggingCol && _currentHeader) {
            var targetCol = _getColumnAtPoint(e.clientX, e.clientY);
            if (targetCol && targetCol.dataset.col && targetCol.dataset.col !== _draggingCol
                && !FIXED_COLS[targetCol.dataset.col]) {
                _reorderColumns(_draggingCol, targetCol.dataset.col);
            }
        }

        // Use setTimeout to prevent click event from firing sort after drag
        var wasDragging = _isDragging;
        setTimeout(function() {
            if (wasDragging) _isDragging = false;
        }, 0);

        _draggingCol = null;
        if (!wasDragging) _isDragging = false;
    }

    function _getColumnAtPoint(x: number, y: number): HTMLElement | null {
        if (!_currentHeader) return null;
        var cols = _currentHeader.querySelectorAll('[data-col]');
        for (var i = 0; i < cols.length; i++) {
            var rect = cols[i].getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top - 10 && y <= rect.bottom + 10) {
                return cols[i] as HTMLElement;
            }
        }
        return null;
    }

    function _createGhost(colEl: HTMLElement, e: MouseEvent) {
        _removeGhost();
        _dragGhost = document.createElement('div');
        _dragGhost.className = 'pna-col-drag-ghost';
        _dragGhost.textContent = colEl.textContent || colEl.dataset.col || '';
        _dragGhost.style.left = (e.clientX + 12) + 'px';
        _dragGhost.style.top = (e.clientY - 14) + 'px';
        document.body.appendChild(_dragGhost);
    }

    function _removeGhost() {
        if (_dragGhost && _dragGhost.parentNode) {
            _dragGhost.parentNode.removeChild(_dragGhost);
        }
        _dragGhost = null;
    }

    function _reorderColumns(fromCol: string, toCol: string) {
        var fromIdx = _colOrder.indexOf(fromCol);
        var toIdx = _colOrder.indexOf(toCol);
        if (fromIdx === -1 || toIdx === -1) return;

        _colOrder.splice(fromIdx, 1);
        _colOrder.splice(toIdx, 0, fromCol);

        _applyColumnOrder();
    }

    function _applyColumnOrder() {
        var template = _colOrder.map(function(col) { return COL_WIDTHS[col]; }).join(' ');

        var header = container.querySelector('.pna-list-header') as HTMLElement | null;
        var items = container.querySelectorAll('.pna-list-item');

        if (header) header.style.gridTemplateColumns = template;
        items.forEach(function(item) { (item as HTMLElement).style.gridTemplateColumns = template; });

        _reorderSpans(header, _colOrder);
        items.forEach(function(item) { _reorderSpans(item as HTMLElement, _colOrder); });
    }

    function _reorderSpans(el: HTMLElement | null, order: string[]) {
        if (!el) return;
        var spans: Record<string, HTMLElement> = {};
        el.querySelectorAll('[data-col]').forEach(function(span) {
            spans[(span as HTMLElement).dataset.col as string] = span as HTMLElement;
        });
        order.forEach(function(col) {
            if (spans[col]) el!.appendChild(spans[col]);
        });
    }

    // ═══════════════════════════════════════════════════════════
    // Init: set up drag on current header if present
    // ═══════════════════════════════════════════════════════════

    function init() {
        var header = container.querySelector('.pna-list-header[data-grid-header]') as HTMLElement | null;
        if (header) setupColumnDrag(header);
    }

    return {
        handleHeaderClick: handleHeaderClick,
        setupColumnDrag: setupColumnDrag,
        init: init
    };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { MODULE_ID: MODULE_ID, VERSION: VERSION, createColumnSortHandlers: createColumnSortHandlers, info: info, healthCheck: healthCheck };
