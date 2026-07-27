// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: devtools/panel/tabs/state
// PURPOSE: Renderização da tab State no Debug Panel
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   icon, sanitizeAttr, getAppShell from ../helpers.js
// EXPORTS:
//   renderStateTab — Retorna HTML da tab de estado
// ═══════════════════════════════════════════════════════════════
/**
 * @module DevtoolsPanelTabState
 * @description Tab de visualização de estado no Debug Panel
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { icon, sanitizeAttr, getAppShell } from '../helpers.js';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.devtools.panel.tabs.state';

/**
 * Renderiza a tab de State
 * @returns {string} HTML da tab
 */
export function renderStateTab() {
    const shell = getAppShell();
    if (!shell) return '<div class="dsd-ui-empty">AppShell not available</div>';
    
    try {
        const state = shell.debug.store();
        const layoutPrefs = shell.layoutPrefs.get();
        const theme = shell.theme.info();
        
        return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon('state')} Shell State</div><pre class="dsd-ui-json">${sanitizeAttr(JSON.stringify(state, null, 2))}</pre></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon('sun')} Theme</div><div class="dsd-ui-list"><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">Current</span><span class="dsd-ui-list-item__value">${sanitizeAttr(theme.currentTheme)}</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">Resolved</span><span class="dsd-ui-list-item__value">${sanitizeAttr(theme.resolvedTheme)}</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">System</span><span class="dsd-ui-list-item__value">${sanitizeAttr(theme.systemPreference)}</span></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon('layout')} Layout Preferences</div><pre class="dsd-ui-json">${sanitizeAttr(JSON.stringify(layoutPrefs, null, 2))}</pre></div>`;
    } catch (e: any) {
        return `<div class="dsd-ui-empty">Error rendering state: ${sanitizeAttr(e.message)}</div>`;
    }
}
