// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:init:init-services
// PURPOSE: Panel-01 - Services Initializer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONFIG from ../core/config.js
//   initFeatureAsync, loadFeature from ./feature-loader.js
//   FeatureModules from ./feature-registry.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
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

import { CONFIG } from '../core/config.js';
import { initFeatureAsync, loadFeature } from './feature-loader.js';
import { FeatureModules } from './feature-registry.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:init:init-services';

export async function initServices(ctx: Record<string, unknown>, result: Record<string, unknown>) {
  const features: Record<string, unknown> = CONFIG.features || {};
  const toastModule = await loadFeature('toast', FeatureModules.toast);

  // WebSocket
  if (features.websocket && CONFIG.websocket && CONFIG.websocket.url) {
    const m = await loadFeature('websocket', FeatureModules.websocket);
    if (m) {
      result.websocket = await initFeatureAsync('websocket.init', async () => {
        const WebSocketManager = (m as Record<string, new (...args: unknown[]) => Record<string, (...a: unknown[]) => void>>).WebSocketManager;
        const ws = new WebSocketManager({
          url: CONFIG.websocket.url,
          onMessage: ctx.onWebSocketMessage,
          onConnect() {},
          onDisconnect() {}
        });
        ws.connect();
        return ws;
      }, { fallback: null });
    }
  }

  // Service Worker
  if (features.serviceWorker) {
    const m = await loadFeature('serviceWorker', FeatureModules.serviceWorker);
    if (m && toastModule) {
      result.serviceWorker = await initFeatureAsync('serviceWorker.init', async () => {
        const ServiceWorkerManager = (m as Record<string, new (...args: unknown[]) => Record<string, (...a: unknown[]) => Promise<void>>>).ServiceWorkerManager;
        const toast = toastModule as Record<string, ((msg: string) => void) | undefined>;
        const sw = new ServiceWorkerManager({
          onUpdate() { toast.info && toast.info('Nova versao disponivel'); },
          onOffline() { toast.warning && toast.warning('Voce esta offline'); },
          onOnline() { toast.success && toast.success('Conexao restaurada'); }
        });
        await sw.register();
        sw.setupNetworkListeners();
        return sw;
      }, { fallback: null });
    }
  }

  return result;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { initServices, info };
