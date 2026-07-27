const VERSION = "1.0.0-ADAPTIVE";
const MODULE_ID = "container-main:contracts:capability";
const CAPABILITY_CATEGORIES = Object.freeze({
  LAYOUT: "layout",
  MEDIA: "media",
  STORAGE: "storage",
  NETWORK: "network",
  SYSTEM: "system",
  INTERACTION: "interaction"
});
const CAPABILITY_DEFINITIONS = Object.freeze({
  // Layout
  resizable: {
    category: CAPABILITY_CATEGORIES.LAYOUT,
    description: "Permite redimensionar o painel",
    requiresGrant: false,
    revokeOnPause: false
  },
  draggable: {
    category: CAPABILITY_CATEGORIES.LAYOUT,
    description: "Permite arrastar o painel",
    requiresGrant: false,
    revokeOnPause: false
  },
  closable: {
    category: CAPABILITY_CATEGORIES.LAYOUT,
    description: "Permite fechar o painel",
    requiresGrant: false,
    revokeOnPause: false
  },
  fullscreen: {
    category: CAPABILITY_CATEGORIES.LAYOUT,
    description: "Permite modo tela cheia",
    requiresGrant: true,
    revokeOnPause: true,
    exclusive: true
  },
  "split-view": {
    category: CAPABILITY_CATEGORIES.LAYOUT,
    description: "Permite dividir a visualiza\xE7\xE3o",
    requiresGrant: true,
    revokeOnPause: false
  },
  // Media
  media: {
    category: CAPABILITY_CATEGORIES.MEDIA,
    description: "Acesso gen\xE9rico a m\xEDdia",
    requiresGrant: true,
    revokeOnPause: true
  },
  video: {
    category: CAPABILITY_CATEGORIES.MEDIA,
    description: "Reprodu\xE7\xE3o de v\xEDdeo",
    requiresGrant: true,
    revokeOnPause: true
  },
  audio: {
    category: CAPABILITY_CATEGORIES.MEDIA,
    description: "Reprodu\xE7\xE3o de \xE1udio",
    requiresGrant: true,
    revokeOnPause: true
  },
  camera: {
    category: CAPABILITY_CATEGORIES.MEDIA,
    description: "Acesso \xE0 c\xE2mera",
    requiresGrant: true,
    revokeOnPause: true,
    sensitive: true
  },
  microphone: {
    category: CAPABILITY_CATEGORIES.MEDIA,
    description: "Acesso ao microfone",
    requiresGrant: true,
    revokeOnPause: true,
    sensitive: true
  },
  // Storage
  storage: {
    category: CAPABILITY_CATEGORIES.STORAGE,
    description: "Armazenamento gen\xE9rico",
    requiresGrant: true,
    revokeOnPause: false
  },
  localStorage: {
    category: CAPABILITY_CATEGORIES.STORAGE,
    description: "Acesso ao localStorage",
    requiresGrant: false,
    revokeOnPause: false
  },
  indexedDB: {
    category: CAPABILITY_CATEGORIES.STORAGE,
    description: "Acesso ao IndexedDB",
    requiresGrant: true,
    revokeOnPause: false
  },
  // Network
  network: {
    category: CAPABILITY_CATEGORIES.NETWORK,
    description: "Acesso \xE0 rede",
    requiresGrant: false,
    revokeOnPause: false
  },
  websocket: {
    category: CAPABILITY_CATEGORIES.NETWORK,
    description: "Conex\xF5es WebSocket",
    requiresGrant: true,
    revokeOnPause: true
  },
  sse: {
    category: CAPABILITY_CATEGORIES.NETWORK,
    description: "Server-Sent Events",
    requiresGrant: true,
    revokeOnPause: true
  },
  // System
  notifications: {
    category: CAPABILITY_CATEGORIES.SYSTEM,
    description: "Enviar notifica\xE7\xF5es",
    requiresGrant: true,
    revokeOnPause: false
  },
  clipboard: {
    category: CAPABILITY_CATEGORIES.SYSTEM,
    description: "Acesso \xE0 \xE1rea de transfer\xEAncia",
    requiresGrant: true,
    revokeOnPause: false
  },
  geolocation: {
    category: CAPABILITY_CATEGORIES.SYSTEM,
    description: "Acesso \xE0 localiza\xE7\xE3o",
    requiresGrant: true,
    revokeOnPause: true,
    sensitive: true
  },
  // Interaction
  refreshable: {
    category: CAPABILITY_CATEGORIES.INTERACTION,
    description: "Permite atualizar conte\xFAdo",
    requiresGrant: false,
    revokeOnPause: false
  },
  exportable: {
    category: CAPABILITY_CATEGORIES.INTERACTION,
    description: "Permite exportar dados",
    requiresGrant: true,
    revokeOnPause: false
  },
  printable: {
    category: CAPABILITY_CATEGORIES.INTERACTION,
    description: "Permite imprimir",
    requiresGrant: true,
    revokeOnPause: false
  }
});
function getCapabilityDefinition(capability) {
  return CAPABILITY_DEFINITIONS[capability] || null;
}
function requiresGrant(capability) {
  const def = CAPABILITY_DEFINITIONS[capability];
  return def?.requiresGrant === true;
}
function shouldRevokeOnPause(capability) {
  const def = CAPABILITY_DEFINITIONS[capability];
  return def?.revokeOnPause === true;
}
function isSensitiveCapability(capability) {
  const def = CAPABILITY_DEFINITIONS[capability];
  return def?.sensitive === true;
}
function isExclusiveCapability(capability) {
  const def = CAPABILITY_DEFINITIONS[capability];
  return def?.exclusive === true;
}
function getCapabilitiesByCategory(category) {
  return Object.entries(CAPABILITY_DEFINITIONS).filter(([, def]) => def.category === category).map(([name]) => name);
}
function getSensitiveCapabilities() {
  return Object.entries(CAPABILITY_DEFINITIONS).filter(([, def]) => def.sensitive === true).map(([name]) => name);
}
function validateCapabilityDeclaration(capabilities) {
  const result = { valid: true, errors: [], warnings: [], normalized: [] };
  if (!Array.isArray(capabilities)) {
    result.valid = false;
    result.errors.push("capabilities must be an array");
    return result;
  }
  capabilities.forEach((cap) => {
    if (typeof cap !== "string") {
      result.valid = false;
      result.errors.push(`Invalid capability type: ${typeof cap}`);
      return;
    }
    const def = CAPABILITY_DEFINITIONS[cap];
    if (!def) {
      result.warnings.push(`Unknown capability: ${cap}`);
    } else {
      result.normalized.push(cap);
      if (def.sensitive) {
        result.warnings.push(`Sensitive capability requested: ${cap}`);
      }
    }
  });
  return result;
}
function createCapabilityRequest(panelId, capabilities, options = {}) {
  const { priority = "normal", reason = "" } = options;
  return {
    panelId,
    capabilities: Array.isArray(capabilities) ? capabilities : [capabilities],
    priority,
    reason,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    totalCapabilities: Object.keys(CAPABILITY_DEFINITIONS).length,
    categories: Object.keys(CAPABILITY_CATEGORIES)
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID
  };
}
var capability_contract_default = {
  VERSION,
  MODULE_ID,
  CAPABILITY_CATEGORIES,
  CAPABILITY_DEFINITIONS,
  getCapabilityDefinition,
  requiresGrant,
  shouldRevokeOnPause,
  isSensitiveCapability,
  isExclusiveCapability,
  getCapabilitiesByCategory,
  getSensitiveCapabilities,
  validateCapabilityDeclaration,
  createCapabilityRequest,
  info,
  healthCheck
};
export {
  CAPABILITY_CATEGORIES,
  CAPABILITY_DEFINITIONS,
  MODULE_ID,
  VERSION,
  createCapabilityRequest,
  capability_contract_default as default,
  getCapabilitiesByCategory,
  getCapabilityDefinition,
  getSensitiveCapabilities,
  healthCheck,
  info,
  isExclusiveCapability,
  isSensitiveCapability,
  requiresGrant,
  shouldRevokeOnPause,
  validateCapabilityDeclaration
};
