// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-context-menu
// PURPOSE: UARPS Admin - Context Menu (Right Click)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Icons from ./icons.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   show() — exported function
//   hide() — exported function
//   destroy() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   ContextMenu — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'contextmenu'
//   'scroll'
// WINDOW ACCESS:
//   window.innerHeight
//   window.innerWidth
// ═══════════════════════════════════════════════════════════════
'use strict';

import { Icons } from './icons.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-context-menu';

let _menu: HTMLElement | null = null;
let _currentTarget: unknown = null;
let _onAction: (action: string, target: unknown) => void = () => {};
let _abortController: AbortController | null = null;

const MENUS = {
  user: [ { id: 'select', label: 'Selecionar usuário', icon: 'user' }, { id: 'clone', label: 'Clonar permissões', icon: 'copy', shortcut: 'Ctrl+D' }, { id: 'compare', label: 'Comparar com...', icon: 'gitCompare' }, { divider: true }, { id: 'favorite', label: 'Adicionar aos favoritos', icon: 'star' }, { id: 'notes', label: 'Adicionar nota', icon: 'edit' }, { divider: true }, { id: 'grant-all', label: 'Liberar todos', icon: 'checkCircle' }, { id: 'revoke-all', label: 'Revogar todos', icon: 'xCircle', danger: true } ],
  trigger: [ { id: 'toggle', label: 'Alternar permissão', icon: 'toggleLeft', shortcut: 'Enter' }, { id: 'preview', label: 'Ver detalhes', icon: 'eye' }, { divider: true }, { id: 'bulk-add', label: 'Adicionar à seleção', icon: 'plus' }, { id: 'alias', label: 'Definir apelido', icon: 'tag' }, { divider: true }, { id: 'grant-area', label: 'Liberar toda a área', icon: 'checkCircle' }, { id: 'revoke-area', label: 'Revogar toda a área', icon: 'xCircle', danger: true } ],
  matrix: [ { id: 'expand-all', label: 'Expandir todos', icon: 'chevronDown' }, { id: 'collapse-all', label: 'Recolher todos', icon: 'chevronUp' }, { divider: true }, { id: 'select-all', label: 'Selecionar todos', icon: 'checkbox', shortcut: 'Ctrl+A' }, { id: 'clear-selection', label: 'Limpar seleção', icon: 'x' } ]
};

const _createMenu = () => { if (_menu) return _menu; _menu = document.createElement('div'); _menu.className = 'uarps-context-menu'; document.body.appendChild(_menu); if (_abortController) { _abortController.abort(); } _abortController = new AbortController(); document.addEventListener('click', () => { hide(); }, { signal: _abortController.signal }); document.addEventListener('contextmenu', e => { if (!_menu!.contains(e.target as Node)) hide(); }, { signal: _abortController.signal }); document.addEventListener('scroll', () => { hide(); }, { capture: true, signal: _abortController.signal }); return _menu; };

const _render = (items: Array<Record<string, unknown>>) => {
  _createMenu();
  let html = '';
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.divider) { html += '<div class="uarps-context-menu__divider"></div>'; continue; }
    html += `<div class="uarps-context-menu__item ${item.danger ? 'uarps-context-menu__item--danger' : ''}" data-action="${item.id}">${(Icons as unknown as Record<string, string>)[item.icon as string] || ''}<span>${item.label}</span>${item.shortcut ? `<span class="uarps-context-menu__shortcut">${item.shortcut}</span>` : ''}</div>`;
  }
  _menu!.innerHTML = html;
  const actionEls = _menu!.querySelectorAll('[data-action]');
  actionEls.forEach(el => { el.addEventListener('click', () => { const action = (el as HTMLElement).dataset.action || ''; _onAction(action, _currentTarget); hide(); }); });
};

export const show = (e: MouseEvent, type: string, target: unknown, onAction: (action: string, target: unknown) => void) => { e.preventDefault(); const items = (MENUS as Record<string, Array<Record<string, unknown>>>)[type]; if (!items) return; _currentTarget = target; _onAction = onAction || (() => {}); _render(items); const x = Math.min(e.clientX, window.innerWidth - 200); const y = Math.min(e.clientY, window.innerHeight - 300); _menu!.style.left = `${x}px`; _menu!.style.top = `${y}px`; _menu!.classList.add('uarps-context-menu--open'); };
export const hide = () => { if (_menu) _menu.classList.remove('uarps-context-menu--open'); _currentTarget = null; };
export const destroy = () => { if (_abortController) { _abortController.abort(); _abortController = null; } if (_menu) _menu.remove(); _menu = null; };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { menuTypes: Object.keys(MENUS).length } });

export const ContextMenu = { show, hide, destroy, VERSION, MODULE_ID, info, healthCheck };
export default ContextMenu;
