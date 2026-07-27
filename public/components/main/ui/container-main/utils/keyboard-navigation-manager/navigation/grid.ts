// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: grid
// PURPOSE: Keyboard Navigation Manager - Grid Navigation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   FOCUS_WRAP from ../constants.js
//
// PROVIDES:
//   _navigateGrid() — exported function
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

import { FOCUS_WRAP } from '../constants.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.keyboard-navigation-manager.navigation.grid';

export function _navigateGrid(items: unknown[], currentIndex: number, direction: string, columns: number, wrap: unknown) {
  const rows = Math.ceil(items.length / columns);
  const currentRow = Math.floor(currentIndex / columns);
  const currentCol = currentIndex % columns;
  
  let newRow = currentRow;
  let newCol = currentCol;
  
  switch (direction) {
    case 'up':
      newRow = currentRow - 1;
      break;
    case 'down':
      newRow = currentRow + 1;
      break;
    case 'left':
      newCol = currentCol - 1;
      break;
    case 'right':
      newCol = currentCol + 1;
      break;
  }
  
  if (wrap === FOCUS_WRAP.WRAP) {
    if (newRow < 0) newRow = rows - 1;
    else if (newRow >= rows) newRow = 0;
    if (newCol < 0) newCol = (columns as number) - 1;
    else if ((newCol as number) >= columns) newCol = 0;
  } else {
    newRow = Math.max(0, Math.min(rows - 1, newRow));
    newCol = Math.max(0, Math.min((columns as number) - 1, newCol));
  }
  
  const newIndex = newRow * (columns as number) + newCol;
  return Math.min(newIndex, (items.length as number) - 1);
}
