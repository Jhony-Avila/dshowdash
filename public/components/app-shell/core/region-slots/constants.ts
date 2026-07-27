// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-slots/constants
// PURPOSE: Constantes e enums para sistema de slots
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION — Versão do módulo
//   MODULE_ID — Identificador único
//   SLOT_POSITIONS — Enum de posições (frozen)
//   SLOT_ATTRIBUTE — Atributo data para slot
//   SLOT_ID_ATTRIBUTE — Atributo data para ID
//   SLOT_PRIORITY_ATTRIBUTE — Atributo data para prioridade
//   default — Objeto com todas as constantes
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionSlotsConstants
 * @description Constantes para sistema de slots em regiões
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '1.0.0-AAA';
export const MODULE_ID = 'app-shell-region-slots';

export const SLOT_POSITIONS = Object.freeze({
    PREPEND: 'prepend',
    APPEND: 'append',
    REPLACE: 'replace',
    BEFORE: 'before',
    AFTER: 'after'
});

export const SLOT_ATTRIBUTE = 'data-slot';
export const SLOT_ID_ATTRIBUTE = 'data-slot-id';
export const SLOT_PRIORITY_ATTRIBUTE = 'data-slot-priority';

export default {
    VERSION,
    MODULE_ID,
    SLOT_POSITIONS,
    SLOT_ATTRIBUTE,
    SLOT_ID_ATTRIBUTE,
    SLOT_PRIORITY_ATTRIBUTE
};
