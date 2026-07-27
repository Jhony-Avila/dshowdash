// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: errors
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   ErrorTypes — exported value
//   getErrorMessage() — exported function
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

export const MODULE_ID = 'panel-14.ui.errors';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 14 - Error Handling UI
 * @module panel-14/ui/errors
 * @version 1.1.0-AAA
 */

export const ErrorTypes = {
    NETWORK: 'NETWORK',
    VALIDATION: 'VALIDATION',
    SERVER: 'SERVER',
    UNKNOWN: 'UNKNOWN'
};

export function getErrorMessage(type: string, details = '') {
    const messages = {
        [ErrorTypes.NETWORK]: 'Erro de conexão. Verifique sua internet.',
        [ErrorTypes.VALIDATION]: 'Dados inválidos. Verifique os campos.',
        [ErrorTypes.SERVER]: 'Erro no servidor. Tente novamente.',
        [ErrorTypes.UNKNOWN]: 'Erro desconhecido. Contate o suporte.'
    };
    return details ? `${messages[type] || messages[ErrorTypes.UNKNOWN]} ${details}` : messages[type] || messages[ErrorTypes.UNKNOWN];
}
