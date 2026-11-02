// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.8.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core (barrel)
// PURPOSE: Ponto único de entrada do Core Enterprise — namespace,
//          exports, exposição global e health aggregation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createEarlyLogger from /core/runtime/early-boot-logger.js
//   EventBusInstance, EventBusClass, PRIORITY, VERSION from ./js/event-bus/index.js
//   AUTH_EVENTS, AUTH_STATES, ROUTER_EVENTS from /core/runtime/events/index.js
//   AssetLoaderModule from ./js/AssetLoader.js
//   EnterpriseLoaderModule from ./js/EnterpriseLoader.js
//   CoreKernel, FEATURE_STATUS, PRIORITY, Governance, ... from ./kernel/index.js
//   KernelGovernancePanel from ./kernel/ui/index.js
//   PermissionResolver from ./runtime/permissions/permission-resolver.js
//
// EXPORTS:
//   VERSION — Versão do módulo core
//   MODULE_ID — Identificador único ('core')
//   EventBus — Instância singleton do EventBus
//   EventBusClass — Classe EventBus (para testes/extensão)
//   EventBusPriority — Constantes de prioridade
//   EventBusVersion — Versão do EventBus
//   AUTH_EVENTS — Contratos de eventos de autenticação
//   AUTH_STATES — Estados de autenticação
//   ROUTER_EVENTS — Contratos de eventos do router
//   AssetLoader — Carregamento dinâmico de assets
//   EnterpriseLoader — Orquestrador de boot em fases
//   CoreKernel — Feature Kernel (P0/P1/P2)
//   FEATURE_STATUS — Status de features
//   PRIORITY — Prioridades de features
//   createFeatureRegistry — Factory de registry
//   Governance — Facade AAA+ de governança
//   KernelVersion — Versão do kernel
//   KernelModuleId — ID do módulo kernel
//   KernelGovernancePanel — UI de diagnóstico
//   PermissionResolver — UARPS Soberano de permissões
//   Core (default) — Namespace unificado com healthCheck()/info()
//
// PROVIDES (window.*):
//   window.Core — Namespace completo
//   window.Governance — Facade AAA+
//   window.PermissionResolver — UARPS Soberano
//   window.__dev.core — Ferramentas de diagnóstico
//
// INITIALIZES:
//   RuntimeConsumer — integração com RuntimeContext (quando disponível)
//   PermissionResolver — init (quando auth disponível)
// ═══════════════════════════════════════════════════════════════
// @changelog v2.9.0-STRICT-MODE: Em strict mode, exposição via windowAdapter apenas (NR-FULL)
// @changelog v2.8.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v2.7.0-EARLY-BOOT-LOGGER - Migração: console.* → createEarlyLogger
// @changelog v2.6.1-ENTERPRISE-AAA - Fix: Duplicate export unificado
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '2.9.0-STRICT-MODE';
export const MODULE_ID = 'core';

// ═══════════════════════════════════════════════════════════════
// EARLY BOOT LOGGER
// ═══════════════════════════════════════════════════════════════
import { createEarlyLogger } from '/core/runtime/early-boot-logger.js';

// v2.7.0: Early Boot Logger - buffer + replay no Logger Enterprise
const _earlyLog = createEarlyLogger(MODULE_ID);

// ═══════════════════════════════════════════════════════════════
// EVENTBUS - Sistema de Eventos Enterprise
// ═══════════════════════════════════════════════════════════════
import EventBusInstance, { EventBus as EventBusClass, PRIORITY as EventBusPriority, VERSION as EventBusVersion } from './js/event-bus/index.js';

const EventBus = EventBusInstance;
export { EventBusClass, EventBusPriority, EventBusVersion };

// ═══════════════════════════════════════════════════════════════
// EVENTS CONTRACTS - Contratos de Eventos (AUTH, ROUTER, etc)
// P18EC: Re-export from central catalog
// ═══════════════════════════════════════════════════════════════
export { AUTH_EVENTS, AUTH_STATES } from '/core/runtime/events/catalog/auth.events.js';
export { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';

// ═══════════════════════════════════════════════════════════════
// ASSET LOADER - Carregamento de CSS/JS
// ═══════════════════════════════════════════════════════════════
import * as AssetLoaderModule from './js/AssetLoader.js';
const AssetLoader = (AssetLoaderModule as any).default || AssetLoaderModule;

// ═══════════════════════════════════════════════════════════════
// ENTERPRISE LOADER - Loaders de Inicialização
// ═══════════════════════════════════════════════════════════════
import * as EnterpriseLoaderModule from './js/EnterpriseLoader.js';
const EnterpriseLoader = (EnterpriseLoaderModule as any).default || EnterpriseLoaderModule;

// ═══════════════════════════════════════════════════════════════
// FEATURE KERNEL - P0/P1/P2 Governance (AAA+)
// ═══════════════════════════════════════════════════════════════
import CoreKernel, {
  // P0: Base
  FEATURE_STATUS,
  PRIORITY,
  createFeatureRegistry,
  // P0: Runtime Consumer
  init as initRuntimeConsumer,
  getContext,
  hasContext,
  getSnapshot,
  getMode,
  getPhase,
  isReady,
  isDegraded,
  isInMaintenance,
  isFailed,
  isInRecovery,
  canOperate,
  canEnableFeature,
  canAttemptRecovery,
  // P1: Enhanced
  isCapabilityEnabled,
  canNavigate,
  canShowUI,
  getCapabilities,
  canPerformHeavyOperations,
  // P2: AAA+ Governance
  Governance,
  VERSION as KernelVersion,
  MODULE_ID as KernelModuleId
} from './kernel/index.js';

// ═══════════════════════════════════════════════════════════════
// GOVERNANCE PANEL UI - P2 AAA+
// ═══════════════════════════════════════════════════════════════
import KernelGovernancePanel from './kernel/ui/index.js';

// ═══════════════════════════════════════════════════════════════
// PERMISSION RESOLVER - UARPS Soberano (AAA+ Governance)
// @rule Módulos do Grupo 2 consomem modelo resolvido
// @rule Se não passou pelo PermissionResolver, não é permissão válida
// ═══════════════════════════════════════════════════════════════
import PermissionResolver from './runtime/permissions/permission-resolver.js';

// ═══════════════════════════════════════════════════════════════
// RE-EXPORTS (bloco único — sem duplicatas)
// ═══════════════════════════════════════════════════════════════
export {
  EventBus,
  AssetLoader,
  EnterpriseLoader,
  CoreKernel,
  FEATURE_STATUS,
  PRIORITY,
  createFeatureRegistry,
  Governance,
  KernelVersion,
  KernelModuleId,
  KernelGovernancePanel,
  PermissionResolver
};

// ═══════════════════════════════════════════════════════════════
// CORE OBJECT - Namespace unificado
// ═══════════════════════════════════════════════════════════════
const Core = {
  version: VERSION,
  moduleId: MODULE_ID,
  
  // EventBus
  EventBus: EventBusInstance,
  EventBusClass,
  EventBusPriority,
  
  // Loaders
  AssetLoader,
  EnterpriseLoader,
  
  // Feature Kernel (P0/P1/P2)
  Kernel: CoreKernel,
  
  // Governance Facade (AAA+)
  Governance,
  
  // Governance Panel UI (AAA+)
  GovernancePanel: KernelGovernancePanel,
  
  // Permission Resolver (UARPS Soberano)
  PermissionResolver,
  
  // Runtime Consumer shortcuts
  RuntimeConsumer: {
    init: initRuntimeConsumer,
    getContext,
    hasContext,
    getSnapshot,
    getMode,
    getPhase,
    isReady,
    isDegraded,
    isInMaintenance,
    isFailed,
    isInRecovery,
    canOperate,
    canEnableFeature,
    canAttemptRecovery,
    isCapabilityEnabled,
    canNavigate,
    canShowUI,
    getCapabilities,
    canPerformHeavyOperations
  },
  
  // Utilities
  getVersion: () => VERSION,
  getKernelVersion: () => KernelVersion,
  
  // Health Check (enhanced with Kernel + PermissionResolver)
  healthCheck: () => {
    const checks = {
      eventBus: EventBusInstance?.healthCheck?.() || { status: 'UNKNOWN' },
      kernel: CoreKernel?.HealthAggregator?.healthCheck?.() || { status: 'UNKNOWN' },
      governance: Governance?.healthCheck?.() || { status: 'UNKNOWN' },
      permissionResolver: PermissionResolver?.healthCheck?.() || { status: 'UNKNOWN' }
    };
    
    let allHealthy = true;
    for (const key of Object.keys(checks)) {
      const c = checks[key as keyof typeof checks] as { status?: string };
      if (c.status !== 'HEALTHY' && c.status !== 'OK') {
        allHealthy = false;
        break;
      }
    }
    
    return {
      status: allHealthy ? 'HEALTHY' : 'DEGRADED',
      version: VERSION,
      kernelVersion: KernelVersion,
      moduleId: MODULE_ID,
      checks,
      timestamp: Date.now()
    };
  },
  
  // Info (enhanced with Kernel + PermissionResolver)
  info() {
    return {
      version: VERSION,
      kernelVersion: KernelVersion,
      moduleId: MODULE_ID,
      modules: {
        eventBus: EventBusInstance?.info?.() || { version: 'unknown' },
        kernel: CoreKernel?.RuntimeConsumer?.info?.() || { version: 'unknown' },
        governance: Governance?.info?.() || { version: 'unknown' },
        governancePanel: KernelGovernancePanel?.info?.() || { version: 'unknown' },
        permissionResolver: PermissionResolver?.info?.() || { version: 'unknown' }
      },
      healthCheck: this.healthCheck(),
      timestamp: Date.now()
    };
  }
};

// ═══════════════════════════════════════════════════════════════
// EXPOSIÇÃO GLOBAL (AAA+ Pattern + STRICT MODE)
// ═══════════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
  const strictMode = isStrict();

  // Core namespace - sempre inicializado (contém windowAdapter)
  window.Core = window.Core || {};

  // v2.9.0: Em strict mode, exposição adicional deve ser via windowAdapter
  if (!strictMode) {
    for (const key of Object.keys(Core)) {
      window.Core[key] = (Core as Record<string, unknown>)[key];
    }
    // Governance global (AAA+ Facade)
    window.Governance = Governance;
    // PermissionResolver global (UARPS Soberano)
    window.PermissionResolver = PermissionResolver;
  } else {
    recordViolation('CORE_STRICT_MODE_BLOCK', { module: MODULE_ID, action: 'window.Governance/PermissionResolver exposure blocked' });
  }

  // Dev tools
  window.__dev = window.__dev || {};
  window.__dev.core = {
    getVersion: () => VERSION,
    getKernelVersion: () => KernelVersion,
    info: () => Core.info(),
    healthCheck: () => Core.healthCheck(),
    // P2: Governance diagnostics
    governance: () => Governance?.info?.(),
    manifest: () => CoreKernel?.FeatureManifest?.info?.(),
    health: () => (CoreKernel?.HealthAggregator as unknown as { getSummary?: () => unknown })?.getSummary?.(),
    telemetry: () => CoreKernel?.TelemetryEmitter?.getMetrics?.(),
    // UARPS Soberano diagnostics
    permissions: () => PermissionResolver?.info?.(),
    permissionModel: () => PermissionResolver?.getModel?.()
  };
  
  // Initialize RuntimeConsumer when RuntimeContext becomes available
  const _initKernelIntegration = () => {
    const wa = window.Core?.windowAdapter as any;
    const _hasRC = (wa && wa.get) ? !!(wa.get('RuntimeContext') || wa.get('ApplicationKernel')) : !!(window.RuntimeContext || window.ApplicationKernel);
    if (_hasRC) {
      initRuntimeConsumer();
      _earlyLog.info('Feature Kernel integrated with RuntimeContext');
    }
  };
  
  // Initialize PermissionResolver after auth is available
  const _initPermissionResolver = () => {
    try {
      PermissionResolver.init();
      _earlyLog.info('PermissionResolver (UARPS Soberano) initialized');
    } catch (e: any) {
      _earlyLog.warn(`PermissionResolver init deferred: ${e.message}`);
    }
  };
  
  // Try immediately
  _initKernelIntegration();
  _initPermissionResolver();
  
  // Also try after DOM ready (in case Bootstrap hasn't run yet)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      _initKernelIntegration();
      _initPermissionResolver();
    });
  }
}

export default Core;
