// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: manager
// PURPOSE: Keyboard Navigation Manager - Groups Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   KEY_CODES, NAVIGATION_MODES from ../constants.js
//   getConfig, getNavigationGroups, setActiveGroup as setActiveGroupState, increm...
//   _log, _emit, _getFocusableElements, _handleTypeahead from ../helpers/index.js
//   _navigateLinear from ../navigation/linear.js
//   _navigateGrid from ../navigation/grid.js
//
// PROVIDES:
//   registerGroup() — exported function
//   unregisterGroup() — exported function
//   setActiveGroup() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'main.ui.container-main.utils.keyboard-navigation-manager.groups.manager';

import { KEY_CODES, NAVIGATION_MODES } from '../constants.js';
import { getConfig, getNavigationGroups, setActiveGroup as setActiveGroupState, incrementMetric } from '../state.js';
import { _log, _emit, _getFocusableElements, _handleTypeahead } from '../helpers/index.js';
import { _navigateLinear } from '../navigation/linear.js';
import { _navigateGrid } from '../navigation/grid.js';

export function registerGroup(groupId: string, container: HTMLElement, options: Record<string, any> = {}) {
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (!el) {
    _log('error', 'Container not found:', container);
    return null;
  }
  
  const config = getConfig();
  const groupConfig = {
    mode: options.mode || config.mode,
    orientation: options.orientation || config.orientation,
    wrapBehavior: options.wrapBehavior || config.wrapBehavior,
    columns: options.columns || 1,
    selector: options.selector || null,
    onNavigate: options.onNavigate || null,
    onSelect: options.onSelect || null
  };
  
  let currentIndex = 0;
  
  function getItems() {
    if (groupConfig.selector) {
      return Array.from(el!.querySelectorAll(groupConfig.selector));
    }
    // @ts-expect-error strict migration — TS2345
    return _getFocusableElements(el);
  }
  
  function handleKeyDown(e: KeyboardEvent) {
    const items = getItems();
    if (items.length === 0) return;
    
    const activeElement = document.activeElement;
    currentIndex = items.indexOf(activeElement);
    if (currentIndex === -1) currentIndex = 0;
    
    let newIndex = currentIndex;
    let handled = false;
    
    switch (e.key) {
      case KEY_CODES.ARROW_DOWN:
        if (groupConfig.orientation === 'vertical' || groupConfig.orientation === 'both') {
          if (groupConfig.mode === NAVIGATION_MODES.GRID) {
            newIndex = _navigateGrid(items, currentIndex, 'down', groupConfig.columns, groupConfig.wrapBehavior);
          } else {
            newIndex = (_navigateLinear(items, currentIndex, 1, groupConfig.wrapBehavior)) as number;
          }
          handled = true;
        }
        break;
        
      case KEY_CODES.ARROW_UP:
        if (groupConfig.orientation === 'vertical' || groupConfig.orientation === 'both') {
          if (groupConfig.mode === NAVIGATION_MODES.GRID) {
            newIndex = _navigateGrid(items, currentIndex, 'up', groupConfig.columns, groupConfig.wrapBehavior);
          } else {
            newIndex = (_navigateLinear(items, currentIndex, -1, groupConfig.wrapBehavior)) as number;
          }
          handled = true;
        }
        break;
        
      case KEY_CODES.ARROW_RIGHT:
        if (groupConfig.orientation === 'horizontal' || groupConfig.orientation === 'both') {
          if (groupConfig.mode === NAVIGATION_MODES.GRID) {
            newIndex = _navigateGrid(items, currentIndex, 'right', groupConfig.columns, groupConfig.wrapBehavior);
          } else {
            newIndex = (_navigateLinear(items, currentIndex, 1, groupConfig.wrapBehavior)) as number;
          }
          handled = true;
        }
        break;
        
      case KEY_CODES.ARROW_LEFT:
        if (groupConfig.orientation === 'horizontal' || groupConfig.orientation === 'both') {
          if (groupConfig.mode === NAVIGATION_MODES.GRID) {
            newIndex = _navigateGrid(items, currentIndex, 'left', groupConfig.columns, groupConfig.wrapBehavior);
          } else {
            newIndex = (_navigateLinear(items, currentIndex, -1, groupConfig.wrapBehavior)) as number;
          }
          handled = true;
        }
        break;
        
      case KEY_CODES.HOME:
        if (config.enableHomeEnd) {
          newIndex = 0;
          handled = true;
        }
        break;
        
      case KEY_CODES.END:
        if (config.enableHomeEnd) {
          newIndex = items.length - 1;
          handled = true;
        }
        break;
        
      case KEY_CODES.ENTER:
      case KEY_CODES.SPACE:
        if (groupConfig.onSelect) {
          e.preventDefault();
          groupConfig.onSelect(items[currentIndex], currentIndex);
          handled = true;
        }
        break;
        
      default:
        if (config.enableTypeahead && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          // @ts-expect-error TS migration - TS2345
          const matchIndex = _handleTypeahead(e.key, items, currentIndex);
          if ((matchIndex as number) >= 0) {
            newIndex = (matchIndex) as number;
            handled = true;
          }
        }
    }
    
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
      
      if (newIndex !== currentIndex && items[newIndex]) {

        items[newIndex].focus();
        currentIndex = newIndex;
        incrementMetric('navigationEvents');
        
        if (groupConfig.onNavigate) {
          groupConfig.onNavigate(items[newIndex], newIndex, e.key);
        }
        
        _emit('navigated', { groupId, index: newIndex, key: e.key });
      }
    }
  }
  
  if (groupConfig.mode === NAVIGATION_MODES.ROVING) {
    const items = getItems();
    (items as any).forEach((item: Record<string, unknown>, i: number) => {
      (item.setAttribute as (...args: unknown[]) => unknown)('tabindex', i === 0 ? '0' : '-1');
    });
  }
  
  el.addEventListener('keydown', handleKeyDown);
  
  const group = {
    id: groupId,
    element: el,
    config: groupConfig,
    getItems,
    getCurrentIndex: () => currentIndex,
    handleKeyDown,
    destroy: () => {
      el.removeEventListener('keydown', handleKeyDown);
      getNavigationGroups().delete(groupId);
    }
  };
  
  getNavigationGroups().set(groupId, group);
  _emit('groupRegistered', { groupId });
  
  return group;
}

export function unregisterGroup(groupId: string) {
  const group = getNavigationGroups().get(groupId);
  if (!group) return false;
  
  group.destroy();
  _emit('groupUnregistered', { groupId });
  
  return true;
}

export function setActiveGroup(groupId: string) {
  if (!getNavigationGroups().has(groupId)) return false;
  setActiveGroupState(groupId);
  _emit('activeGroupChanged', { groupId });
  return true;
}
