import { PANEL_CAPABILITIES } from "../../contracts/panel-contract.js";
const VERSION = "1.0.0-MODULAR";
const MODULE_ID = "container-main:capability-manager:platform-config";
const PLATFORM_CAPABILITIES = Object.freeze({
  // Layout
  [PANEL_CAPABILITIES.RESIZABLE]: { available: true, requiresGrant: false, maxConcurrent: Infinity },
  [PANEL_CAPABILITIES.DRAGGABLE]: { available: true, requiresGrant: false, maxConcurrent: Infinity },
  [PANEL_CAPABILITIES.CLOSABLE]: { available: true, requiresGrant: false, maxConcurrent: Infinity },
  [PANEL_CAPABILITIES.FULLSCREEN]: { available: true, requiresGrant: true, maxConcurrent: 1 },
  [PANEL_CAPABILITIES.SPLIT_VIEW]: { available: true, requiresGrant: true, maxConcurrent: 2 },
  // Funcionalidade
  [PANEL_CAPABILITIES.REFRESHABLE]: { available: true, requiresGrant: false, maxConcurrent: Infinity },
  [PANEL_CAPABILITIES.EXPORTABLE]: { available: true, requiresGrant: true, maxConcurrent: Infinity },
  [PANEL_CAPABILITIES.PRINTABLE]: { available: true, requiresGrant: true, maxConcurrent: Infinity },
  // Mídia
  media: { available: true, requiresGrant: true, maxConcurrent: 3 },
  video: { available: true, requiresGrant: true, maxConcurrent: 2 },
  audio: { available: true, requiresGrant: true, maxConcurrent: 3 },
  camera: { available: false, requiresGrant: true, maxConcurrent: 1 },
  microphone: { available: false, requiresGrant: true, maxConcurrent: 1 },
  // Storage
  storage: { available: true, requiresGrant: true, maxConcurrent: Infinity },
  localStorage: { available: true, requiresGrant: false, maxConcurrent: Infinity },
  indexedDB: { available: true, requiresGrant: true, maxConcurrent: Infinity },
  // Rede
  network: { available: true, requiresGrant: false, maxConcurrent: Infinity },
  websocket: { available: true, requiresGrant: true, maxConcurrent: 5 },
  sse: { available: true, requiresGrant: true, maxConcurrent: 3 },
  // Sistema
  notifications: { available: true, requiresGrant: true, maxConcurrent: Infinity },
  clipboard: { available: true, requiresGrant: true, maxConcurrent: Infinity },
  geolocation: { available: false, requiresGrant: true, maxConcurrent: 1 }
});
function createPlatformConfig() {
  return JSON.parse(JSON.stringify(PLATFORM_CAPABILITIES));
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    capabilities: Object.keys(PLATFORM_CAPABILITIES),
    totalCapabilities: Object.keys(PLATFORM_CAPABILITIES).length
  };
}
var platform_config_default = {
  VERSION,
  MODULE_ID,
  PLATFORM_CAPABILITIES,
  createPlatformConfig,
  info
};
export {
  MODULE_ID,
  PLATFORM_CAPABILITIES,
  VERSION,
  createPlatformConfig,
  platform_config_default as default,
  info
};
