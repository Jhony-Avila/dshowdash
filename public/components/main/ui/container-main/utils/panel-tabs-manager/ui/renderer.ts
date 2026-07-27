// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: renderer
// PURPOSE: Panel Tabs Manager - Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TAB_STATES from ../constants.js
//   getConfig, getTabs, getActiveTabId, getTabsContainer, getContentContainer fro...
//
// PROVIDES:
//   _renderTabs() — exported function
//   _renderContent() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TAB_STATES } from '../constants.js';
import { getConfig, getTabs, getActiveTabId, getTabsContainer, getContentContainer } from '../state.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-tabs-manager.ui.renderer';

export function _renderTabs() {
  const tabsContainer = getTabsContainer();
  if (!tabsContainer) return;
  
  const tabsList = tabsContainer.querySelector('.dsd-pt-tabs-list');
  if (!tabsList) return;
  
  const config = getConfig();
  const tabs = getTabs();
  const activeTabId = getActiveTabId();
  
  tabsList.innerHTML = tabs.map(tab => {
    const isActive = tab.id === activeTabId;
    const stateClass = tab.state !== TAB_STATES.ACTIVE && tab.state !== TAB_STATES.INACTIVE 
      ? `dsd-pt-tab--${tab.state}` : '';
    
    const icon = config.showTabIcons ? `<span class="dsd-pt-tab-icon">${tab.icon || '📄'}</span>` : '';
    const closeBtn = config.showCloseButton ? `
      <button class="dsd-pt-tab-close" title="Fechar">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    ` : '';
    
    return `
      <div class="dsd-pt-tab ${isActive ? 'dsd-pt-tab--active' : ''} ${stateClass}" 
           data-tab-id="${tab.id}"
           draggable="${config.allowReorder}">
        ${icon}
        <span class="dsd-pt-tab-title" title="${tab.title}">${tab.title}</span>
        ${closeBtn}
      </div>
    `;
  }).join('');
}

export function _renderContent() {
  const contentContainer = getContentContainer();
  if (!contentContainer) return;
  
  const tabs = getTabs();
  const activeTabId = getActiveTabId();
  
  tabs.forEach(tab => {
    let panelEl = contentContainer.querySelector(`[data-panel-id="${tab.id}"]`);
    
    if (!panelEl) {
      panelEl = document.createElement('div');
      panelEl.className = 'dsd-pt-panel';
      // @ts-expect-error TS migration - TS2339
      panelEl.dataset.panelId = tab.id;
      
      if (tab.content) {
        if (typeof tab.content === 'string') {
          panelEl.innerHTML = tab.content;
        } else if (tab.content instanceof HTMLElement) {
          panelEl.appendChild(tab.content);
        }
      }
      
      contentContainer.appendChild(panelEl);
    }
    
    panelEl.classList.toggle('dsd-pt-panel--active', tab.id === activeTabId);
  });
  
  // Remove panels for closed tabs
  contentContainer.querySelectorAll('.dsd-pt-panel').forEach((panelEl: unknown) => {
    const tabId = (panelEl as HTMLElement).dataset.panelId;
    if (!tabs.find(t => t.id === tabId)) {
      (panelEl as HTMLElement).remove();
    }
  });
}
