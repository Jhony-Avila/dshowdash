// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.0.0-CROSS-GROUP-DND)
// ═══════════════════════════════════════════════════════════════
// MODULE: drag-drop
// PURPOSE: Panel NavRail Admin - Drag & Drop with Cross-Group Support
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   NavRailAdapter from ../core/navrail-adapter.js
//
// PROVIDES:
//   init() — exported function
//   refresh() — exported function
//   destroy() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   CustomEvent 'navigation:items:changed'
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
//
// @changelog
//   9.0.0-CROSS-GROUP-DND: Cross-group drag-drop support.
//     When item is dropped on a card from another group, PATCH parent_key
//     then reorder within the new group. Console.log for debug confirmation.
//   8.2.0-P17WI-AAA: Same-group only drag-drop.
// ═══════════════════════════════════════════════════════════════
'use strict';

import { NavRailAdapter } from '../core/navrail-adapter.js';

const MODULE_ID = 'panel-navrail-admin-handlers-drag-drop';
const VERSION = '9.0.0-CROSS-GROUP-DND';

type DragDropCallbacks = { showToast?: (msg: string, type: string) => void; loadData?: () => void; triggerSync?: () => void; };

let _container: HTMLElement | null = null;
let _callbacks: DragDropCallbacks | null = null;
let _draggedItem: HTMLElement | null = null;

export function init(container: HTMLElement, callbacks: DragDropCallbacks) {
    _container = container;
    _callbacks = callbacks;
    setupDragListeners();
}

export function refresh(container: HTMLElement, callbacks: DragDropCallbacks) {
    _container = container;
    _callbacks = callbacks;
    setupDragListeners();
}

export function destroy() {
    _container = null;
    _callbacks = null;
    _draggedItem = null;
}

function setupDragListeners() {
    if (!_container) return;

    const cards = _container.querySelectorAll('[data-draggable="true"]');

    cards.forEach(el => {
        const card = el as HTMLElement;
        card.setAttribute('draggable', 'true');

        card.ondragstart = (e: DragEvent) => {
            _draggedItem = card;
            card.classList.add('pna-card--dragging');
            e.dataTransfer!.effectAllowed = 'move';
            e.dataTransfer!.setData('text/plain', card.dataset.itemId!);
        };

        card.ondragend = () => {
            card.classList.remove('pna-card--dragging');
            _container!.querySelectorAll('.pna-card--drag-over').forEach(el => {
                el.classList.remove('pna-card--drag-over');
            });
            _draggedItem = null;
        };

        card.ondragover = (e: DragEvent) => {
            e.preventDefault();
            e.dataTransfer!.dropEffect = 'move';
        };

        card.ondragenter = (e: DragEvent) => {
            e.preventDefault();
            // v9.0.0: Allow drag-over on ANY card (cross-group support)
            if (card !== _draggedItem) {
                card.classList.add('pna-card--drag-over');
            }
        };

        card.ondragleave = () => {
            card.classList.remove('pna-card--drag-over');
        };

        card.ondrop = async (e: DragEvent) => {
            e.preventDefault();
            card.classList.remove('pna-card--drag-over');

            if (!_draggedItem || card === _draggedItem) return;

            var sourceGroup = _draggedItem.dataset.group || '';
            var targetGroup = card.dataset.group || '';
            var isCrossGroup = sourceGroup !== targetGroup && targetGroup !== '';

            // [DEBUG] console.log temporário (removed 2026-04-30)
            // console.log('[DragDrop NavRail] drop detected:', {
            //     itemId: _draggedItem.dataset.itemId,
            //     sourceGroup: sourceGroup,
            //     targetGroup: targetGroup,
            //     isCrossGroup: isCrossGroup
            // });

            if (isCrossGroup) {
                // v9.0.0: Cross-group — PATCH parent_key first, then reorder
                await handleCrossGroupDrop(_draggedItem, card, targetGroup);
            } else {
                // Same-group reorder
                var groupContainer = card.closest('[data-group]');
                if (!groupContainer) return;

                var allCards = Array.from(groupContainer.querySelectorAll('[data-draggable="true"]'));
                var fromIndex = allCards.indexOf(_draggedItem);
                var toIndex = allCards.indexOf(card);

                if (fromIndex < toIndex) {
                    card.after(_draggedItem);
                } else {
                    card.before(_draggedItem);
                }

                await saveNewOrder(targetGroup);
            }
        };
    });
}

async function handleCrossGroupDrop(draggedCard: HTMLElement, targetCard: HTMLElement, newGroupKey: string) {
    var itemId = draggedCard.dataset.itemId || '';
    var dbId = draggedCard.dataset.dbId || itemId;
    var sourceTable = draggedCard.dataset.sourceTable || 'navrail_items';
    var sourceId = draggedCard.dataset.sourceId || dbId;

    // console.log('[DragDrop NavRail] cross-group PATCH:', { // removed 2026-04-30 (debug temporário)
    //     itemId: itemId,
    //     dbId: dbId,
    //     sourceTable: sourceTable,
    //     sourceId: sourceId,
    //     newParentKey: newGroupKey
    // });

    try {
        await NavRailAdapter.updateItem(dbId, {
            sourceTable: sourceTable,
            sourceId: sourceId,
            parentKey: newGroupKey
        });

        _callbacks?.showToast?.('Item movido para outro grupo!', 'success');
        window.dispatchEvent(new CustomEvent('navigation:items:changed', {
            detail: { source: 'panel-navrail-admin', action: 'cross-group-move', itemId: itemId, newGroup: newGroupKey }
        }));
        _callbacks?.loadData?.();
        _callbacks?.triggerSync?.();
    } catch (error: any) {
        _callbacks?.showToast?.('Erro ao mover item: ' + error.message, 'error');
        console.error('[DragDrop NavRail] cross-group error:', error);
    }
}

async function saveNewOrder(group: string | undefined) {
    var groupContainer = _container!.querySelector('[data-group="' + group + '"]');
    if (!groupContainer) {
        // Fallback: try all cards if no group container found
        groupContainer = _container;
    }
    if (!groupContainer) return;

    var cards = groupContainer.querySelectorAll('[data-draggable="true"]');
    var itemIds = Array.from(cards).map(card => (card as any).dataset.dbId);

    try {
        await NavRailAdapter.reorderItems(itemIds);
        _callbacks?.showToast?.('Ordem atualizada!', 'success');
        window.dispatchEvent(new CustomEvent('navigation:items:changed', {
            detail: { source: 'panel-navrail-admin', action: 'reorder' }
        }));
        _callbacks?.loadData?.();
        _callbacks?.triggerSync?.();
    } catch (error: any) {
        _callbacks?.showToast?.('Erro ao reordenar: ' + error.message, 'error');
    }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { dragDropReady: true } }; }
