// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: maintenance-mode/state
// PURPOSE: Estado compartilhado do modo de manutenção
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SEVERITY from ./constants.js
// EXPORTS:
//   state — Estado atual da manutenção
//   config — Configurações
//   subscribers — Array de subscribers
//   bannerElement — Referência ao banner DOM
//   scheduledMaintenance — Manutenção agendada
//   metrics — Métricas de uso
// ═══════════════════════════════════════════════════════════════
/**
 * @module MaintenanceModeState
 * @description Estado centralizado do modo de manutenção
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { SEVERITY } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.maintenance-mode.state';

export const state: Record<string, any> = {
    active: false,
    type: null,
    severity: SEVERITY.INFO,
    message: null,
    startTime: null,
    endTime: null,
    affectedRegions: [],
    affectedFeatures: [],
    allowedRoles: [],
    bypassToken: null
};

export const config = {
    showBanner: true,
    bannerPosition: 'top',
    blockInteraction: true,
    allowDismiss: false,
    persistState: true
};

export const subscribers: DynObj[] = [];
export const bannerElement = { value: null as DynObj };
export const scheduledMaintenance = { value: null as DynObj };

export const metrics = {
    activations: 0,
    deactivations: 0,
    bypasses: 0
};
