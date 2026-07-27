// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel
// PURPOSE: Split View Manager - Panel Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SPLIT_POSITIONS from ../constants.js
//   getPrimaryPanel, getSecondaryPanel, getCollapsedPanel, setCollapsedPanel, inc...
//   _emit from ../helpers/logger.js
//   _saveState from ../helpers/storage.js
//
// PROVIDES:
//   collapse() — exported function
//   expand() — exported function
//   toggleCollapse() — exported function
//   isCollapsed() — exported function
//   setContent() — exported function
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

import { SPLIT_POSITIONS } from '../constants.js';
import { getPrimaryPanel, getSecondaryPanel, getCollapsedPanel, setCollapsedPanel, incrementMetric } from '../state.js';
import { _emit } from '../helpers/logger.js';
import { _saveState } from '../helpers/storage.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.split-view-manager.operations.panel';

export function collapse(panel: HTMLElement) {
  // @ts-expect-error TS migration - TS2367
  if (panel !== SPLIT_POSITIONS.PRIMARY && panel !== SPLIT_POSITIONS.SECONDARY) {
    return false;
  }
  
  if (getCollapsedPanel() === panel) return true;
  
  const targetPanel = panel === SPLIT_POSITIONS.PRIMARY ? getPrimaryPanel() : getSecondaryPanel();
  if (!targetPanel) return false;
  
  (targetPanel as HTMLElement).classList.add('dsd-split-view__panel--collapsed');
  setCollapsedPanel(panel);
  incrementMetric('collapses');
  _saveState();
  
  _emit('collapsed', { panel });
  
  return true;
}

export function expand(panel: HTMLElement | null = null) {
  const targetPanelName = panel || getCollapsedPanel();
  if (!targetPanelName) return false;
  
  const targetPanel = targetPanelName === SPLIT_POSITIONS.PRIMARY ? getPrimaryPanel() : getSecondaryPanel();
  if (!targetPanel) return false;
  
  (targetPanel as HTMLElement).classList.remove('dsd-split-view__panel--collapsed');
  setCollapsedPanel(null);
  _saveState();
  
  _emit('expanded', { panel: targetPanelName });
  
  return true;
}

export function toggleCollapse(panel: HTMLElement) {
  return getCollapsedPanel() === panel ? expand(panel) : collapse(panel);
}

export function isCollapsed(panel: HTMLElement | null = null) {
  if (panel) {
    return getCollapsedPanel() === panel;
  }
  return getCollapsedPanel() !== null;
}

export function setContent(panel: HTMLElement, content: string) {
  // @ts-expect-error TS migration - TS2367
  const targetPanel = panel === SPLIT_POSITIONS.PRIMARY ? getPrimaryPanel() : getSecondaryPanel();
  if (!targetPanel) return false;
  
  if (typeof content === 'string') {
    (targetPanel as HTMLElement).innerHTML = content;
  // @ts-expect-error TS migration - TS2358
  } else if (content instanceof HTMLElement) {
    (targetPanel as HTMLElement).innerHTML = '';
    (targetPanel as HTMLElement).appendChild(content);
  }
  
  _emit('contentSet', { panel });
  return true;
}
