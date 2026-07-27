// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: dom-builder
// PURPOSE: Panel Tabs Manager - DOM Builder
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TAB_POSITIONS from ../constants.js
//   getConfig, setTabsContainer, setContentContainer from ../state.js
//   getStyles from ./styles.js
//   _handleTabClick from ../events/handlers.js
//   _setupDragAndDrop from ../events/drag-drop.js
//   addTab from ../api.js
//
// PROVIDES:
//   _createTabsUI() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TAB_POSITIONS } from '../constants.js';
import { getConfig, setTabsContainer, setContentContainer } from '../state.js';
import { getStyles } from './styles.js';
import { _handleTabClick } from '../events/handlers.js';
import { _setupDragAndDrop } from '../events/drag-drop.js';
import { addTab } from '../api.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-tabs-manager.ui.dom-builder';

export function _createTabsUI(container: HTMLElement) {
  const config = getConfig();
  
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'dsd-panel-tabs';
  tabsContainer.innerHTML = `
    <style>${getStyles()}</style>
    
    <div class="dsd-pt-tabs-list"></div>
    
    <div class="dsd-pt-actions">
      <button class="dsd-pt-btn dsd-pt-new" title="Nova aba">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
      </button>
    </div>
  `;
  
  if ((config.position as string) === TAB_POSITIONS.BOTTOM) {
    tabsContainer.classList.add('dsd-panel-tabs--bottom');
    container.appendChild(tabsContainer);
  } else {
    container.insertBefore(tabsContainer, container.firstChild);
  }
  
  setTabsContainer(tabsContainer);
  
  // Create content container
  const contentContainer = document.createElement('div');
  contentContainer.className = 'dsd-pt-content';
  container.appendChild(contentContainer);
  setContentContainer(contentContainer);
  
  // Bind events
  const newBtn = tabsContainer.querySelector('.dsd-pt-new');
  newBtn!.addEventListener('click', () => addTab());
  
  // @ts-expect-error strict migration — TS2531
  tabsContainer.querySelector('.dsd-pt-tabs-list').addEventListener('click', _handleTabClick);
  
  if (config.allowReorder) {
    _setupDragAndDrop();
  }
}
