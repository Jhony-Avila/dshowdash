// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: icons
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   ICONS — exported value
//   getIcon() — exported function
//   iconHTML() — exported function
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

export const MODULE_ID = 'panel-15.ui.icons';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 15 - Icons Configuration
 * @module panel-15/ui/icons
 * @version 1.1.0-AAA
 */

export const ICONS = {
    add: 'fa-plus',
    edit: 'fa-pencil-alt',
    delete: 'fa-trash-alt',
    save: 'fa-save',
    cancel: 'fa-ban',
    refresh: 'fa-redo',
    search: 'fa-search',
    filter: 'fa-filter',
    export: 'fa-file-export',
    import: 'fa-file-import',
    settings: 'fa-cog',
    info: 'fa-info-circle'
};

export function getIcon(name: string, fallback = 'fa-circle') {
    return (ICONS as Record<string, string>)[name] || fallback;
}

export function iconHTML(name: string, extraClass = '') {
    return `<i class="fas ${getIcon(name)} ${extraClass}"></i>`;
}

export default { ICONS, getIcon, iconHTML };
