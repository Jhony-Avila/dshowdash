// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ratio
// PURPOSE: Split View Manager - Ratio
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SPLIT_ORIENTATIONS from ../constants.js
//   getConfig, getContainer, getPrimaryPanel, getSecondaryPanel, setCurrentRatio ...
//
// PROVIDES:
//   _applyRatio() — exported function
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

import { SPLIT_ORIENTATIONS } from '../constants.js';
import { getConfig, getContainer, getPrimaryPanel, getSecondaryPanel, setCurrentRatio } from '../state.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.split-view-manager.dom.ratio';

export function _applyRatio(ratio: number) {
  const primaryPanel = getPrimaryPanel();
  const secondaryPanel = getSecondaryPanel();
  const container = getContainer();
  const config = getConfig();
  
  if (!primaryPanel || !secondaryPanel) return;
  
  const isHorizontal = config.orientation === SPLIT_ORIENTATIONS.HORIZONTAL;
  const containerSize = isHorizontal ? container!.offsetWidth : container!.offsetHeight;
  const gutterSize = config.gutter;
  const availableSize = containerSize - gutterSize;
  const primarySize = Math.round(availableSize * ratio);
  
  const minSize = config.minSize;
  const maxSize = config.maxSize || (availableSize - minSize);
  const constrainedSize = Math.max(minSize, Math.min(maxSize, primarySize));
  
  (primaryPanel as HTMLElement).style.flexBasis = `${constrainedSize}px`;
  
  setCurrentRatio(constrainedSize / availableSize);
}
