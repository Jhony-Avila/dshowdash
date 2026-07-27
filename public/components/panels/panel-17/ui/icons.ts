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
//   renderIcon() — exported function
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

export const MODULE_ID = 'panel-17.ui.icons';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 17 - Icons Configuration
 * @module panel-17/ui/icons
 * @version 1.1.0-AAA
 */

export const ICONS = {
    add: 'fa-plus',
    edit: 'fa-edit',
    delete: 'fa-trash',
    save: 'fa-save',
    cancel: 'fa-times',
    refresh: 'fa-sync-alt',
    search: 'fa-search',
    filter: 'fa-filter',
    export: 'fa-download',
    import: 'fa-upload',
    expand: 'fa-chevron-down',
    collapse: 'fa-chevron-up',
    settings: 'fa-cog',
    info: 'fa-info-circle',
    warning: 'fa-exclamation-triangle',
    error: 'fa-times-circle',
    success: 'fa-check-circle'
};

export function getIcon(name: string) {
    return ICONS[name as keyof typeof ICONS] || 'fa-circle';
}

export function renderIcon(name: string, className = '') {
    return `<i class="fas ${getIcon(name)} ${className}"></i>`;
}

export default { ICONS, getIcon, renderIcon };
