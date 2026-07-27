// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: builder
// PURPOSE: Split View Manager - Builder
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, getContainer, setPrimaryPanel, setSecondaryPanel, setGutter, getCu...
//   _createStyles from ./styles.js
//   _applyRatio from ./ratio.js
//   _setupResizeHandlers from ../handlers/resize.js
//   _setupCollapseHandlers from ../handlers/collapse.js
//
// PROVIDES:
//   _createDOM() — exported function
//   _destroyDOM() — exported function
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

import { getConfig, getContainer, setPrimaryPanel, setSecondaryPanel, setGutter, getCurrentRatio, resetDOMRefs, getPrimaryPanel } from '../state.js';
import { _createStyles } from './styles.js';
import { _applyRatio } from './ratio.js';
import { _setupResizeHandlers } from '../handlers/resize.js';
import { _setupCollapseHandlers } from '../handlers/collapse.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.split-view-manager.dom.builder';

export function _createDOM() {
  _createStyles();
  
  const container = getContainer();
  const config = getConfig();
  const existingContent = container!.innerHTML;
  
  container!.innerHTML = `
    <div class="dsd-split-view dsd-split-view--${config.orientation}">
      <div class="dsd-split-view__panel dsd-split-view__panel--primary"></div>
      <div class="dsd-split-view__gutter">
        ${config.collapsible ? `
          <button class="dsd-split-view__collapse-btn dsd-split-view__collapse-btn--left" data-collapse="primary" title="Collapse left panel">◀</button>
          <button class="dsd-split-view__collapse-btn dsd-split-view__collapse-btn--right" data-collapse="secondary" title="Collapse right panel">▶</button>
        ` : ''}
      </div>
      <div class="dsd-split-view__panel dsd-split-view__panel--secondary"></div>
    </div>
  `;
  
  const wrapper = container!.querySelector('.dsd-split-view');
  setPrimaryPanel(wrapper!.querySelector('.dsd-split-view__panel--primary'));
  setSecondaryPanel(wrapper!.querySelector('.dsd-split-view__panel--secondary'));
  setGutter(wrapper!.querySelector('.dsd-split-view__gutter'));
  
  // @ts-expect-error TS migration - TS2339
  getPrimaryPanel().innerHTML = existingContent;
  
  // @ts-expect-error TS migration - TS2339
  wrapper.style.setProperty('--split-gutter', `${config.gutter}px`);
  // @ts-expect-error TS migration - TS2339
  wrapper.style.setProperty('--split-duration', `${config.animationDuration}ms`);
  
  _applyRatio(getCurrentRatio());
  
  if (config.resizable) {
    _setupResizeHandlers();
  }
  
  if (config.collapsible) {
    _setupCollapseHandlers();
  }
}

export function _destroyDOM() {
  const primaryPanel = getPrimaryPanel();
  const container = getContainer();
  
  if (!primaryPanel) return;
  
  const content = (primaryPanel as HTMLElement).innerHTML;
  container!.innerHTML = content;
  
  resetDOMRefs();
}
