// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-DI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-tab-manager-renderer
// PURPOSE: Tab Manager - Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createTabBarHTML, createTabElementHTML, createTabPanelHTML from ./templates.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createRenderer() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'blur'
//   'click'
//   'dblclick'
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createTabBarHTML, createTabElementHTML, createTabPanelHTML } from './templates.js';

export const VERSION = '8.1.0-DI-STRICT';
export const MODULE_ID = 'container-tab-manager-renderer';

export function createRenderer(state: Record<string, unknown>, options: Record<string, any> = {}) {
  const { closableTabs = true, draggableTabs = true } = options;

  function createTabBar(container: HTMLElement) {
    const header = container.querySelector('.dsd-container__header');
    if (!header) return null;
    let existing = container.querySelector('.dsd-tab-bar');
    if (existing) return existing;
    const tabBar = document.createElement('div');
    tabBar.className = 'dsd-tab-bar';
    tabBar.setAttribute('role', 'tablist');
    tabBar.innerHTML = createTabBarHTML();
    header.insertAdjacentElement('afterend', tabBar);
    return tabBar;
  }

  function createTabElement(tab: Record<string, unknown>, eventHandlers: Record<string, any> = {}) {
    const { onClick, onDoubleClick, onClose, onDrag, onKeydown } = eventHandlers;
    const tabEl = document.createElement('div');
    tabEl.className = 'dsd-tab';
    tabEl.setAttribute('role', 'tab');
    tabEl.setAttribute('aria-selected', 'false');
    tabEl.setAttribute('data-tab-id', String(tab.id));
    tabEl.tabIndex = -1;
    if (draggableTabs) tabEl.setAttribute('draggable', 'true');
    tabEl.innerHTML = createTabElementHTML(tab, { closableTabs, draggableTabs });
    tabEl.addEventListener('click', (e) => { if (!(e.target as HTMLElement).closest('.dsd-tab__close')) onClick?.(String(tab.id)); });
    tabEl.addEventListener('dblclick', (e) => { if (!(e.target as HTMLElement).closest('.dsd-tab__close')) onDoubleClick?.(String(tab.id)); });
    const closeBtn = tabEl.querySelector('.dsd-tab__close');
    closeBtn?.addEventListener('click', (e) => { e.stopPropagation(); onClose?.(String(tab.id)); });
    if (onDrag) onDrag(tabEl, String(tab.id));
    if (onKeydown) onKeydown(tabEl, String(tab.id));
    return tabEl;
  }

  function createTabPanel(tab: Record<string, unknown>) {
    const panel = document.createElement('div');
    panel.className = 'dsd-tab-panel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('data-tab-id', String(tab.id));
    panel.setAttribute('aria-hidden', 'true');
    panel.tabIndex = 0;
    const content = createTabPanelHTML(tab) as string | null;
    if (content) panel.innerHTML = content as string;
    else if (tab.content instanceof HTMLElement) panel.appendChild(tab.content as Node);
    return panel;
  }

  function render(eventHandlers: Record<string, any> = {}) {
    if (!state.tabBarEl) return;
    const tabsSlot = (state.tabBarEl as HTMLElement).querySelector('[data-slot="tabs"]');
    if (!tabsSlot) return;
    tabsSlot.innerHTML = '';
    (state.tabs as Record<string, unknown>[]).forEach((tab: Record<string, unknown>) => {
      const tabEl = createTabElement(tab, eventHandlers);
      tabsSlot.appendChild(tabEl);
      if (tab.id === (state as Record<string, unknown>).activeTabId) {
        tabEl.classList.add('dsd-tab--active');
        tabEl.setAttribute('aria-selected', 'true');
        tabEl.tabIndex = 0;
      }
    });
    updatePanels();
  }

  function updatePanels() {
    if (!state.tabContentEl) return;
    const panels = (state.tabContentEl as HTMLElement).querySelectorAll('.dsd-tab-panel');
    panels.forEach((panel) => {
      const tabId = (panel as HTMLElement).dataset.tabId;
      const isActive = tabId === (state as Record<string, unknown>).activeTabId;
      (panel as HTMLElement).classList.toggle('dsd-tab-panel--active', isActive);
      (panel as HTMLElement).setAttribute('aria-hidden', String(!isActive));
    });
  }

  function startRename(tabId: string, onFinish: (id: string, title: string) => void) {
    const tabEl = (state.tabBarEl as HTMLElement | null)?.querySelector(`[data-tab-id="${tabId}"]`);
    const titleEl = tabEl?.querySelector('.dsd-tab__title');
    if (!titleEl) return;
    const tab = (state as Record<string, (...args: unknown[]) => Record<string, unknown>>).findTab(tabId);
    if (!tab) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'dsd-tab__input';
    input.value = String(tab.title || '');
    const finishRename = () => {
      const newTitle = input.value.trim() || String(tab.title);
      (tab as Record<string, unknown>).title = newTitle;
      titleEl.textContent = newTitle;
      (titleEl as HTMLElement).style.display = '';
      input.remove();
      onFinish?.(tabId, newTitle);
    };
    input.addEventListener('blur', finishRename);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finishRename();
      if (e.key === 'Escape') { input.value = String(tab.title || ''); finishRename(); }
    });
    (titleEl as HTMLElement).style.display = 'none';
    (titleEl as HTMLElement).insertAdjacentElement('afterend', input);
    input.focus();
    input.select();
  }

  function removePanel(tabId: string) {
    const panel = (state.tabContentEl as HTMLElement | null)?.querySelector(`[data-tab-id="${tabId}"]`);
    panel?.remove();
  }

  function focusTab(tabId: string) {
    const tabEl = (state.tabBarEl as HTMLElement | null)?.querySelector(`[data-tab-id="${tabId}"]`);
    (tabEl as HTMLElement)?.focus();
  }

  return { createTabBar, createTabElement, createTabPanel, render, updatePanels, startRename, removePanel, focusTab };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { rendererReady: true } };
}

export default { createRenderer, info, healthCheck, VERSION, MODULE_ID };
