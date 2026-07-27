// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: devtools/panel/tabs/regions
// PURPOSE: Renderização da tab Regions no Debug Panel
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   icon, sanitizeAttr, statusClass, getAppShell from ../helpers.js
// EXPORTS:
//   renderRegionsTab — Retorna HTML da tab de regiões
// ═══════════════════════════════════════════════════════════════
/**
 * @module DevtoolsPanelTabRegions
 * @description Tab de visualização de regiões no Debug Panel
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { icon, sanitizeAttr, statusClass, getAppShell } from '../helpers.js';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.devtools.panel.tabs.regions';

/**
 * Renderiza a tab de Regions
 * @returns {string} HTML da tab
 */
export function renderRegionsTab() {
    const shell = getAppShell();
    if (!shell) return '<div class="dsd-ui-empty">AppShell not available</div>';
    
    try {
        const info = shell.info();
        const regions = info.regions;
        
        const healthHtml = Object.keys(regions.health || {})
            .filter(k => k !== '_summary')
            .map(name => {
                const r = regions.health[name];
                const status = r && r.exists ? 'HEALTHY' : 'UNHEALTHY';
                return `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${sanitizeAttr(name)}</span><span class="dsd-ui-list-item__value ${statusClass(status)}">${status}</span></div>`;
            }).join('');
        
        const visHtml = Object.keys(regions.visibility || {}).map(name => {
            const visible = regions.visibility[name];
            return `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${sanitizeAttr(name)}</span><span class="dsd-ui-list-item__value ${visible ? 'dsd-ui-status--healthy' : ''}">${visible ? 'VISIBLE' : 'HIDDEN'}</span></div>`;
        }).join('');
        
        const sizesHtml = Object.keys(regions.sizes || {}).map(name => `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${sanitizeAttr(name)}</span><span class="dsd-ui-list-item__value">${regions.sizes[name]}px</span></div>`).join('');
        
        return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon('checkCircle')} Region Health</div><div class="dsd-ui-list">${healthHtml}</div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon('eye')} Visibility</div><div class="dsd-ui-list">${visHtml}</div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon('layout')} Sizes</div><div class="dsd-ui-list">${sizesHtml}</div></div>`;
    } catch (e: any) {
        return `<div class="dsd-ui-empty">Error rendering regions: ${sanitizeAttr(e.message)}</div>`;
    }
}
