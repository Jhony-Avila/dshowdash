// toolbar-wiring/index.js — Orquestrador
// @version 6.3.0-MODULAR-ES6
// @description Orquestra o wiring de todos os botões da toolbar.
//              Cada domínio funcional vive em seu próprio módulo wire-*.
//              Este arquivo NÃO contém lógica de botão — apenas coordena.
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.3.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: createLogger from ../logger.js
// IMPORTS: VERSION, MODULE_ID, state from ./state.js
// IMPORTS: emitWiringEvent, setupRewireListener, info, healthCheck from ./diagnostics.js
// IMPORTS: wireNavigation, wireRefresh, wireZoom, wireFullscreen, wireContent,
//          wireSearchExport, wireAccessibility, wireSystem, wireClipboardCapture
// PROVIDES: wireToolbar(toolbar), setupRewireListener(toolbar), info(), healthCheck()
// RE-EXPORTS: Contrato público 100% compatível com toolbar-wiring.js monolítico
'use strict';

import { createLogger } from '../logger.js';
import { VERSION, MODULE_ID, state } from './state.js';
import { emitWiringEvent, setupRewireListener as _setupRewireListener, info, healthCheck } from './diagnostics.js';

import { wireNavigation } from './wire-navigation.js';
import { wireRefresh } from './wire-refresh.js';
import { wireZoom } from './wire-zoom.js';
import { wireFullscreen } from './wire-fullscreen.js';
import { wireContent } from './wire-content.js';
import { wireSearchExport } from './wire-search-export.js';
import { wireAccessibility } from './wire-accessibility.js';
import { wireSystem } from './wire-system.js';
import { wireClipboardCapture } from './wire-clipboard-capture.js';

const logger = createLogger(MODULE_ID);

/**
 * Conecta todos os managers disponíveis aos botões da toolbar.
 * Cada wire-* recebe (toolbar, wired, failed, logger) e popula os arrays.
 * @param {object} toolbar - Instância da toolbar com registerAction/registerStateProvider
 * @returns {Promise<{ok: boolean, wired: Array, failed: Array, version: string}>}
 */
export async function wireToolbar(toolbar: Record<string, (...args: unknown[]) => unknown>) {
  if (!toolbar || !toolbar.registerAction) {
    logger.warn('Toolbar inválida ou sem registerAction');
    return { ok: false, wired: [] as unknown[], failed: ['toolbar-invalid'] };
  }

  const wired: string[] = [];
  const failed: string[] = [];

  await wireNavigation(toolbar, wired, failed, logger);
  await wireRefresh(toolbar, wired, failed, logger);
  await wireZoom(toolbar, wired, failed, logger);
  await wireFullscreen(toolbar, wired, failed, logger);
  await wireContent(toolbar, wired, failed, logger);
  await wireSearchExport(toolbar, wired, failed, logger);
  await wireAccessibility(toolbar, wired, failed, logger);
  await wireSystem(toolbar, wired, failed, logger);
  await wireClipboardCapture(toolbar, wired, failed, logger);

  const result = { ok: true, wired, failed, version: VERSION };

  state.lastWiringResult = result;
  state.lastWiringTimestamp = Date.now();

  logger.debug('Wiring completo', {
    wired: wired.length,
    failed: failed.length,
    buttons: wired
  });

  emitWiringEvent('toolbar.wiring.complete', {
    wiredCount: wired.length,
    failedCount: failed.length,
    wired,
    failed
  });

  setupRewireListener(toolbar);

  return result;
}

/**
 * Wrapper público — passa wireToolbar como callback para evitar import circular
 * @param {object} toolbar
 */
export function setupRewireListener(toolbar: Record<string, (...args: unknown[]) => unknown>) {
  _setupRewireListener(toolbar, wireToolbar);
}

export { info, healthCheck };

export default { wireToolbar, info, healthCheck, setupRewireListener, VERSION, MODULE_ID };
