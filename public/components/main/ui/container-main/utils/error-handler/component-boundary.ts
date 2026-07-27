// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: component-boundary
// PURPOSE: Component Error Boundary
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createComponentBoundaryFactory() — exported function
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

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.error-handler.component-boundary';

export function createComponentBoundaryFactory(options: Record<string, any> = {}) {
  const { wrappers, errorStore, logger } = options;

  return {
    // Cria boundary para componente
    create(componentId: string, boundaryOptions: Record<string, any> = {}) {
      const { onError, fallbackUI, maxRetries = 3 } = boundaryOptions;
      
      let _errorState: unknown = null;
      let _retryCount = 0;
      
      return {
        wrap(method: string) {
          return wrappers.withErrorBoundary(method, {
            moduleId: componentId,
            onError: (errorInfo: unknown) => {
              _errorState = errorInfo;
              onError?.(errorInfo);
            },
            recover: true,
            fallback: fallbackUI
          });
        },
        
        hasError: () => _errorState !== null,
        getError: () => _errorState,
        clearError: () => { _errorState = null; _retryCount = 0; },
        
        async retry(fn: (...args: unknown[]) => void) {
          if (_retryCount >= maxRetries) {
            logger?.warn(`Max retries (${maxRetries}) reached for ${componentId}`);
            return false;
          }
          
          _retryCount++;
          _errorState = null;
          
          try {
            await fn();
            return true;
          } catch (e) {
            _errorState = errorStore.createErrorInfo(e, { moduleId: componentId, retryCount: _retryCount });
            return false;
          }
        },
        
        getRetryCount: () => _retryCount,
        canRetry: () => _retryCount < maxRetries
      };
    }
  };
}

export default { createComponentBoundaryFactory };
