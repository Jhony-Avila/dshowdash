// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-ui-template
// PURPOSE: Provides the header HTML template string with ARIA/accessibility
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   VERSION — module version constant
//   MODULE_ID — module identifier constant
//   headerTemplate — header HTML template string
//   getVersion() — returns VERSION
//   getMetrics() — returns render metrics
//   info() — returns module info object
//   healthCheck() — returns health status
// ═══════════════════════════════════════════════════════════════
// Header HTML Template - Enterprise
// @version 6.2.0-ENTERPRISE
'use strict';

export const VERSION = '6.2.0-ENTERPRISE';
export const MODULE_ID = 'header-ui-template';

let _metrics = { renders: 0 };

export const headerTemplate = '<header class="site-header" role="banner"><div class="header-inner"><div class="header-left"></div><h1 class="visually-hidden">DshowDash - Dashboard de Análise e Monitoramento em Tempo Real</h1><div class="header-center" role="group" aria-label="Área central do header"></div><div class="header-right" role="group" aria-label="Ações e informações do usuário"></div></div><div class="header-status-live" role="status" aria-live="polite" aria-atomic="true" aria-relevant="additions text"></div></header>';

export function getVersion() { return VERSION; }
export function getMetrics() { _metrics.renders++; return Object.assign({}, _metrics); }
export function info() { return { version: VERSION, moduleId: MODULE_ID, templateSize: headerTemplate.length, hasLiveRegion: headerTemplate.includes('header-status-live'), hasAccessibility: headerTemplate.includes('role="banner"') }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { templateReady: true } }; }

export default headerTemplate;
