// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (11.4.0-INLINE-EDIT)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-navrail-admin:handlers:inline-edit
// PURPOSE: Inline Edit Handlers for NavRail Admin cards
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   navrail-adapter — for updateItem API calls
//
// PROVIDES:
//   createInlineEditHandlers() — factory
//   VERSION, MODULE_ID
//
// @origin Adapted from panel-nav-admin/handlers/inline-edit.ts
// @changelog
//   11.4.0-INLINE-EDIT: Initial creation — Inline edit for label, icon, group, level, route
// ═══════════════════════════════════════════════════════════════
'use strict';

import * as adapter from '../core/navrail-adapter.js';
import { PanelStore as _PanelStore } from '../state/store.js';
const PanelStore = _PanelStore as any;

export const MODULE_ID = 'panel-navrail-admin:handlers:inline-edit';
export const VERSION = '11.4.0-INLINE-EDIT';

interface InlineEditDeps {
    container: HTMLElement;
    showToast: (msg: string, type: string) => void;
    loadData: () => Promise<unknown>;
}

export function createInlineEditHandlers(deps: InlineEditDeps) {
    const container = deps.container;
    const showToast = deps.showToast;
    const loadData = deps.loadData;
    let _editActive = false;

    function _getItemFromCard(card: HTMLElement): Record<string, unknown> | null {
        var itemId = card.dataset.itemId;
        if (!itemId) return null;
        var state = PanelStore.getState();
        var items = (state.items || []) as Record<string, unknown>[];
        return items.find(function(i: Record<string, unknown>) { return String(i.dbId) === String(itemId) || i.id === itemId; }) || null;
    }

    // ─── Label inline edit ───
    function handleLabelClick(e: MouseEvent) {
        var el = e.target as HTMLElement;
        var labelEl = el.closest('.pna-card__label') as HTMLElement | null;
        if (!labelEl) return;
        if (_editActive) return;

        var card = labelEl.closest('.pna-card[data-item-id]') as HTMLElement | null;
        if (!card) return;
        var item = _getItemFromCard(card);
        if (!item) return;

        _editActive = true;
        var originalValue = (labelEl.textContent || '').trim();
        var originalHtml = labelEl.innerHTML;

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'pnra-inline-input';
        input.value = originalValue;
        labelEl.textContent = '';
        labelEl.appendChild(input);
        labelEl.classList.add('pnra-editing');
        input.focus();
        input.select();

        var _saved = false;
        function finish(save: boolean) {
            if (_saved) return;
            var newValue = input.value.trim();
            if (save && newValue && newValue.length < 2) {
                input.classList.add('pnra-input-invalid');
                input.focus();
                return;
            }
            _saved = true;
            _editActive = false;
            labelEl!.classList.remove('pnra-editing');

            if (!save || newValue === originalValue) {
                labelEl!.innerHTML = originalHtml;
                return;
            }
            labelEl!.textContent = newValue;
            (adapter as any).updateItem(item!.dbId, { label: newValue }).then(function(result: Record<string, unknown>) {
                if (result && result.success) {
                    showToast('Label atualizado', 'success');
                    loadData();
                } else {
                    labelEl!.innerHTML = originalHtml;
                    showToast('Erro ao atualizar label', 'error');
                }
            }).catch(function(err: Error) {
                labelEl!.innerHTML = originalHtml;
                showToast('Erro: ' + err.message, 'error');
            });
        }

        input.addEventListener('keydown', function(ev: KeyboardEvent) {
            if (ev.key === 'Enter') { ev.preventDefault(); finish(true); }
            else if (ev.key === 'Escape') { ev.preventDefault(); finish(false); }
        });
        input.addEventListener('blur', function() { finish(true); });
    }

    // ─── Icon inline edit (popover) ───
    function handleIconClick(e: MouseEvent) {
        var el = e.target as HTMLElement;
        var iconEl = el.closest('.pna-card__icon') as HTMLElement | null;
        if (!iconEl) return;

        var card = iconEl.closest('.pna-card[data-item-id]') as HTMLElement | null;
        if (!card) return;
        var item = _getItemFromCard(card);
        if (!item) return;

        // Check if icon-picker module is available (reuse from panel-nav-admin)
        var existingPopover = container.querySelector('.pnra-icon-popover');
        if (existingPopover) existingPopover.remove();

        var popover = document.createElement('div');
        popover.className = 'pnra-icon-popover';
        var currentIcon = (item.icon as string) || '';

        popover.innerHTML = '<div class="pnra-popover-content">'
            + '<label>Icone:</label>'
            + '<input type="text" class="pnra-inline-input" value="' + _escapeHtml(currentIcon) + '" placeholder="ex: home, grid, users">'
            + '<div class="pnra-popover-actions">'
            + '<button type="button" class="pna-btn pna-btn--sm" data-popover-action="cancel">Cancelar</button>'
            + '<button type="button" class="pna-btn pna-btn--primary pna-btn--sm" data-popover-action="save">Salvar</button>'
            + '</div></div>';

        iconEl.style.position = 'relative';
        iconEl.appendChild(popover);
        var input = popover.querySelector('input') as HTMLInputElement;
        input.focus();
        input.select();

        function closePopover() { if (popover.parentElement) popover.remove(); }

        popover.addEventListener('click', function(ev: Event) {
            var btn = (ev.target as HTMLElement).closest('[data-popover-action]') as HTMLElement | null;
            if (!btn) return;
            if (btn.dataset.popoverAction === 'cancel') { closePopover(); return; }
            if (btn.dataset.popoverAction === 'save') {
                var newIcon = input.value.trim();
                if (newIcon === currentIcon) { closePopover(); return; }
                (adapter as any).updateItem(item!.dbId, { icon: newIcon }).then(function(result: Record<string, unknown>) {
                    closePopover();
                    if (result && result.success) { showToast('Icone atualizado', 'success'); loadData(); }
                    else { showToast('Erro ao atualizar icone', 'error'); }
                }).catch(function(err: Error) { closePopover(); showToast('Erro: ' + err.message, 'error'); });
            }
        });

        input.addEventListener('keydown', function(ev: KeyboardEvent) {
            if (ev.key === 'Enter') { ev.preventDefault(); popover.querySelector<HTMLButtonElement>('[data-popover-action="save"]')!.click(); }
            else if (ev.key === 'Escape') { ev.preventDefault(); closePopover(); }
        });
    }

    // ─── Group inline edit (dropdown) ───
    function handleGroupClick(e: MouseEvent) {
        var el = e.target as HTMLElement;
        // Find group badge or area
        var groupEl = el.closest('.pna-card__group') as HTMLElement | null;
        if (!groupEl) return;

        var card = groupEl.closest('.pna-card[data-item-id]') as HTMLElement | null;
        if (!card) return;
        var item = _getItemFromCard(card);
        if (!item) return;

        var state = PanelStore.getState();
        var groups = (state.groups || []) as Record<string, unknown>[];

        var existingDropdown = groupEl.querySelector('.pnra-inline-select');
        if (existingDropdown) return;

        var originalHtml = groupEl.innerHTML;
        var select = document.createElement('select');
        select.className = 'pnra-inline-select';
        select.innerHTML = '<option value="">Sem grupo</option>';
        groups.forEach(function(g: Record<string, unknown>) {
            var raw = g._raw as Record<string, unknown> | undefined;
            var gId = raw?.id || g.id;
            var selected = (String(item!.groupId) === String(gId)) ? ' selected' : '';
            select.innerHTML += '<option value="' + _escapeHtml(gId) + '"' + selected + '>' + _escapeHtml(g.label) + '</option>';
        });

        groupEl.textContent = '';
        groupEl.appendChild(select);
        select.focus();

        function finishGroup() {
            var newGroupId = select.value || null;
            groupEl!.innerHTML = originalHtml;
            if (String(newGroupId) === String(item!.groupId)) return;
            (adapter as any).updateItem(item!.dbId, { groupId: newGroupId }).then(function(result: Record<string, unknown>) {
                if (result && result.success) { showToast('Grupo atualizado', 'success'); loadData(); }
                else { showToast('Erro ao atualizar grupo', 'error'); }
            }).catch(function(err: Error) { showToast('Erro: ' + err.message, 'error'); });
        }

        select.addEventListener('change', function() { finishGroup(); });
        select.addEventListener('blur', function() { finishGroup(); });
        select.addEventListener('keydown', function(ev: KeyboardEvent) {
            if (ev.key === 'Escape') { groupEl!.innerHTML = originalHtml; }
        });
    }

    // ─── Level inline edit (select/UARPS) ───
    function handleLevelClick(e: MouseEvent) {
        var el = e.target as HTMLElement;
        var levelEl = el.closest('.pna-card__level') as HTMLElement | null;
        if (!levelEl) return;

        var card = levelEl.closest('.pna-card[data-item-id]') as HTMLElement | null;
        if (!card) return;
        var item = _getItemFromCard(card);
        if (!item) return;

        var existingSelect = levelEl.querySelector('.pnra-inline-select');
        if (existingSelect) return;

        var originalHtml = levelEl.innerHTML;
        var currentLevel = item.minLevel || 0;
        var levels = [
            { value: 0, label: '0 — Público' },
            { value: 10, label: '10 — Usuário' },
            { value: 20, label: '20 — Editor' },
            { value: 50, label: '50 — Gerente' },
            { value: 80, label: '80 — Admin' },
            { value: 100, label: '100 — Super Admin' }
        ];

        var select = document.createElement('select');
        select.className = 'pnra-inline-select';
        levels.forEach(function(lv) {
            var selected = (Number(currentLevel) === lv.value) ? ' selected' : '';
            select.innerHTML += '<option value="' + lv.value + '"' + selected + '>' + lv.label + '</option>';
        });

        levelEl.textContent = '';
        levelEl.appendChild(select);
        select.focus();

        function finishLevel() {
            var newLevel = parseInt(select.value, 10);
            levelEl!.innerHTML = originalHtml;
            if (newLevel === Number(currentLevel)) return;
            (adapter as any).updateItem(item!.dbId, { minLevel: newLevel }).then(function(result: Record<string, unknown>) {
                if (result && result.success) { showToast('Nível atualizado', 'success'); loadData(); }
                else { showToast('Erro ao atualizar nível', 'error'); }
            }).catch(function(err: Error) { showToast('Erro: ' + err.message, 'error'); });
        }

        select.addEventListener('change', function() { finishLevel(); });
        select.addEventListener('blur', function() { finishLevel(); });
        select.addEventListener('keydown', function(ev: KeyboardEvent) {
            if (ev.key === 'Escape') { levelEl!.innerHTML = originalHtml; }
        });
    }

    // ─── Route/Panel ID inline edit (input) ───
    function handleRouteClick(e: MouseEvent) {
        var el = e.target as HTMLElement;
        var routeEl = el.closest('.pna-card__route') as HTMLElement | null;
        if (!routeEl) return;
        if (_editActive) return;

        var card = routeEl.closest('.pna-card[data-item-id]') as HTMLElement | null;
        if (!card) return;
        var item = _getItemFromCard(card);
        if (!item) return;

        _editActive = true;
        var originalValue = (item.actionPanelId as string) || '';
        var originalHtml = routeEl.innerHTML;

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'pnra-inline-input';
        input.value = originalValue;
        input.placeholder = 'ex: panel-dashboard';
        routeEl.textContent = '';
        routeEl.appendChild(input);
        routeEl.classList.add('pnra-editing');
        input.focus();
        input.select();

        var _saved = false;
        function finish(save: boolean) {
            if (_saved) return;
            _saved = true;
            _editActive = false;
            routeEl!.classList.remove('pnra-editing');
            var newValue = input.value.trim();
            if (!save || newValue === originalValue) { routeEl!.innerHTML = originalHtml; return; }
            routeEl!.textContent = newValue || '-';
            (adapter as any).updateItem(item!.dbId, { actionPanelId: newValue }).then(function(result: Record<string, unknown>) {
                if (result && result.success) { showToast('Rota atualizada', 'success'); loadData(); }
                else { routeEl!.innerHTML = originalHtml; showToast('Erro ao atualizar rota', 'error'); }
            }).catch(function(err: Error) { routeEl!.innerHTML = originalHtml; showToast('Erro: ' + err.message, 'error'); });
        }

        input.addEventListener('keydown', function(ev: KeyboardEvent) {
            if (ev.key === 'Enter') { ev.preventDefault(); finish(true); }
            else if (ev.key === 'Escape') { ev.preventDefault(); finish(false); }
        });
        input.addEventListener('blur', function() { finish(true); });
    }

    return { handleLabelClick, handleIconClick, handleGroupClick, handleLevelClick, handleRouteClick };
}

function _escapeHtml(str: unknown): string {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
