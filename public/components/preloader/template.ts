// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-template
// PURPOSE: Preloader/Loading Screen Template
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   getPreloaderTemplate() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'preloader-template';
const VERSION = '1.2.0-P17WI';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _metrics = { renders: 0 };

export function getPreloaderTemplate() {
  _initPorts();
  _metrics.renders++;
  return '<div id="loading-screen" role="status" aria-live="polite" aria-label="Carregando" aria-busy="true"><video id="loading-video" autoplay loop muted playsinline preload="metadata"><source src="/assets/videos/video_background_site_web.mp4" type="video/mp4">Seu navegador não suporta vídeo HTML5.</video><div class="loading-logo-container"><img src="/assets/icons/logo-square.png" alt="DshowDash Logo" class="loading-logo" width="180" height="168" decoding="async" fetchpriority="high"></div><div class="loading-text">Carregando</div><div class="loading-progress-wrapper"><div class="loading-progress"><div class="loading-progress-bar" id="loading-progress-bar"></div></div><div class="loading-percentage">0%</div></div></div>';
}

export function getMetrics() { return Object.assign({}, _metrics); }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), metrics: getMetrics() }; }
export function healthCheck() {
  const checks = { templateReady: true, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, version: VERSION, moduleId: MODULE_ID, checks, portsInitialized: Ports.isInitialized(), metrics: getMetrics() };
}

export { MODULE_ID, VERSION };
export default { MODULE_ID, VERSION, getPreloaderTemplate, getMetrics, info, healthCheck, injectPorts, getPorts };
