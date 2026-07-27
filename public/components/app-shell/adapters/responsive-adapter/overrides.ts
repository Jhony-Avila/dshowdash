// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: responsive-adapter/overrides
// PURPOSE: Gerenciamento de overrides de usuário para responsividade
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   userOverrides, autoApplyPolicies from ./state.js
//   notifyListeners from ./helpers.js
// EXPORTS:
//   setUserOverride — Define override para região
//   clearUserOverride — Remove override de região
//   clearAllOverrides — Remove todos os overrides
//   getUserOverrides — Retorna cópia dos overrides
//   setAutoApply — Habilita/desabilita auto-apply
// ═══════════════════════════════════════════════════════════════
/**
 * @module ResponsiveAdapterOverrides
 * @description Overrides de usuário para responsividade
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { userOverrides, autoApplyPolicies } from './state.js';
import { notifyListeners } from './helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.adapters.responsive-adapter.overrides';

/**
 * Define override para região
 * @param {string} region - Nome da região
 * @param {boolean} override - Valor do override
 */
export function setUserOverride(region: DynObj, override: DynObj) {
    (userOverrides as DynObj)[region] = !!override;
    notifyListeners('user-override', { region, override: !!override });
}

/**
 * Remove override de região
 * @param {string} region - Nome da região
 */
export function clearUserOverride(region: DynObj) {
    delete (userOverrides as DynObj)[region];
    notifyListeners('user-override-cleared', { region });
}

/**
 * Remove todos os overrides
 */
export function clearAllOverrides() {
    for (let key in userOverrides) {
        if (userOverrides.hasOwnProperty(key)) {
            delete (userOverrides as DynObj)[key];
        }
    }
    notifyListeners('all-overrides-cleared', null);
}

/**
 * Retorna cópia dos overrides atuais
 * @returns {Object} Cópia dos overrides
 */
export function getUserOverrides() {
    return Object.assign({}, userOverrides);
}

/**
 * Habilita/desabilita auto-apply de políticas
 * @param {boolean} enabled - Estado desejado
 */
export function setAutoApply(enabled: boolean) {
    autoApplyPolicies.value = !!enabled;
    notifyListeners('auto-apply-changed', { enabled: !!enabled });
}
