// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: maintenance-mode/schedule
// PURPOSE: Agendamento de manutenção programada
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   scheduledMaintenance from ./state.js
//   activate from ./core.js
//   notifySubscribers from ./subscription.js
// EXPORTS:
//   schedule — Agenda manutenção
//   cancelScheduled — Cancela agendamento
//   getScheduled — Retorna agendamento atual
// ═══════════════════════════════════════════════════════════════
/**
 * @module MaintenanceModeSchedule
 * @description Agendamento de manutenção
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { scheduledMaintenance } from './state.js';
import { activate } from './core.js';
import { notifySubscribers } from './subscription.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.maintenance-mode.schedule';

/**
 * Agenda manutenção para um horário futuro
 * @param {Object} options - Opções com startAt
 * @returns {Object} Resultado
 */
export function schedule(options: DynObj) {
    if (!options.startAt) {
        return { ok: false, error: 'startAt required' };
    }
    
    const startIn = options.startAt - Date.now();
    if (startIn <= 0) {
        return activate(options);
    }
    
    scheduledMaintenance.value = {
        options,
        scheduledFor: options.startAt,
        timer: setTimeout(() => {
            activate(options);
            scheduledMaintenance.value = null;
        }, startIn)
    };
    
    notifySubscribers({
        type: 'scheduled',
        scheduledFor: options.startAt,
        timestamp: Date.now()
    });
    
    return { ok: true, scheduledFor: options.startAt };
}

/**
 * Cancela agendamento pendente
 * @returns {Object} Resultado
 */
export function cancelScheduled() {
    if (!scheduledMaintenance.value) {
        return { ok: false, error: 'Nothing scheduled' };
    }
    
    clearTimeout(scheduledMaintenance.value.timer);
    scheduledMaintenance.value = null;
    
    notifySubscribers({
        type: 'schedule-cancelled',
        timestamp: Date.now()
    });
    
    return { ok: true };
}

/**
 * Retorna agendamento atual
 * @returns {Object|null}
 */
export function getScheduled() {
    if (!scheduledMaintenance.value) return null;
    
    return {
        scheduledFor: scheduledMaintenance.value.scheduledFor,
        options: scheduledMaintenance.value.options
    };
}
