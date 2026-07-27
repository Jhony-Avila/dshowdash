// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: handlers
// PURPOSE: Command Palette - Event Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, getPaletteElement, getFilteredResults, getSelectedIndex, setSelect...
//   _filterCommands from ../filter/index.js
//   _renderResults from ../ui/renderer.js
//   _executeCommand from ../commands/executor.js
//   close from ../api.js
//
// PROVIDES:
//   _handleInput() — exported function
//   _handleKeyDown() — exported function
//   _handleBackdropClick() — exported function
//   _handleItemClick() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any)._dsdCommandPaletteClick
// ═══════════════════════════════════════════════════════════════
'use strict';

import { 
  getConfig, 
  getPaletteElement,
  getFilteredResults, 
  getSelectedIndex, 
  setSelectedIndex, 
  setFilteredResults,
  getDebounceTimer,
  setDebounceTimer,
  incrementMetric
} from '../state.js';
import { _filterCommands } from '../filter/index.js';
import { _renderResults } from '../ui/renderer.js';
import { _executeCommand } from '../commands/executor.js';
import { close } from '../api.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.command-palette-manager.events.handlers';

export function _handleInput(e: Event) {
  const config = getConfig();
  // @ts-expect-error TS migration - TS2769
  clearTimeout(getDebounceTimer());
  
  setDebounceTimer(setTimeout(() => {
    // @ts-expect-error TS migration - TS2339
    const query = (e.target as HTMLElement).value;
    setFilteredResults(_filterCommands(query));
    setSelectedIndex(0);
    _renderResults();
    incrementMetric('searches');
  }, config.debounceDelay));
}

export function _handleKeyDown(e: KeyboardEvent) {
  const config = getConfig();
  const filteredResults = getFilteredResults();
  let selectedIndex = getSelectedIndex();
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filteredResults.length - 1);
      setSelectedIndex(selectedIndex);
      _renderResults();
      break;
      
    case 'ArrowUp':
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      setSelectedIndex(selectedIndex);
      _renderResults();
      break;
      
    case 'Enter':
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        _executeCommand((filteredResults as unknown as string)[selectedIndex]);
      }
      break;
      
    case 'Escape':
      if (config.closeOnEscape) {
        close();
      }
      break;
  }
}

export function _handleBackdropClick(e: Event) {
  const config = getConfig();
  const paletteElement = getPaletteElement();
  
  if (config.closeOnClickOutside && e.target === paletteElement) {
    close();
  }
}

export function _handleItemClick(index: number) {
  const filteredResults = getFilteredResults();
  setSelectedIndex(index);
  _executeCommand((filteredResults as unknown as string)[index]);
}

// Global click handler
if (typeof window !== 'undefined') {
  (window as any)._dsdCommandPaletteClick = (index: number) => _handleItemClick(index);
}
