// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: trigger-icons
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   TRIGGER_ICONS — exported value
//   getTriggerIcon() — exported function
//   renderTriggerIcon() — exported function
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

export const MODULE_ID = 'panel-permissions-admin.config.trigger-icons';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel Permissions Admin - Trigger Icons Configuration
 * @module panel-permissions-admin/config/trigger-icons
 * @version 1.1.0-AAA
 */

export const TRIGGER_ICONS = {
    create: 'fa-plus-circle',
    read: 'fa-eye',
    update: 'fa-edit',
    delete: 'fa-trash-alt',
    execute: 'fa-play-circle',
    admin: 'fa-user-shield',
    export: 'fa-file-export',
    import: 'fa-file-import',
    approve: 'fa-check-circle',
    reject: 'fa-times-circle',
    assign: 'fa-user-plus',
    revoke: 'fa-user-minus'
};

export function getTriggerIcon(trigger: string) {
    return (TRIGGER_ICONS as Record<string, string>)[trigger] || 'fa-key';
}

export function renderTriggerIcon(trigger: string, className = '') {
    return `<i class="fas ${getTriggerIcon(trigger)} ${className}"></i>`;
}

export default { TRIGGER_ICONS, getTriggerIcon, renderTriggerIcon };
