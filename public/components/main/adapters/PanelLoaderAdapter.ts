// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (7.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-loader-adapter-wrapper
// PURPOSE: PanelLoaderAdapter - Wrapper de Compatibilidade
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   createPanelLoaderAdapter — exported value
//   PANEL_ID_PATHS — exported value
//   ITEM_TO_PANEL — exported value
//   CRITICAL_PANELS — exported value
//   LRUCache — exported value
//   retryWithBackoff — exported value
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

export { VERSION, MODULE_ID, createPanelLoaderAdapter, PANEL_ID_PATHS, ITEM_TO_PANEL, CRITICAL_PANELS, LRUCache, retryWithBackoff } from './panel-loader/index.js';
export { default } from './panel-loader/index.js';

const LOCAL_MODULE_ID = 'panel-loader-adapter-wrapper';
const LOCAL_VERSION = '7.1.0-ENTERPRISE';

export function healthCheck() { return { status: 'HEALTHY', version: LOCAL_VERSION, moduleId: LOCAL_MODULE_ID, checks: { wrapperActive: true } }; }
