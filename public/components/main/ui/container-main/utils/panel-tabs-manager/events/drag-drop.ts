// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: drag-drop
// PURPOSE: Panel Tabs Manager - Drag & Drop
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getTabs, setTabs, getTabsContainer, getDragState, setDragState from ../state.js
//   _renderTabs from ../ui/renderer.js
//   _saveTabs, _emit from ../helpers/index.js
//
// PROVIDES:
//   _setupDragAndDrop() — exported function
//   _reorderTabs() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'dragend'
//   'dragover'
//   'dragstart'
//   'drop'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getTabs, setTabs, getTabsContainer, getDragState, setDragState } from '../state.js';
import { _renderTabs } from '../ui/renderer.js';
import { _saveTabs, _emit } from '../helpers/index.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-tabs-manager.events.drag-drop';

export function _setupDragAndDrop() {
  const tabsContainer = getTabsContainer();
  if (!tabsContainer) return;
  
  const tabsList = tabsContainer.querySelector('.dsd-pt-tabs-list') as HTMLElement | null;
  if (!tabsList) return;
  
  tabsList.addEventListener('dragstart', (e: DragEvent) => {
    const tabEl = (e.target as HTMLElement).closest('.dsd-pt-tab');
    if (!tabEl) return;
    
    // @ts-expect-error TS migration - TS2339
    setDragState({ tabId: tabEl.dataset.tabId });
    tabEl.classList.add('dsd-pt-tab--dragging');
    // @ts-expect-error strict migration — TS18047
    e.dataTransfer.effectAllowed = 'move';
  });
  
  tabsList.addEventListener('dragend', (e: DragEvent) => {
    const tabEl = (e.target as HTMLElement).closest('.dsd-pt-tab');
    if (tabEl) {
      tabEl.classList.remove('dsd-pt-tab--dragging');
    }
    // @ts-expect-error strict migration — TS2345
    setDragState(null);
    
    // @ts-expect-error strict migration — TS2345
    tabsList.querySelectorAll('.dsd-pt-tab--drag-over').forEach((el: HTMLElement) => {
      el.classList.remove('dsd-pt-tab--drag-over');
    });
  });
  
  tabsList.addEventListener('dragover', (e: DragEvent) => {
    e.preventDefault();
    const tabEl = (e.target as HTMLElement).closest('.dsd-pt-tab');
    const dragState = getDragState();
    if (!tabEl || !dragState) return;
    
    // @ts-expect-error strict migration — TS2345
    tabsList.querySelectorAll('.dsd-pt-tab--drag-over').forEach((el: HTMLElement) => {
      el.classList.remove('dsd-pt-tab--drag-over');
    });
    
    // @ts-expect-error TS migration - TS2339
    if (tabEl.dataset.tabId !== dragState.tabId) {
      tabEl.classList.add('dsd-pt-tab--drag-over');
    }
  });
  
  tabsList.addEventListener('drop', (e: DragEvent) => {
    e.preventDefault();
    const targetTabEl = (e.target as HTMLElement).closest('.dsd-pt-tab');
    const dragState = getDragState();
    if (!targetTabEl || !dragState) return;
    
    const sourceId = dragState.tabId;
    // @ts-expect-error TS migration - TS2339
    const targetId = targetTabEl.dataset.tabId;
    
    if (sourceId !== targetId) {
      _reorderTabs(sourceId, targetId);
    }
    
    targetTabEl.classList.remove('dsd-pt-tab--drag-over');
  });
}

export function _reorderTabs(sourceId: unknown, targetId: unknown) {
  const tabs = getTabs();
  const sourceIndex = tabs.findIndex(t => t.id === sourceId);
  const targetIndex = tabs.findIndex(t => t.id === targetId);
  
  if (sourceIndex === -1 || targetIndex === -1) return;
  
  const [movedTab] = tabs.splice(sourceIndex, 1);
  tabs.splice(targetIndex, 0, movedTab);
  setTabs(tabs);
  
  _renderTabs();
  _saveTabs();
  
  _emit('tabsReordered', { tabs: tabs.map(t => t.id) });
}
