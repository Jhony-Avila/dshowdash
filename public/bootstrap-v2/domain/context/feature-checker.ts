// Context Feature Checker
// @version 1.1.1-CONTRACTS
// @changelog v1.1.1-CONTRACTS: Dependency Contract formalizado
// @changelog v1.1.0-MODULAR: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// RECEIVES (via factory options):
//   options.stateStore — state store with getDegradations()
// PROVIDES: createFeatureChecker() factory returning:
//   isDisabled(), isAllowed(), getDegradations(), getDegradationCount()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.domain.context.feature-checker';

interface Degradation {
  disabled: string[];
  allowed: string[];
}

interface FeatureCheckerStateStore {
  getDegradations(): Degradation[];
}

interface FeatureCheckerOptions {
  stateStore?: FeatureCheckerStateStore;
}

export function createFeatureChecker(options: FeatureCheckerOptions) {
  if (options === undefined) options = {};
  const stateStore = options.stateStore!;

  return {
    isDisabled: function(featureId: string) {
      const degradations = stateStore.getDegradations();
      
      for (let i = 0; i < degradations.length; i++) {
        const deg = degradations[i];
        
        // Se wildcard, verifica se está na lista de permitidos
        if (deg.disabled.indexOf('*') !== -1) {
          return deg.allowed.indexOf(featureId) === -1;
        }
        
        // Verifica se está explicitamente desabilitado
        if (deg.disabled.indexOf(featureId) !== -1) {
          return true;
        }
      }
      
      return false;
    },

    isAllowed: function(featureId: string) {
      const degradations = stateStore.getDegradations();
      
      if (degradations.length === 0) {
        return true;
      }
      
      return !this.isDisabled(featureId);
    },

    getDegradations: function() {
      return stateStore.getDegradations().slice();
    },

    getDegradationCount: function() {
      return stateStore.getDegradations().length;
    }
  };
}

export default { createFeatureChecker };
