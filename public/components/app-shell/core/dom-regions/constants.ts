// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v4.3.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: dom-regions/constants
// PURPOSE: Constantes e mapeamentos de regiões DOM
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION — Versão do módulo
//   MODULE_ID — Identificador único
//   ENTERPRISE_STRICT — Flag de modo enterprise
//   REGION_MAP — Mapeamento completo de regiões (frozen)
//   REGION_IDS — IDs simplificados por região (frozen)
// ═══════════════════════════════════════════════════════════════
/**
 * @module DOMRegionsConstants
 * @description Mapeamento de regiões do App Shell
 * @version 4.3.0-ENTERPRISE-AAA
 * @since 2024-01
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-dom-regions';
export const ENTERPRISE_STRICT = true;

export const REGION_MAP = Object.freeze({
    preloader: { id: 'shell-preloader-region', legacyId: 'preloader-root', ariaLabel: 'Loading indicator' },
    login: { id: 'shell-login-region', legacyId: 'login-container', ariaLabel: 'Login form' },
    header: { id: 'shell-header-region', legacyId: 'header-container', ariaLabel: 'Application header' },
    ticker: { id: 'shell-ticker-region', legacyId: 'ticker-container', ariaLabel: 'Information ticker' },
    'nav-rail': { id: 'shell-nav-rail-region', legacyId: 'nav-rail-container', ariaLabel: 'Navigation rail' },
    sidebar: { id: 'shell-sidebar-region', legacyId: 'sidebar-root', ariaLabel: 'Sidebar navigation' },
    main: { id: 'shell-main-region', legacyId: 'app-container', ariaLabel: 'Main content', ariaLive: 'polite' },
    footer: { id: 'shell-footer-region', legacyId: 'footer-root', ariaLabel: 'Application footer' },
    toast: { id: 'shell-toast-region', legacyId: 'toast-container', ariaLabel: 'Notifications', ariaLive: 'assertive' }
});

function _buildRegionIds() {
    const result = {};
    const keys = Object.keys(REGION_MAP);
    for (let i = 0; i < keys.length; i++) {
        (result as DynObj)[keys[i]] = (REGION_MAP as DynObj)[keys[i]].id;
    }
    return Object.freeze(result);
}

export const REGION_IDS = _buildRegionIds();
