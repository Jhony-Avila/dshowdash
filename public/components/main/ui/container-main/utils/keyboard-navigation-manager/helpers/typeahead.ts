// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: typeahead
// PURPOSE: Keyboard Navigation Manager - Typeahead
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, getTypeaheadBuffer, setTypeaheadBuffer, appendTypeaheadBuffer, get...
//   _getItemLabel from ./dom.js
//
// PROVIDES:
//   _handleTypeahead() — exported function
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

import { getConfig, getTypeaheadBuffer, setTypeaheadBuffer, appendTypeaheadBuffer, getTypeaheadTimer, setTypeaheadTimer, incrementMetric } from '../state.js';
import { _getItemLabel } from './dom.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.keyboard-navigation-manager.helpers.typeahead';

export function _handleTypeahead(char: string, items: Record<string, unknown>, currentIndex: unknown) {
  const config = getConfig();
  
  // @ts-expect-error TS migration - TS2769
  clearTimeout(getTypeaheadTimer());
  appendTypeaheadBuffer(char.toLowerCase());
  
  setTypeaheadTimer(setTimeout(() => {
    setTypeaheadBuffer('');
  }, config.typeaheadTimeout));
  
  const buffer = getTypeaheadBuffer();
  const startIndex = (currentIndex as number) + 1;
  const searchOrder = [
    // @ts-expect-error TS migration - TS2488
    ...(items.slice as (...args: unknown[]) => unknown)(startIndex),
    // @ts-expect-error TS migration - TS2488
    ...(items.slice as (...args: unknown[]) => unknown)(0, startIndex)
  ];
  
  for (let i = 0; i < searchOrder.length; i++) {
    const label = _getItemLabel(searchOrder[i]).toLowerCase();
    if (label.startsWith(buffer)) {
      incrementMetric('typeaheadMatches');
      return (items.indexOf as (...args: unknown[]) => unknown)(searchOrder[i]);
    }
  }
  
  return -1;
}
