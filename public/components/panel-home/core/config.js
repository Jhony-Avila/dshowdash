const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "panel-home.core.config";
const CONFIG = Object.freeze({
  // Features toggles
  features: {
    contextualMessages: true,
    userGreeting: true,
    temporalAwareness: true,
    sessionContext: true,
    systemStateAwareness: true,
    animations: true,
    gracefulFallback: true
  },
  // Message display settings
  display: {
    fadeDuration: 300,
    minDisplayTime: 3e3,
    maxMessageLength: 150
  },
  // Context evaluation weights
  weights: {
    systemState: 100,
    sessionState: 80,
    temporal: 60,
    category: 40,
    variation: 20
  },
  // Time periods configuration
  timePeriods: {
    morning: { start: 5, end: 12, label: "manh\xE3" },
    afternoon: { start: 12, end: 18, label: "tarde" },
    evening: { start: 18, end: 22, label: "noite" },
    night: { start: 22, end: 5, label: "madrugada" }
  },
  // Session thresholds (in seconds)
  session: {
    newUserThreshold: 60,
    returningUserThreshold: 3600,
    idleThreshold: 300
  },
  // API settings
  api: {
    endpoint: "/api/ui/context-messages.php",
    timeout: 5e3,
    cacheTime: 3e5
  },
  // Fallback messages (used when DB is unavailable)
  fallbackMessages: [
    { id: "fallback-1", text: "Bem-vindo ao sistema", category: "acolhimento", priority: 1 },
    { id: "fallback-2", text: "Ambiente pronto", category: "estado", priority: 1 }
  ]
});
var config_default = CONFIG;
export {
  CONFIG,
  MODULE_ID,
  VERSION,
  config_default as default
};
