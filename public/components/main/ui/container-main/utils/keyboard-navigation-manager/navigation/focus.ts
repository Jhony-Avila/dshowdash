// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: focus
// PURPOSE: Keyboard Navigation Manager - Focus Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getNavigationGroups from ../state.js
//   _navigateLinear from ./linear.js
//
// PROVIDES:
//   focusFirst() — exported function
//   focusLast() — exported function
//   focusNext() — exported function
//   focusPrevious() — exported function
//   focusByIndex() — exported function
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

import { getNavigationGroups } from '../state.js';
import { _navigateLinear } from './linear.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.keyboard-navigation-manager.navigation.focus';

export function focusFirst(groupId: string) {
  const group = getNavigationGroups().get(groupId);
  if (!group) return false;
  
  const items = group.getItems();
  if (items.length > 0) {
    items[0].focus();
    return true;
  }
  return false;
}

export function focusLast(groupId: string) {
  const group = getNavigationGroups().get(groupId);
  if (!group) return false;
  
  const items = group.getItems();
  if (items.length > 0) {
    items[items.length - 1].focus();
    return true;
  }
  return false;
}

export function focusNext(groupId: string) {
  const group = getNavigationGroups().get(groupId);
  if (!group) return false;
  
  const items = group.getItems();
  const currentIndex = group.getCurrentIndex();
  const newIndex = _navigateLinear(items, currentIndex, 1, group.config.wrapBehavior);
  
  if (items[newIndex as unknown as string]) {
    // @ts-expect-error TS migration - TS2352
    items[newIndex as string].focus();
    return true;
  }
  return false;
}

export function focusPrevious(groupId: string) {
  const group = getNavigationGroups().get(groupId);
  if (!group) return false;
  
  const items = group.getItems();
  const currentIndex = group.getCurrentIndex();
  const newIndex = _navigateLinear(items, currentIndex, -1, group.config.wrapBehavior);
  
  if (items[newIndex as unknown as string]) {
    // @ts-expect-error TS migration - TS2352
    items[newIndex as string].focus();
    return true;
  }
  return false;
}

export function focusByIndex(groupId: string, index: number) {
  const group = getNavigationGroups().get(groupId);
  if (!group) return false;
  
  const items = group.getItems();
  if (index >= 0 && index < items.length) {
    items[index].focus();
    return true;
  }
  return false;
}
