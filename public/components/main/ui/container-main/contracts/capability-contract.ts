

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ADAPTIVE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:contracts:capability
// PURPOSE: Capability Contract - Contrato de capacidades para painéis
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CAPABILITY_CATEGORIES — exported value
//   CAPABILITY_DEFINITIONS — exported value
//   getCapabilityDefinition() — exported function
//   requiresGrant() — exported function
//   shouldRevokeOnPause() — exported function
//   isSensitiveCapability() — exported function
//   isExclusiveCapability() — exported function
//   getCapabilitiesByCategory() — exported function
//   getSensitiveCapabilities() — exported function
//   validateCapabilityDeclaration() — exported function
//   createCapabilityRequest() — exported function
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

export const VERSION = '1.0.0-ADAPTIVE';
export const MODULE_ID = 'container-main:contracts:capability';

// Categorias de capacidades
export const CAPABILITY_CATEGORIES = Object.freeze({
  LAYOUT: 'layout',
  MEDIA: 'media',
  STORAGE: 'storage',
  NETWORK: 'network',
  SYSTEM: 'system',
  INTERACTION: 'interaction'
});

// Definição completa de capacidades
export const CAPABILITY_DEFINITIONS = Object.freeze({
  // Layout
  resizable: {
    category: CAPABILITY_CATEGORIES.LAYOUT,
    description: 'Permite redimensionar o painel',
    requiresGrant: false,
    revokeOnPause: false
  },
  draggable: {
    category: CAPABILITY_CATEGORIES.LAYOUT,
    description: 'Permite arrastar o painel',
    requiresGrant: false,
    revokeOnPause: false
  },
  closable: {
    category: CAPABILITY_CATEGORIES.LAYOUT,
    description: 'Permite fechar o painel',
    requiresGrant: false,
    revokeOnPause: false
  },
  fullscreen: {
    category: CAPABILITY_CATEGORIES.LAYOUT,
    description: 'Permite modo tela cheia',
    requiresGrant: true,
    revokeOnPause: true,
    exclusive: true
  },
  'split-view': {
    category: CAPABILITY_CATEGORIES.LAYOUT,
    description: 'Permite dividir a visualização',
    requiresGrant: true,
    revokeOnPause: false
  },

  // Media
  media: {
    category: CAPABILITY_CATEGORIES.MEDIA,
    description: 'Acesso genérico a mídia',
    requiresGrant: true,
    revokeOnPause: true
  },
  video: {
    category: CAPABILITY_CATEGORIES.MEDIA,
    description: 'Reprodução de vídeo',
    requiresGrant: true,
    revokeOnPause: true
  },
  audio: {
    category: CAPABILITY_CATEGORIES.MEDIA,
    description: 'Reprodução de áudio',
    requiresGrant: true,
    revokeOnPause: true
  },
  camera: {
    category: CAPABILITY_CATEGORIES.MEDIA,
    description: 'Acesso à câmera',
    requiresGrant: true,
    revokeOnPause: true,
    sensitive: true
  },
  microphone: {
    category: CAPABILITY_CATEGORIES.MEDIA,
    description: 'Acesso ao microfone',
    requiresGrant: true,
    revokeOnPause: true,
    sensitive: true
  },

  // Storage
  storage: {
    category: CAPABILITY_CATEGORIES.STORAGE,
    description: 'Armazenamento genérico',
    requiresGrant: true,
    revokeOnPause: false
  },
  localStorage: {
    category: CAPABILITY_CATEGORIES.STORAGE,
    description: 'Acesso ao localStorage',
    requiresGrant: false,
    revokeOnPause: false
  },
  indexedDB: {
    category: CAPABILITY_CATEGORIES.STORAGE,
    description: 'Acesso ao IndexedDB',
    requiresGrant: true,
    revokeOnPause: false
  },

  // Network
  network: {
    category: CAPABILITY_CATEGORIES.NETWORK,
    description: 'Acesso à rede',
    requiresGrant: false,
    revokeOnPause: false
  },
  websocket: {
    category: CAPABILITY_CATEGORIES.NETWORK,
    description: 'Conexões WebSocket',
    requiresGrant: true,
    revokeOnPause: true
  },
  sse: {
    category: CAPABILITY_CATEGORIES.NETWORK,
    description: 'Server-Sent Events',
    requiresGrant: true,
    revokeOnPause: true
  },

  // System
  notifications: {
    category: CAPABILITY_CATEGORIES.SYSTEM,
    description: 'Enviar notificações',
    requiresGrant: true,
    revokeOnPause: false
  },
  clipboard: {
    category: CAPABILITY_CATEGORIES.SYSTEM,
    description: 'Acesso à área de transferência',
    requiresGrant: true,
    revokeOnPause: false
  },
  geolocation: {
    category: CAPABILITY_CATEGORIES.SYSTEM,
    description: 'Acesso à localização',
    requiresGrant: true,
    revokeOnPause: true,
    sensitive: true
  },

  // Interaction
  refreshable: {
    category: CAPABILITY_CATEGORIES.INTERACTION,
    description: 'Permite atualizar conteúdo',
    requiresGrant: false,
    revokeOnPause: false
  },
  exportable: {
    category: CAPABILITY_CATEGORIES.INTERACTION,
    description: 'Permite exportar dados',
    requiresGrant: true,
    revokeOnPause: false
  },
  printable: {
    category: CAPABILITY_CATEGORIES.INTERACTION,
    description: 'Permite imprimir',
    requiresGrant: true,
    revokeOnPause: false
  }
});

// Obtém definição de capacidade
export function getCapabilityDefinition(capability: string) {
  return (CAPABILITY_DEFINITIONS as Record<string, unknown>)[capability] || null;
}

// Verifica se capacidade requer concessão
export function requiresGrant(capability: string) {
  const def = (CAPABILITY_DEFINITIONS as Record<string, Record<string, unknown>>)[capability];
  return def?.requiresGrant === true;
}

// Verifica se capacidade deve ser revogada ao pausar
export function shouldRevokeOnPause(capability: string) {
  const def = (CAPABILITY_DEFINITIONS as Record<string, Record<string, unknown>>)[capability];
  return def?.revokeOnPause === true;
}

// Verifica se capacidade é sensível
export function isSensitiveCapability(capability: string) {
  const def = (CAPABILITY_DEFINITIONS as Record<string, Record<string, unknown>>)[capability];
  return def?.sensitive === true;
}

// Verifica se capacidade é exclusiva
export function isExclusiveCapability(capability: string) {
  const def = (CAPABILITY_DEFINITIONS as Record<string, Record<string, unknown>>)[capability];
  return def?.exclusive === true;
}

// Lista capacidades por categoria
export function getCapabilitiesByCategory(category: string) {
  return Object.entries(CAPABILITY_DEFINITIONS)
    .filter(([, def]) => def.category === category)
    .map(([name]) => name);
}

// Lista todas as capacidades sensíveis
export function getSensitiveCapabilities() {
  return Object.entries(CAPABILITY_DEFINITIONS)
    .filter(([, def]) => (def as any).sensitive === true)
    .map(([name]) => name);
}

// Valida declaração de capacidades
export function validateCapabilityDeclaration(capabilities: unknown) {
  const result = { valid: true, errors: [] as unknown[], warnings: [] as unknown[], normalized: [] as unknown[] };

  if (!Array.isArray(capabilities)) {
    result.valid = false;
    result.errors.push('capabilities must be an array');
    return result;
  }

  capabilities.forEach(cap => {
    if (typeof cap !== 'string') {
      result.valid = false;
      result.errors.push(`Invalid capability type: ${typeof cap}`);
      return;
    }

    const def = (CAPABILITY_DEFINITIONS as Record<string, Record<string, unknown>>)[cap];
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

// Cria request de capacidade
export function createCapabilityRequest(panelId: string, capabilities: unknown, options: Record<string, unknown> = {}) {
  const { priority = 'normal', reason = '' } = options;
  
  return {
    panelId,
    capabilities: Array.isArray(capabilities) ? capabilities : [capabilities],
    priority,
    reason,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    totalCapabilities: Object.keys(CAPABILITY_DEFINITIONS).length,
    categories: Object.keys(CAPABILITY_CATEGORIES)
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID
  };
}

export default {
  VERSION, MODULE_ID,
  CAPABILITY_CATEGORIES, CAPABILITY_DEFINITIONS,
  getCapabilityDefinition, requiresGrant, shouldRevokeOnPause,
  isSensitiveCapability, isExclusiveCapability,
  getCapabilitiesByCategory, getSensitiveCapabilities,
  validateCapabilityDeclaration, createCapabilityRequest,
  info, healthCheck
};
