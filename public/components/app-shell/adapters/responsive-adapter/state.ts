// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: responsive-adapter/state
// PURPOSE: Estado compartilhado do Responsive Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   currentBreakpoint — Breakpoint atual
//   previousBreakpoint — Breakpoint anterior
//   initialized — Flag de inicialização
//   enabled — Flag de habilitação
//   autoApplyPolicies — Flag de aplicação automática
//   resizeTimeout — Timeout de debounce
//   mediaQueries — MediaQueryLists registradas
//   listeners — Array de callbacks
//   userOverrides — Overrides manuais
//   metrics — Métricas de uso
// ═══════════════════════════════════════════════════════════════
/**
 * @module ResponsiveAdapterState
 * @description Estado centralizado para responsividade
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.adapters.responsive-adapter.state';

export const currentBreakpoint = { value: null as DynObj };
export const previousBreakpoint = { value: null as DynObj };
export const initialized = { value: false };
export const enabled = { value: true };
export const autoApplyPolicies = { value: true };
export const resizeTimeout = { value: null as DynObj };
export const mediaQueries = {};
export const listeners: DynObj[] = [];
export const userOverrides = {};

export const metrics = {
    breakpointChanges: 0,
    policyApplications: 0,
    resizeEvents: 0,
    errors: 0,
    lastChangeAt: null as DynObj
};
