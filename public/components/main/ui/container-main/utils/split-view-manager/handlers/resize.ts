// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: resize
// PURPOSE: Split View Manager - Resize Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SPLIT_ORIENTATIONS from ../constants.js
//   getConfig, getContainer, getPrimaryPanel, getGutter, isResizing, setIsResizin...
//   _emit from ../helpers/logger.js
//   _saveState from ../helpers/storage.js
//   _applyRatio from ../dom/ratio.js
//
// PROVIDES:
//   _setupResizeHandlers() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'mousedown'
//   'mousemove'
//   'mouseup'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SPLIT_ORIENTATIONS } from '../constants.js';
import { getConfig, getContainer, getPrimaryPanel, getGutter, isResizing, setIsResizing, getCurrentRatio, incrementMetric } from '../state.js';
import { _emit } from '../helpers/logger.js';
import { _saveState } from '../helpers/storage.js';
import { _applyRatio } from '../dom/ratio.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.split-view-manager.handlers.resize';

export function _setupResizeHandlers() {
  const gutter = getGutter();
  const container = getContainer();
  const config = getConfig();
  
  let startPos = 0;
  let startSize = 0;
  
  const onMouseDown = (e: Event) => {
    if ((e.target as HTMLElement).closest('.dsd-split-view__collapse-btn')) return;
    
    e.preventDefault();
    setIsResizing(true);
    
    const wrapper = container!.querySelector('.dsd-split-view');
    wrapper!.classList.add('dsd-split-view--resizing');
    (gutter as HTMLElement).classList.add('dsd-split-view__gutter--active');
    
    const isHorizontal = config.orientation === SPLIT_ORIENTATIONS.HORIZONTAL;
    const primaryPanel = getPrimaryPanel();
    // @ts-expect-error TS migration - TS2339
    startPos = isHorizontal ? e.clientX : e.clientY;
    // @ts-expect-error TS migration - TS2339
    startSize = isHorizontal ? (primaryPanel as HTMLElement).offsetWidth : primaryPanel.offsetHeight;
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  
  const onMouseMove = (e: Event) => {
    if (!isResizing()) return;
    
    const isHorizontal = config.orientation === SPLIT_ORIENTATIONS.HORIZONTAL;
    // @ts-expect-error TS migration - TS2339
    const currentPos = isHorizontal ? e.clientX : e.clientY;
    const delta = currentPos - startPos;
    const newSize = startSize + delta;
    
    const containerSize = isHorizontal ? container!.offsetWidth : container!.offsetHeight;
    const availableSize = containerSize - config.gutter;
    const newRatio = newSize / availableSize;
    
    _applyRatio(newRatio);
    _emit('resize', { ratio: getCurrentRatio(), size: newSize });
  };
  
  const onMouseUp = () => {
    if (!isResizing()) return;
    
    setIsResizing(false);
    
    const wrapper = container!.querySelector('.dsd-split-view');
    wrapper!.classList.remove('dsd-split-view--resizing');
    (gutter as HTMLElement).classList.remove('dsd-split-view__gutter--active');
    
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    
    incrementMetric('resizes');
    _saveState();
    _emit('resizeEnd', { ratio: getCurrentRatio() });
  };
  
  (gutter as HTMLElement).addEventListener('mousedown', onMouseDown);
}
