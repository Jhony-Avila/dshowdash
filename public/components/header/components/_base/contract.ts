// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/_base/contract
// PURPOSE: Subcomponent Contract - Enterprise AAA Standard
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   REQUIRED_METHODS — exported value
//   RECOMMENDED_METHODS — exported value
//   REQUIRED_PROPERTIES — exported value
//   RECOMMENDED_PROPERTIES — exported value
//   DEFAULT_CAPABILITIES — exported value
//   DEFAULT_MOUNT_TIMEOUT — exported value
//   CRITICALITY — exported value
//   COMPONENT_STATUS — exported value
//   validateContract() — exported function
//   resolveCapabilities() — exported function
//   canReorder() — exported function
//   canHide() — exported function
//   createMountWithTimeout() — exported function
//   createFallbackHTML() — exported function
//   createLoadingHTML() — exported function
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

export const VERSION = '2.2.0-ENTERPRISE-AAA';
export const MODULE_ID = 'header/components/_base/contract';

// Métodos obrigatórios que cada subcomponente DEVE implementar
export const REQUIRED_METHODS = ['mount', 'unmount'];

// Métodos recomendados (Enterprise AAA)
export const RECOMMENDED_METHODS = ['healthCheck', 'info', 'destroy'];

// Propriedades obrigatórias
export const REQUIRED_PROPERTIES = ['VERSION', 'id'];

// Propriedades recomendadas
export const RECOMMENDED_PROPERTIES = ['MODULE_ID', 'capabilities'];

// Capabilities padrão para subcomponentes
export const DEFAULT_CAPABILITIES = {
  reorderable: true,
  hideable: true,
  critical: false,
  refreshable: false,
  configurable: false
};

// Timeout padrão para mount de subcomponente (ms)
export const DEFAULT_MOUNT_TIMEOUT = 5000;

// Classificação de criticidade
export const CRITICALITY = {
  CRITICAL: 'critical',
  IMPORTANT: 'important',
  OPTIONAL: 'optional'
};

// Status de subcomponente
export const COMPONENT_STATUS = {
  PENDING: 'pending',
  LOADING: 'loading',
  MOUNTED: 'mounted',
  DEGRADED: 'DEGRADED',
  FAILED: 'failed',
  UNMOUNTED: 'unmounted',
  TIMEOUT: 'timeout'
};

// Valida se um módulo/instância implementa o contrato mínimo
export function validateContract(instance: Record<string,unknown>, componentName = 'unknown') {
  const issues = [];
  const warnings = [];

  // Verificar métodos obrigatórios
  for (const method of REQUIRED_METHODS) {
    if (typeof instance[method] !== 'function') {
      issues.push(`Missing required method: ${method}()`);
    }
  }

  // Verificar métodos recomendados (apenas warnings)
  for (const method of RECOMMENDED_METHODS) {
    if (typeof instance[method] !== 'function') {
      warnings.push(`Missing recommended method: ${method}()`);
    }
  }

  // v2.2.0: Verificar VERSION - inclui _governanceVersion injetado pelo loader
  // @ts-expect-error TS migration - TS2339
  const hasVersion = instance.VERSION || instance._governanceVersion || instance.constructor?.VERSION;
  if (!hasVersion) {
    issues.push('Missing required property: VERSION');
  }

  // v2.1.0: Verificar 'id' - inclui _governanceId injetado pelo loader
  // @ts-expect-error TS migration - TS2339
  const hasId = instance.id || instance._governanceId || instance.constructor?.id || instance.componentId;
  if (!hasId) {
    warnings.push('Missing property: id (required for governance)');
  }

  // v2.1.0: Verificar capabilities - inclui _governanceCapabilities injetado pelo loader
  // @ts-expect-error TS migration - TS2339
  const hasCapabilities = instance.capabilities || instance._governanceCapabilities || instance.constructor?.capabilities;
  if (!hasCapabilities) {
    warnings.push('Missing property: capabilities (using defaults)');
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    componentName,
    compliance: {
      required: REQUIRED_METHODS.length - issues.filter(i => i.includes('required method')).length,
      requiredTotal: REQUIRED_METHODS.length,
      recommended: RECOMMENDED_METHODS.length - warnings.filter(w => w.includes('recommended')).length,
      recommendedTotal: RECOMMENDED_METHODS.length
    },
    governance: {
      hasId: !!hasId,
      hasVersion: !!hasVersion,
      hasCapabilities: !!hasCapabilities,
      capabilities: hasCapabilities || DEFAULT_CAPABILITIES
    }
  };
}

// Resolve capabilities de um componente (com fallback para defaults)
export function resolveCapabilities(instance: Record<string,unknown>) {
  // @ts-expect-error TS migration - TS2339
  const explicit = instance.capabilities || instance._governanceCapabilities || instance.constructor?.capabilities;
  return { ...DEFAULT_CAPABILITIES, ...explicit };
}

// Verifica se componente pode ser reordenado
export function canReorder(instance: Record<string,unknown>) {
  const caps = resolveCapabilities(instance);
  return caps.reorderable && !caps.critical;
}

// Verifica se componente pode ser ocultado
export function canHide(instance: Record<string,unknown>) {
  const caps = resolveCapabilities(instance);
  return caps.hideable && !caps.critical;
}

// Cria wrapper com timeout para mount
export function createMountWithTimeout(instance: Record<string,unknown>, timeoutMs = DEFAULT_MOUNT_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Mount timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    // @ts-expect-error TS migration - TS2349
    Promise.resolve(instance.mount())
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

// Gera HTML de fallback para componente que falhou
export function createFallbackHTML(componentName: string, error: unknown = null) {
  const safeError = error ? String(error).substring(0, 50) : 'Erro desconhecido';
  return `<div class="header-component-fallback" data-component="${componentName}" data-status="failed" title="${safeError}">
    <span class="fallback-icon">⚠</span>
  </div>`;
}

// Gera HTML de loading placeholder
export function createLoadingHTML(componentName: string) {
  return `<div class="header-component-loading" data-component="${componentName}" data-status="loading">
    <span class="loading-pulse"></span>
  </div>`;
}

export default {
  VERSION,
  MODULE_ID,
  REQUIRED_METHODS,
  RECOMMENDED_METHODS,
  REQUIRED_PROPERTIES,
  RECOMMENDED_PROPERTIES,
  DEFAULT_CAPABILITIES,
  DEFAULT_MOUNT_TIMEOUT,
  CRITICALITY,
  COMPONENT_STATUS,
  validateContract,
  resolveCapabilities,
  canReorder,
  canHide,
  createMountWithTimeout,
  createFallbackHTML,
  createLoadingHTML
};
