// Kernel Constants - Modos, Capacidades e Eventos
// @version 1.1.1-CONTRACTS
// @changelog v1.1.1-CONTRACTS: Dependency Contract formalizado
// @description Constantes centralizadas do Application Kernel
// @changelog v1.1.0: Adicionado mapeamento StateMachine → Kernel (#10)
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: KERNEL_MODES, BOOT_STATES, STATE_TO_MODE, mapStateToMode(),
//   CAPABILITIES, CAPABILITY_DEFAULTS, KERNEL_EVENTS, MODE_TRANSITIONS,
//   isValidTransition(), getDefaultCapabilities(), getAllCapabilities(),
//   getAllModes()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

var MODULE_ID = 'kernel-constants';
var VERSION = '1.1.1-CONTRACTS';

// Modos de operação do sistema
var KERNEL_MODES = {
  INITIALIZING: 'INITIALIZING',
  NORMAL: 'NORMAL',
  DEGRADED: 'DEGRADED',
  MAINTENANCE: 'MAINTENANCE',
  RECOVERY: 'RECOVERY',
  FAILED: 'FAILED'
};

// Estados do Boot StateMachine (espelho para referência)
var BOOT_STATES = {
  COLD: 'cold',
  INITIALIZING: 'initializing',
  LOADING_CRITICAL: 'loading-critical',
  LOADING_CORE: 'loading-core',
  AUTHENTICATING: 'authenticating',
  LOADING_SHELL: 'loading-shell',
  LOADING_MAIN: 'loading-main',
  LOADING_UI: 'loading-ui',
  LOADING_PLATFORM: 'loading-platform',
  READY: 'ready',
  ERROR: 'error',
  RECOVERING: 'recovering'
};

// #10: Mapeamento StateMachine → Kernel Mode
var STATE_TO_MODE = {
  'cold': KERNEL_MODES.INITIALIZING,
  'initializing': KERNEL_MODES.INITIALIZING,
  'loading-critical': KERNEL_MODES.INITIALIZING,
  'loading-core': KERNEL_MODES.INITIALIZING,
  'authenticating': KERNEL_MODES.INITIALIZING,
  'loading-shell': KERNEL_MODES.INITIALIZING,
  'loading-main': KERNEL_MODES.INITIALIZING,
  'loading-ui': KERNEL_MODES.INITIALIZING,
  'loading-platform': KERNEL_MODES.INITIALIZING,
  'ready': KERNEL_MODES.NORMAL,
  'error': KERNEL_MODES.FAILED,
  'recovering': KERNEL_MODES.RECOVERY
};

// #10: Função para mapear estado do StateMachine para modo do Kernel
function mapStateToMode(bootState: string, isDegraded: boolean) {
  if (isDegraded === undefined) isDegraded = false;

  var mode = (STATE_TO_MODE as Record<string, string>)[bootState];
  
  if (!mode) {
    return KERNEL_MODES.INITIALIZING;
  }
  
  // Se está READY mas degradado, retorna DEGRADED ao invés de NORMAL
  if (mode === KERNEL_MODES.NORMAL && isDegraded) {
    return KERNEL_MODES.DEGRADED;
  }
  
  return mode;
}

// Capacidades do sistema (features que podem ser habilitadas/desabilitadas)
var CAPABILITIES = {
  AUTH: 'AUTH',
  NAVIGATION: 'NAVIGATION',
  TELEMETRY: 'TELEMETRY',
  UI_COMPONENTS: 'UI_COMPONENTS',
  SHELL: 'SHELL',
  MAIN_CONTENT: 'MAIN_CONTENT',
  PLATFORM_HOOKS: 'PLATFORM_HOOKS',
  TOAST: 'TOAST',
  TICKER: 'TICKER',
  PERMISSIONS: 'PERMISSIONS'
};

// Estado padrão das capacidades por modo
var CAPABILITY_DEFAULTS = {
  INITIALIZING: {
    AUTH: false,
    NAVIGATION: false,
    TELEMETRY: false,
    UI_COMPONENTS: false,
    SHELL: false,
    MAIN_CONTENT: false,
    PLATFORM_HOOKS: false,
    TOAST: false,
    TICKER: false,
    PERMISSIONS: false
  },
  NORMAL: {
    AUTH: true,
    NAVIGATION: true,
    TELEMETRY: true,
    UI_COMPONENTS: true,
    SHELL: true,
    MAIN_CONTENT: true,
    PLATFORM_HOOKS: true,
    TOAST: true,
    TICKER: true,
    PERMISSIONS: true
  },
  DEGRADED: {
    AUTH: true,
    NAVIGATION: true,
    TELEMETRY: true,
    UI_COMPONENTS: true,
    SHELL: true,
    MAIN_CONTENT: true,
    PLATFORM_HOOKS: false,
    TOAST: true,
    TICKER: false,
    PERMISSIONS: true
  },
  MAINTENANCE: {
    AUTH: true,
    NAVIGATION: false,
    TELEMETRY: true,
    UI_COMPONENTS: false,
    SHELL: true,
    MAIN_CONTENT: false,
    PLATFORM_HOOKS: false,
    TOAST: true,
    TICKER: false,
    PERMISSIONS: false
  },
  RECOVERY: {
    AUTH: true,
    NAVIGATION: false,
    TELEMETRY: true,
    UI_COMPONENTS: false,
    SHELL: true,
    MAIN_CONTENT: false,
    PLATFORM_HOOKS: false,
    TOAST: true,
    TICKER: false,
    PERMISSIONS: false
  },
  FAILED: {
    AUTH: false,
    NAVIGATION: false,
    TELEMETRY: true,
    UI_COMPONENTS: false,
    SHELL: false,
    MAIN_CONTENT: false,
    PLATFORM_HOOKS: false,
    TOAST: true,
    TICKER: false,
    PERMISSIONS: false
  }
};

// Eventos emitidos pelo Kernel
var KERNEL_EVENTS = {
  // Lifecycle
  INITIALIZED: 'kernel:initialized',
  READY: 'kernel:ready',
  SHUTDOWN: 'kernel:shutdown',
  
  // Modo
  MODE_CHANGE: 'kernel:mode-change',
  MODE_DEGRADED: 'kernel:mode-degraded',
  MODE_RECOVERY: 'kernel:mode-recovery',
  MODE_NORMAL: 'kernel:mode-normal',
  
  // Capacidades
  CAPABILITY_ENABLED: 'kernel:capability-enabled',
  CAPABILITY_DISABLED: 'kernel:capability-disabled',
  CAPABILITY_CHANGE: 'kernel:capability-change',
  
  // Saúde
  HEALTH_UPDATE: 'kernel:health-update',
  HEALTH_DEGRADED: 'kernel:health-degraded',
  HEALTH_RECOVERED: 'kernel:health-recovered',
  
  // Estado
  STATE_CHANGE: 'kernel:state-change',
  CONTEXT_UPDATE: 'kernel:context-update',
  
  // #3: Circuit Breaker
  CIRCUIT_BREAKER_CHANGE: 'kernel:circuit-breaker-change',
  
  // #10: Sincronização
  SYNC_STATE: 'kernel:sync-state'
};

// Transições válidas entre modos
var MODE_TRANSITIONS = {
  INITIALIZING: ['NORMAL', 'DEGRADED', 'FAILED'],
  NORMAL: ['DEGRADED', 'MAINTENANCE', 'RECOVERY', 'FAILED'],
  DEGRADED: ['NORMAL', 'RECOVERY', 'MAINTENANCE', 'FAILED'],
  MAINTENANCE: ['NORMAL', 'DEGRADED', 'RECOVERY'],
  RECOVERY: ['NORMAL', 'DEGRADED', 'FAILED'],
  FAILED: ['RECOVERY', 'INITIALIZING']
};

// Verificar se transição é válida
function isValidTransition(fromMode: string, toMode: string) {
  var allowed = (MODE_TRANSITIONS as Record<string, string[]>)[fromMode];
  return allowed && allowed.indexOf(toMode) !== -1;
}

// Obter capacidades padrão para um modo
function getDefaultCapabilities(mode: string) {
  return Object.assign({}, (CAPABILITY_DEFAULTS as Record<string, Record<string, boolean>>)[mode] || CAPABILITY_DEFAULTS.FAILED);
}

// Listar todas as capacidades
function getAllCapabilities() {
  return Object.keys(CAPABILITIES);
}

// Listar todos os modos
function getAllModes() {
  return Object.keys(KERNEL_MODES);
}

export {
  MODULE_ID,
  VERSION,
  KERNEL_MODES,
  BOOT_STATES,
  STATE_TO_MODE,
  mapStateToMode,
  CAPABILITIES,
  CAPABILITY_DEFAULTS,
  KERNEL_EVENTS,
  MODE_TRANSITIONS,
  isValidTransition,
  getDefaultCapabilities,
  getAllCapabilities,
  getAllModes
};

export default {
  MODULE_ID: MODULE_ID,
  VERSION: VERSION,
  KERNEL_MODES: KERNEL_MODES,
  BOOT_STATES: BOOT_STATES,
  STATE_TO_MODE: STATE_TO_MODE,
  mapStateToMode: mapStateToMode,
  CAPABILITIES: CAPABILITIES,
  CAPABILITY_DEFAULTS: CAPABILITY_DEFAULTS,
  KERNEL_EVENTS: KERNEL_EVENTS,
  MODE_TRANSITIONS: MODE_TRANSITIONS,
  isValidTransition: isValidTransition,
  getDefaultCapabilities: getDefaultCapabilities,
  getAllCapabilities: getAllCapabilities,
  getAllModes: getAllModes
};
