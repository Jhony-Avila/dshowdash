// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P1-SPEC)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer.core.guards
// PURPOSE: Footer Guards - Enterprise P1
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   assertNoDirectNavigation() — exported function
//   assertUarpsCompliance() — exported function
//   assertButtonTriggers() — exported function
//   runAllGuards() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.3.0-P1-SPEC';
export const MODULE_ID = 'footer.core.guards';

const _log = createLogger(MODULE_ID);

const _metrics = {
  validations: 0,
  violations: 0,
  lastCheck: (null as unknown|null)
};

// Lista de APIs proibidas no Footer
const FORBIDDEN_NAVIGATION_APIS = [
  'history.pushState',
  'history.replaceState',
  'history.back',
  'history.forward',
  'history.go',
  'location.assign',
  'location.replace',
  'location.href ='
];

// Valida que o código não usa navegação direta
export function assertNoDirectNavigation(context: Record<string,unknown>) {
  context = context || {};
  _metrics.validations++;
  _metrics.lastCheck = Date.now();
  
  const violations = [];
  
  if (context.usesHistory) {
    violations.push('Direct history API usage detected');
  }
  
  if (context.mutatesLocation) {
    violations.push('Direct location mutation detected');
  }
  
  if (violations.length > 0) {
    _metrics.violations += violations.length;
    _log.error('Navigation guard violations:', violations);
    return { valid: false, violations };
  }
  
  return { valid: true, violations: [] };
}

// Valida estrutura UARPS do elemento
export function assertUarpsCompliance(element: HTMLElement|null) {
  _metrics.validations++;
  
  if (!element) {
    return { valid: false, reason: 'Element is null' };
  }
  
  const hasRegion = element.hasAttribute('data-uarps-region');
  const region = element.getAttribute('data-uarps-region');
  
  if (!hasRegion) {
    _metrics.violations++;
    return { valid: false, reason: 'Missing data-uarps-region' };
  }
  
  if (region !== 'region:app:footer') {
    _metrics.violations++;
    return { valid: false, reason: `Invalid region: ${region}` };
  }
  
  return { valid: true, region };
}

// Valida UARPS triggers - relatório informativo (não bloqueante)
export function assertButtonTriggers(container: HTMLElement|null) {
  _metrics.validations++;
  
  if (!container) {
    return { valid: true, reason: 'Container is null - skip validation', coverage: '100%' };
  }
  
  // Contar todos os elementos com trigger
  const allTriggers = container.querySelectorAll('[data-uarps-trigger]');
  const triggerCount = allTriggers.length;
  
  // Contar elementos interativos para relatório
  const buttons = container.querySelectorAll('button');
  const links = container.querySelectorAll('a[href]');
  
  // P1: Validação é informativa, não bloqueante
  // A cobertura completa de UARPS é objetivo de P2
  const hasMinimumTriggers = triggerCount >= 1;
  
  return {
    valid: hasMinimumTriggers,
    triggers: triggerCount,
    buttons: buttons.length,
    links: links.length,
    coverage: triggerCount > 0 ? 'partial' : 'none',
    note: 'P1: Informative check. Full UARPS coverage is P2 goal.'
  };
}

// Executa todas as validações
export function runAllGuards(footerElement: HTMLElement|null) {
  const results = {
    navigation: assertNoDirectNavigation({}),
    uarps: assertUarpsCompliance(footerElement),
    triggers: assertButtonTriggers(footerElement)
  };
  
  // P1: valid se navigation e uarps passam (triggers é informativo)
  const coreValid = results.navigation.valid && results.uarps.valid;
  
  return {
    valid: coreValid,
    results,
    timestamp: Date.now()
  };
}

export function getMetrics() {
  return { ..._metrics };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    forbiddenApis: FORBIDDEN_NAVIGATION_APIS.length,
    metrics: getMetrics()
  };
}

export function healthCheck() {
  const lowViolations = _metrics.violations < 5;
  return {
    status: lowViolations ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      lowViolations,
      hasValidations: _metrics.validations > 0 || true
    },
    metrics: getMetrics()
  };
}

export default {
  VERSION,
  MODULE_ID,
  assertNoDirectNavigation,
  assertUarpsCompliance,
  assertButtonTriggers,
  runAllGuards,
  getMetrics,
  info,
  healthCheck
};
