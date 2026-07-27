import { CONFIG } from "../core/config.js";
import { initFeatureAsync, loadFeature } from "./feature-loader.js";
import { FeatureModules } from "./feature-registry.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:init:init-services";
async function initServices(ctx, result) {
  const features = CONFIG.features || {};
  const toastModule = await loadFeature("toast", FeatureModules.toast);
  if (features.websocket && CONFIG.websocket && CONFIG.websocket.url) {
    const m = await loadFeature("websocket", FeatureModules.websocket);
    if (m) {
      result.websocket = await initFeatureAsync("websocket.init", async () => {
        const WebSocketManager = m.WebSocketManager;
        const ws = new WebSocketManager({
          url: CONFIG.websocket.url,
          onMessage: ctx.onWebSocketMessage,
          onConnect() {
          },
          onDisconnect() {
          }
        });
        ws.connect();
        return ws;
      }, { fallback: null });
    }
  }
  if (features.serviceWorker) {
    const m = await loadFeature("serviceWorker", FeatureModules.serviceWorker);
    if (m && toastModule) {
      result.serviceWorker = await initFeatureAsync("serviceWorker.init", async () => {
        const ServiceWorkerManager = m.ServiceWorkerManager;
        const toast = toastModule;
        const sw = new ServiceWorkerManager({
          onUpdate() {
            toast.info && toast.info("Nova versao disponivel");
          },
          onOffline() {
            toast.warning && toast.warning("Voce esta offline");
          },
          onOnline() {
            toast.success && toast.success("Conexao restaurada");
          }
        });
        await sw.register();
        sw.setupNetworkListeners();
        return sw;
      }, { fallback: null });
    }
  }
  return result;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var init_services_default = { initServices, info };
export {
  MODULE_ID,
  VERSION,
  init_services_default as default,
  info,
  initServices
};
