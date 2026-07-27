// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-cards
// PURPOSE: Panel-Cards Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   PAINEL_ID — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//   CSS_PATH — exported value
//   info() — exported function
//   healthCheck() — exported function
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

export const PAINEL_ID = 'panel-cards';
export const MODULE_ID = 'panel-cards.core.constants';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const CSS_PATH = '/components/panels/panel-cards/styles/index.css';

export function info() { return { moduleId: 'panels-panel-cards-core-constants', version: VERSION || '1.0.0' }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: 'panels-panel-cards-core-constants', version: VERSION || '1.0.0', checks: { constantsLoaded: true } }; }
