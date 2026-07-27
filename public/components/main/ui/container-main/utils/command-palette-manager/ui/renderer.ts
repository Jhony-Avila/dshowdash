// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: renderer
// PURPOSE: Command Palette - Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, getResultsElement, getFilteredResults, getSelectedIndex from ../st...
//
// PROVIDES:
//   _renderResults() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window._dsdCommandPaletteClick
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getConfig, getResultsElement, getFilteredResults, getSelectedIndex } from '../state.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.command-palette-manager.ui.renderer';

export function _renderResults() {
  const resultsElement = getResultsElement();
  if (!resultsElement) return;
  
  const config = getConfig();
  const filteredResults = getFilteredResults();
  const selectedIndex = getSelectedIndex();
  
  if (filteredResults.length === 0) {
    resultsElement.innerHTML = `
      <div class="dsd-cp-empty">
        <p>Nenhum comando encontrado</p>
        <p style="font-size: 12px; margin-top: 8px;">
          Tente: <code>></code> ir para painel, <code>@</code> configurações
        </p>
      </div>
    `;
    return;
  }
  
  // Group by category
  const grouped: Record<string, any> = {};
  filteredResults.forEach((cmd, index) => {
    // @ts-expect-error TS migration - TS2339
    const category = (cmd as Record<string, unknown>).isRecent ? 'Recentes' : (cmd.category || 'Comandos');
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push({ ...(cmd as Record<string, unknown>), index });
  });
  
  let html = '';
  
  Object.entries(grouped).forEach(([category, commands]) => {
    if (config.showCategories) {
      html += `<div class="dsd-cp-section-title">${category}</div>`;
    }
    
    (commands as any[]).forEach(cmd => {
      const isSelected = cmd.index === selectedIndex;
      const icon = config.showIcons ? `<div class="dsd-cp-item-icon">${cmd.icon || '⚡'}</div>` : '';
      const shortcut = config.showShortcuts && cmd.shortcut ? 
        `<span class="dsd-cp-item-shortcut">${cmd.shortcut}</span>` : '';
      
      html += `
        <div class="dsd-cp-item ${isSelected ? 'dsd-cp-item--selected' : ''}" 
             data-index="${cmd.index}" onclick="window._dsdCommandPaletteClick(${cmd.index})">
          ${icon}
          <div class="dsd-cp-item-content">
            <div class="dsd-cp-item-title">${cmd.highlightedTitle || cmd.title}</div>
            ${cmd.description ? `<div class="dsd-cp-item-description">${cmd.description}</div>` : ''}
          </div>
          ${shortcut}
        </div>
      `;
    });
  });
  
  resultsElement.innerHTML = html;
  
  // Scroll selected into view
  const selectedEl = resultsElement.querySelector('.dsd-cp-item--selected');
  if (selectedEl) {
    selectedEl.scrollIntoView({ block: 'nearest' });
  }
}
