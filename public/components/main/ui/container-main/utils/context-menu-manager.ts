// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:context-menu-manager
// PURPOSE: Context Menu Manager - Menus de contexto customizáveis
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ITEM_TYPES — exported value
//   createContextMenuManager() — exported function
//   getContextMenuManager() — exported function
//   resetContextMenuManager() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'contextmenu'
//   'mouseenter'
//   'mouseleave'
//   'resize'
//   'scroll'
// WINDOW ACCESS:
//   window.addEventListener
//   window.innerHeight
//   window.innerWidth
//   window.removeEventListener
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE6';
export const MODULE_ID = 'container-main:context-menu-manager';

export const ITEM_TYPES = Object.freeze({ ITEM: 'item', SEPARATOR: 'separator', SUBMENU: 'submenu', HEADER: 'header' });

export function createContextMenuManager(options: Record<string, any> = {}) {
  const { zIndex = 10000, animation = true, theme = 'dark', closeOnClick = true, closeOnScroll = true, closeOnResize = true } = options;

  const _logger = createLogger(MODULE_ID);
  const _menus = new Map();
  const _activeMenus: Record<string, unknown>[] = [];
  let _counter = 0;
  let _metrics = { opened: 0, closed: 0, itemsClicked: 0 };

  const STYLES = `
    .cm-context-menu { position: fixed; min-width: 180px; background: #1a1a2e; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); padding: 6px 0; z-index: ${zIndex}; opacity: 0; transform: scale(0.95); transition: opacity 0.12s ease, transform 0.12s ease; }
    .cm-context-menu.visible { opacity: 1; transform: scale(1); }
    .cm-context-menu.theme-light { background: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
    .cm-context-menu-item { display: flex; align-items: center; padding: 8px 12px; cursor: pointer; color: #e0e0e0; font-size: 13px; transition: background 0.1s; }
    .cm-context-menu.theme-light .cm-context-menu-item { color: #333; }
    .cm-context-menu-item:hover { background: rgba(255,255,255,0.1); }
    .cm-context-menu.theme-light .cm-context-menu-item:hover { background: rgba(0,0,0,0.05); }
    .cm-context-menu-item.disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
    .cm-context-menu-item-icon { width: 20px; margin-right: 10px; text-align: center; font-size: 14px; }
    .cm-context-menu-item-label { flex: 1; }
    .cm-context-menu-item-shortcut { margin-left: 20px; opacity: 0.6; font-size: 11px; }
    .cm-context-menu-item-arrow { margin-left: 10px; opacity: 0.6; }
    .cm-context-menu-separator { height: 1px; background: rgba(255,255,255,0.1); margin: 6px 0; }
    .cm-context-menu.theme-light .cm-context-menu-separator { background: rgba(0,0,0,0.1); }
    .cm-context-menu-header { padding: 8px 12px; font-size: 11px; text-transform: uppercase; color: rgba(255,255,255,0.5); font-weight: 600; }
    .cm-context-menu.theme-light .cm-context-menu-header { color: rgba(0,0,0,0.5); }
    .cm-context-menu-submenu { position: absolute; left: 100%; top: -6px; }
  `;

  function _injectStyles() {
    if (document.getElementById('cm-context-menu-styles')) return;
    const style = document.createElement('style');
    style.id = 'cm-context-menu-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function _createMenuItem(item: Record<string, unknown>, menuId: unknown) {
    if (item.type === ITEM_TYPES.SEPARATOR) {
      const sep = document.createElement('div');
      sep.className = 'cm-context-menu-separator';
      return sep;
    }

    if (item.type === ITEM_TYPES.HEADER) {
      const header = document.createElement('div');
      header.className = 'cm-context-menu-header';
      header.textContent = (item.label) as string;
      return header;
    }

    const el = document.createElement('div');
    el.className = `cm-context-menu-item${item.disabled ? ' disabled' : ''}`;
    
    let html = '';
    if (item.icon) html += `<span class="cm-context-menu-item-icon">${item.icon}</span>`;
    html += `<span class="cm-context-menu-item-label">${item.label}</span>`;
    if (item.shortcut) html += `<span class="cm-context-menu-item-shortcut">${item.shortcut}</span>`;
    if (item.items) html += `<span class="cm-context-menu-item-arrow">▶</span>`;
    el.innerHTML = html;

    if (item.items) {
      let submenu: HTMLElement | null = null;
      el.addEventListener('mouseenter', () => {
        if (submenu) return;
        submenu = _createMenu((item.items as Record<string, unknown>), menuId);
        submenu.classList.add('cm-context-menu-submenu');
        el.appendChild(submenu);
        requestAnimationFrame(() => submenu!.classList.add('visible'));
      });
      el.addEventListener('mouseleave', (e) => {

        // @ts-expect-error TS migration - TS2345
        if (submenu && !el.contains(e.relatedTarget)) {
          submenu.remove();
          submenu = null;
        }
      });
    } else if (item.onClick && !item.disabled) {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        (item.onClick as (...args: unknown[]) => unknown)(item, e);
        _metrics.itemsClicked++;
        if (closeOnClick) manager.closeAll();
      });
    }

    return el;
  }

  function _createMenu(items: Record<string, unknown>, menuId: unknown) {
    const menu = document.createElement('div');
    menu.className = `cm-context-menu theme-${theme}`;
    (items.forEach as (...args: unknown[]) => unknown)((item: Record<string, unknown>) => menu.appendChild(_createMenuItem(item, menuId)));
    return menu;
  }

  function _positionMenu(menu: HTMLElement, x: number, y: number) {
    const rect = menu.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };

    if (x + rect.width > viewport.width) x = viewport.width - rect.width - 8;
    if (y + rect.height > viewport.height) y = viewport.height - rect.height - 8;
    if (x < 8) x = 8;
    if (y < 8) y = 8;

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }

  function _handleClickOutside(e: Event) {
    // @ts-expect-error TS migration - TS2345
    if (!_activeMenus.some(m => (m.element as HTMLElement).contains(e.target))) {
      manager.closeAll();
    }
  }

  function _handleScroll() { if (closeOnScroll) manager.closeAll(); }
  function _handleResize() { if (closeOnResize) manager.closeAll(); }

  const manager = {
    register(element: HTMLElement, items: unknown, options: Record<string, any> = {}) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return null;

      _injectStyles();
      const id = `ctx-${++_counter}`;

      const handler = (e: Event) => {
        e.preventDefault();
        // @ts-expect-error TS migration - TS2339
        this.show(id, e.clientX, e.clientY, options.dynamicItems ? options.dynamicItems(e) : items);
      };

      element.addEventListener('contextmenu', handler);
      _menus.set(id, { element, items, handler, options });
      return id;
    },

    unregister(id: string) {
      const menu = _menus.get(id);
      if (!menu) return;
      menu.element.removeEventListener('contextmenu', menu.handler);
      _menus.delete(id);
    },

    show(id: string, x: number, y: number, items: unknown) {
      this.closeAll();

      const config = _menus.get(id);
      const menuItems = items || config?.items || [];
      if (menuItems.length === 0) return;

      const menu = _createMenu(menuItems, id);
      document.body.appendChild(menu);

      _positionMenu(menu, x, y);
      requestAnimationFrame(() => menu.classList.add('visible'));

      _activeMenus.push({ id, element: menu });
      _metrics.opened++;

      document.addEventListener('click', _handleClickOutside);
      document.addEventListener('scroll', _handleScroll, true);
      window.addEventListener('resize', _handleResize);
    },

    close(id: string) {
      const index = _activeMenus.findIndex(m => m.id === id);
      if (index === -1) return;
      const menu = _activeMenus[index];
      (menu.element as HTMLElement).classList.remove('visible');
      setTimeout(() => (menu.element as HTMLElement).remove(), 120);
      _activeMenus.splice(index, 1);
      _metrics.closed++;
      if (_activeMenus.length === 0) {
        document.removeEventListener('click', _handleClickOutside);
        document.removeEventListener('scroll', _handleScroll, true);
        window.removeEventListener('resize', _handleResize);
      }
    },

    closeAll() {
      // @ts-expect-error strict migration — TS2345
      [..._activeMenus].forEach(m => this.close(m.id));
    },

    getMetrics() { return { ..._metrics, registered: _menus.size, active: _activeMenus.length }; },
    resetMetrics() { _metrics = { opened: 0, closed: 0, itemsClicked: 0 }; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, registered: _menus.size, metrics: _metrics }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, registered: _menus.size, itemTypes: Object.keys(ITEM_TYPES) }; },

    destroy() {
      this.closeAll();
      _menus.forEach((_, id) => this.unregister(id));
      const styles = document.getElementById('cm-context-menu-styles');
      if (styles) styles.remove();
    }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getContextMenuManager(options: Record<string, any> = {}) { if (!_instance) _instance = createContextMenuManager(options); return _instance; }
export function resetContextMenuManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export function info() { return { moduleId: MODULE_ID, version: VERSION, itemTypes: Object.keys(ITEM_TYPES) }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, ITEM_TYPES, createContextMenuManager, getContextMenuManager, resetContextMenuManager, info, healthCheck };
